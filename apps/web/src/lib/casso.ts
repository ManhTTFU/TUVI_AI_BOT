/**
 * Casso webhook adapter — auto reconcile bank transfer thành topup completed.
 * Mặc định OFF (CASSO_ENABLED=false). Bật khi admin đăng ký Casso + cấu hình
 * webhook trỏ tới /api/casso/webhook.
 *
 * Logic: Casso đọc SMS bank → tìm bankRef trong description của tx pending
 * type='topup' → match số tiền chính xác → atomic credit qua creditBalance().
 *
 * Doc: https://docs.casso.vn
 */
import { getDb, transactions } from '@tuvi/db';
import { eq, and } from 'drizzle-orm';
import { creditBalance } from './wallet';

export interface CassoTxPayload {
  /** ID giao dịch ngân hàng từ Casso */
  id: number;
  /** Nội dung CK người gửi nhập */
  description: string;
  /** Số tiền (VND, dương = vào, âm = ra) */
  amount: number;
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

    // Tìm bankRef trong description. makeBankRef sinh 5 ký tự A-Z0-9 — grep
    // các token uppercase 4-12 ký tự để bao phủ format hiện tại + biến thể.
    const refMatches = item.description.toUpperCase().match(/[A-Z0-9]{4,12}/g);
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
      if (pending.amountVnd !== item.amount) continue; // số tiền không khớp → để admin duyệt tay

      await creditBalance(pending.userId, {
        type: 'topup',
        amountVnd: pending.amountVnd,
        approveTxId: pending.id,
        metadata: {
          ...((pending.metadata as Record<string, unknown>) ?? {}),
          cassoTxId: item.id,
          cassoDescription: item.description,
        },
      });

      count++;
      break; // 1 Casso tx chỉ match 1 pending; break sau khi xử lý.
    }
  }

  return count;
}
