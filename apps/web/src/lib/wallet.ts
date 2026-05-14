/**
 * Wallet helpers — model pay-per-use thay subscription PRO.
 *
 * Quy tắc:
 *  - `users.balance_vnd` là cache denormalized của ledger `transactions`. Source
 *    of truth vẫn là ledger.
 *  - Mọi mutation balance PHẢI đi qua `chargeReading` / `creditBalance` — không
 *    UPDATE balance trực tiếp ngoài hai hàm này (trừ admin tool).
 *  - Hàm chargeReading dùng `db.transaction()` + atomic guard `WHERE balance >= price`
 *    để chống race condition: 2 request đồng thời chỉ 1 cái trừ được nếu vừa đủ.
 */
import { getDb, users, transactions, prices } from '@tuvi/db';
import { eq, and, gte, sql } from 'drizzle-orm';
import { publish } from './sse-bus';

/** Mức nạp tối thiểu (VND). */
export const MIN_TOPUP_VND = 20_000;

/** Giá mặc định 1 lần luận giải (VND). Fallback khi bảng `prices` rỗng. */
export const DEFAULT_READING_PRICE_VND = 5_000;

let cachedPrice: number | null = null;
let cachedAt = 0;

/**
 * Đọc giá luận giải hiện hành. Cache trong-process 60s để tránh select mỗi
 * request mà vẫn cho phép admin đổi giá runtime (qua UPDATE bảng prices).
 */
export async function getReadingPriceVnd(): Promise<number> {
  if (cachedPrice != null && Date.now() - cachedAt < 60_000) return cachedPrice;
  try {
    const db = getDb();
    const [row] = await db
      .select({ amountVnd: prices.amountVnd })
      .from(prices)
      .where(eq(prices.action, 'analyze'))
      .limit(1);
    cachedPrice = row?.amountVnd ?? DEFAULT_READING_PRICE_VND;
  } catch {
    cachedPrice = DEFAULT_READING_PRICE_VND;
  }
  cachedAt = Date.now();
  return cachedPrice;
}

export class InsufficientBalanceError extends Error {
  constructor(public balance: number, public required: number) {
    super('Số dư không đủ');
    this.name = 'InsufficientBalanceError';
  }
}

export interface ChargeOptions {
  /** Loại dịch vụ để hiển thị lịch sử: 'tuvi' | 'tu-tru' | 'tarot' | 'hoang-dao' | ... */
  service: string;
  /** Metadata tự do — chartId, hash, ... */
  metadata?: Record<string, unknown>;
  /** Note hiển thị user. Mặc định: 'Luận giải <service>'. */
  note?: string;
}

export interface ChargeResult {
  txId: string;
  balanceAfter: number;
  amountCharged: number;
}

/**
 * Trừ tiền cho 1 lần luận giải. Atomic: balance check + UPDATE + INSERT trong
 * cùng db.transaction(). Throw InsufficientBalanceError nếu thiếu, throw Error
 * khác nếu DB lỗi.
 *
 * Caller wrap luôn trong route handler — chỉ catch InsufficientBalanceError để
 * trả 402; lỗi khác để propagate 500.
 */
export async function chargeReading(
  userId: string,
  opts: ChargeOptions,
): Promise<ChargeResult> {
  const price = await getReadingPriceVnd();
  const db = getDb();

  const result = await db.transaction(async (tx) => {
    // UPDATE ... WHERE balance >= price RETURNING balance — atomic check + deduct.
    // Nếu balance < price, 0 row trả về → throw để rollback.
    const [updated] = await tx
      .update(users)
      .set({ balanceVnd: sql`${users.balanceVnd} - ${price}` })
      .where(and(eq(users.id, userId), gte(users.balanceVnd, price)))
      .returning({ balanceVnd: users.balanceVnd });

    if (!updated) {
      // Check user tồn tại để phân biệt "không có user" với "thiếu tiền".
      const [u] = await tx
        .select({ balanceVnd: users.balanceVnd })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (!u) throw new Error('User không tồn tại');
      throw new InsufficientBalanceError(u.balanceVnd, price);
    }

    const [txn] = await tx
      .insert(transactions)
      .values({
        userId,
        type: 'charge',
        status: 'completed',
        amountVnd: -price, // âm = trừ
        note: opts.note ?? `Luận giải ${opts.service}`,
        metadata: { service: opts.service, ...(opts.metadata ?? {}) },
        completedAt: new Date(),
      })
      .returning({ id: transactions.id });

    return { txId: txn.id, balanceAfter: updated.balanceVnd, amountCharged: price };
  });

  publish(userId, 'balance', {
    balanceVnd: result.balanceAfter,
    delta: -result.amountCharged,
    reason: 'charge',
    service: opts.service,
  });

  return result;
}

