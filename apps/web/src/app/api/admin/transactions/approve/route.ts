import { auth } from '@/auth';
import { getDb, transactions } from '@tuvi/db';
import { eq, and } from 'drizzle-orm';
import { creditBalance } from '@/lib/wallet';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Chưa đăng nhập' }, { status: 401 });
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Không có quyền' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const id = String(body.transactionId ?? '').trim();
  if (!id) {
    return NextResponse.json({ ok: false, error: 'Thiếu transactionId' }, { status: 400 });
  }

  const db = getDb();
  const [txn] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.status, 'pending')))
    .limit(1);
  if (!txn) {
    return NextResponse.json(
      { ok: false, error: 'Giao dịch không tồn tại hoặc đã xử lý' },
      { status: 404 },
    );
  }
  if (txn.type !== 'topup') {
    return NextResponse.json(
      { ok: false, error: 'Chỉ duyệt được giao dịch nạp tiền' },
      { status: 400 },
    );
  }

  try {
    const result = await creditBalance(txn.userId, {
      type: 'topup',
      amountVnd: txn.amountVnd,
      approveTxId: txn.id,
      metadata: {
        ...((txn.metadata as Record<string, unknown>) ?? {}),
        approvedBy: session.user.id,
        approvedByEmail: session.user.email,
      },
    });
    return NextResponse.json({ ok: true, balanceVnd: result.balanceAfter });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message ?? 'Lỗi duyệt giao dịch' },
      { status: 500 },
    );
  }
}
