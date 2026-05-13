/**
 * Casso webhook adapter — auto reconcile bank transfer thành PRO subscription
 * approved. Mặc định OFF (CASSO_ENABLED=false). Bật khi admin đăng ký Casso +
 * cấu hình webhook trỏ tới /api/casso/webhook.
 *
 * Logic: Casso đọc SMS bank → tìm "memo" chứa bankRef của transaction pending
 * type='subscription' → match số tiền → extend pro_until + insert
 * subscription_purchases + publish SSE.
 *
 * Doc: https://docs.casso.vn
 */
import {
  getDb,
  transactions,
  users,
  subscriptionPurchases,
  type Plan,
} from '@tuvi/db';
import { eq, and } from 'drizzle-orm';
import { publish } from './sse-bus';
import { LIFETIME_DATE } from './tier';

export interface CassoTxPayload {
  /** ID giao dịch ngân hàng từ Casso */
  id: number;
  /** Nội dung CK người gửi nhập */
  description: string;
  /** Số tiền (VND, dương = vào, âm = ra) */
  amount: number;
  /** Tên TK gửi */
  cusum_balance?: number;
  when: string;
}

export function isCassoEnabled(): boolean {
  return process.env.CASSO_ENABLED === 'true' && !!process.env.CASSO_API_KEY;
}

/**
 * Match incoming Casso tx với pending subscription theo bankRef nằm trong
 * description. Trả về số transaction đã reconcile.
 */
export async function reconcileCassoTransactions(items: CassoTxPayload[]): Promise<number> {
  if (!isCassoEnabled()) return 0;

  const db = getDb();
  let count = 0;

  for (const item of items) {
    if (item.amount <= 0) continue; // chỉ xử lý tiền vào.

    // Tìm bankRef trong description (Casso không enforce format, nên grep upper alphanumeric).
    const refMatches = item.description.toUpperCase().match(/[A-Z]{2,6}[A-Z0-9]{4,12}/g);
    if (!refMatches) continue;

    for (const ref of refMatches) {
      const [pending] = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.bankRef, ref),
            eq(transactions.type, 'subscription'),
            eq(transactions.status, 'pending'),
          ),
        )
        .limit(1);

      if (!pending) continue;
      if (pending.amountVnd !== item.amount) continue; // số tiền không khớp → bỏ qua, admin duyệt tay.

      const meta = (pending.metadata ?? {}) as { plan?: Plan; durationDays?: number | null };
      const plan = meta.plan;
      const durationDays = meta.durationDays ?? null;
      if (!plan) continue;

      const result = await db.transaction(async (tx) => {
        const [u] = await tx
          .select({ proUntil: users.proUntil })
          .from(users)
          .where(eq(users.id, pending.userId))
          .limit(1);
        if (!u) throw new Error('User không tồn tại');

        const now = new Date();
        const base = u.proUntil && u.proUntil > now ? u.proUntil : now;
        const newProUntil =
          durationDays == null || plan === 'lifetime'
            ? LIFETIME_DATE
            : new Date(base.getTime() + durationDays * 24 * 60 * 60 * 1000);

        await tx.update(users).set({ proUntil: newProUntil }).where(eq(users.id, pending.userId));

        const [purchase] = await tx
          .insert(subscriptionPurchases)
          .values({
            userId: pending.userId,
            plan,
            amountVnd: pending.amountVnd,
            transactionId: pending.id,
            proUntilAfter: newProUntil,
          })
          .returning({ id: subscriptionPurchases.id });

        await tx
          .update(transactions)
          .set({
            status: 'completed',
            completedAt: new Date(),
            metadata: {
              ...((pending.metadata as Record<string, unknown>) ?? {}),
              cassoTxId: item.id,
              cassoDescription: item.description,
              purchaseId: purchase.id,
            },
          })
          .where(eq(transactions.id, pending.id));

        return { userId: pending.userId, proUntil: newProUntil };
      });

      publish(result.userId, 'subscription', {
        proUntil: result.proUntil.toISOString(),
        tier: 'PRO',
      });

      count++;
      break; // 1 Casso tx chỉ match 1 pending; break sau khi xử lý.
    }
  }

  return count;
}