export interface CreditOptions {
  type: 'topup' | 'admin_credit' | 'refund';
  amountVnd: number;
  /** transactionId của row đã pending → caller chỉ approve, không tạo row mới. */
  approveTxId?: string;
  metadata?: Record<string, unknown>;
  note?: string;
}

export interface CreditResult {
  txId: string;
  balanceAfter: number;
}

/**
 * Cộng tiền vào ví. Hai code path:
 *  1. `approveTxId` cung cấp → UPDATE row pending sang completed (dùng cho topup
 *     manual: user tạo pending khi quét QR, admin approve sau).
 *  2. Không có `approveTxId` → INSERT row mới completed (admin_credit thủ công,
 *     refund tự động).
 *
 * Đều atomic với UPDATE users.balance_vnd trong cùng tx + publish SSE.
 */
export async function creditBalance(
  userId: string,
  opts: CreditOptions,
): Promise<CreditResult> {
  if (opts.amountVnd <= 0) throw new Error('amountVnd phải > 0');

  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(users)
      .set({ balanceVnd: sql`${users.balanceVnd} + ${opts.amountVnd}` })
      .where(eq(users.id, userId))
      .returning({ balanceVnd: users.balanceVnd });

    if (!updated) throw new Error('User không tồn tại');

    let txId: string;
    if (opts.approveTxId) {
      const [txn] = await tx
        .update(transactions)
        .set({
          status: 'completed',
          completedAt: new Date(),
          metadata: opts.metadata ?? undefined,
        })
        .where(eq(transactions.id, opts.approveTxId))
        .returning({ id: transactions.id });
      if (!txn) throw new Error('Transaction không tồn tại');
      txId = txn.id;
    } else {
      const [txn] = await tx
        .insert(transactions)
        .values({
          userId,
          type: opts.type,
          status: 'completed',
          amountVnd: opts.amountVnd,
          note: opts.note ?? null,
          metadata: opts.metadata ?? null,
          completedAt: new Date(),
        })
        .returning({ id: transactions.id });
      txId = txn.id;
    }

    return { txId, balanceAfter: updated.balanceVnd };
  });

  publish(userId, 'balance', {
    balanceVnd: result.balanceAfter,
    delta: opts.amountVnd,
    reason: opts.type,
  });

  return result;
}

/**
 * Trừ tiền thủ công bởi admin (không phải charge service). Atomic; KHÔNG check
 * balance >= amount theo mặc định — cho phép admin trừ về số âm trong các tình
 * huống đặc biệt (sai sót, hoàn hủy). Set `requirePositive=true` nếu muốn safe.
 */
export async function debitBalance(
  userId: string,
  amountVnd: number,
  opts: { note?: string; metadata?: Record<string, unknown>; requirePositive?: boolean } = {},
): Promise<CreditResult> {
  if (amountVnd <= 0) throw new Error('amountVnd phải > 0');

  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const where = opts.requirePositive
      ? and(eq(users.id, userId), gte(users.balanceVnd, amountVnd))
      : eq(users.id, userId);

    const [updated] = await tx
      .update(users)
      .set({ balanceVnd: sql`${users.balanceVnd} - ${amountVnd}` })
      .where(where)
      .returning({ balanceVnd: users.balanceVnd });

    if (!updated) {
      const [u] = await tx
        .select({ balanceVnd: users.balanceVnd })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (!u) throw new Error('User không tồn tại');
      throw new InsufficientBalanceError(u.balanceVnd, amountVnd);
    }

    const [txn] = await tx
      .insert(transactions)
      .values({
        userId,
        type: 'admin_credit', // dùng chung tag admin_credit cho cả cộng và trừ; phân biệt qua dấu amountVnd
        status: 'completed',
        amountVnd: -amountVnd,
        note: opts.note ?? 'Admin trừ ví',
        metadata: opts.metadata ?? null,
        completedAt: new Date(),
      })
      .returning({ id: transactions.id });

    return { txId: txn.id, balanceAfter: updated.balanceVnd };
  });

  publish(userId, 'balance', {
    balanceVnd: result.balanceAfter,
    delta: -amountVnd,
    reason: 'admin_debit',
  });

  return result;
}

export function formatVnd(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
}
