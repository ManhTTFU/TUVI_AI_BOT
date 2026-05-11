/**
 * Casso webhook adapter — auto reconcile bank transfer thành topup completed.
 * Mặc định OFF (CASSO_ENABLED=false). Bật khi admin đăng ký Casso + cấu hình webhook
 * trỏ tới /api/casso/webhook.
 *
 * Logic: Casso đọc SMS bank → tìm "memo" chứa bankRef của transaction pending →
 * match → mark completed → cộng balance + publish SSE.
 *
 * Doc: https://docs.casso.vn
 */
import { getDb, transactions, users } from '@tuvi/db';
import { eq, and, sql } from 'drizzle-orm';
import { publish } from './sse-bus';

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
 * Match incoming Casso tx với pending topup theo bankRef nằm trong description.
 * Trả về số transaction đã reconcile.
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
            eq(transactions.type, 'topup'),
            eq(transactions.status, 'pending'),
          ),
        )
        .limit(1);

      if (!pending) continue;
      if (pending.amountVnd !== item.amount) continue; // số tiền không khớp → bỏ qua, admin duyệt tay.

      const result = await db.transaction(async (tx) => {
        const [updated] = await tx
          .update(users)
          .set({ balanceVnd: sql`${users.balanceVnd} + ${pending.amountVnd}` })
          .where(eq(users.id, pending.userId))
          .returning({ balanceVnd: users.balanceVnd });

        await tx
          .update(transactions)
          .set({
            status: 'completed',
            completedAt: new Date(),
            metadata: {
              ...((pending.metadata as Record<string, unknown>) ?? {}),
              cassoTxId: item.id,
              cassoDescription: item.description,
            },
          })
          .where(eq(transactions.id, pending.id));

        return { userId: pending.userId, balanceVnd: updated?.balanceVnd ?? 0 };
      });

      publish(result.userId, 'balance', {
        balanceVnd: result.balanceVnd,
        source: 'casso_auto',
      });
      publish(result.userId, 'topup-completed', {
        balanceVnd: result.balanceVnd,
        amountVnd: pending.amountVnd,
      });

      count++;
      break; // 1 Casso tx chỉ match 1 pending; break sau khi xử lý.
    }
  }

  return count;
}
