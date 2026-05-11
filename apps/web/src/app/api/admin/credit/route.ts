import { auth } from '@/auth';
import { getDb, users, transactions } from '@tuvi/db';
import { eq, sql } from 'drizzle-orm';
import { publish } from '@/lib/sse-bus';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ ok: false, error: 'Chưa đăng nhập' }, { status: 401 });
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Không có quyền' }, { status: 403 });
  }

  let body: { userId?: string; amountVnd?: number; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON không hợp lệ' }, { status: 400 });
  }

  const userId = String(body.userId ?? '').trim();
  const amount = Number(body.amountVnd);
  const note = String(body.note ?? '').trim() || null;

  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Thiếu userId' }, { status: 400 });
  }
  if (!Number.isInteger(amount) || amount === 0) {
    return NextResponse.json(
      { ok: false, error: 'Số tiền phải là số nguyên khác 0' },
      { status: 400 },
    );
  }
  if (Math.abs(amount) > 100_000_000) {
    return NextResponse.json(
      { ok: false, error: 'Số tiền quá lớn (>100tr)' },
      { status: 400 },
    );
  }

  const db = getDb();

  // Transaction: insert log + update balance atomically.
  const result = await db.transaction(async (tx) => {
    // Cộng/trừ balance. SQL trực tiếp để atomic.
    const [updated] = await tx
      .update(users)
      .set({ balanceVnd: sql`${users.balanceVnd} + ${amount}` })
      .where(eq(users.id, userId))
      .returning({ balanceVnd: users.balanceVnd });

    if (!updated) {
      throw new Error('User không tồn tại');
    }
    if (updated.balanceVnd < 0) {
      throw new Error('Trừ tiền sẽ làm balance âm');
    }

    const [txLog] = await tx
      .insert(transactions)
      .values({
        userId,
        type: 'admin_credit',
        status: 'completed',
        amountVnd: amount,
        note,
        metadata: { adminId: session.user.id, adminEmail: session.user.email },
        completedAt: new Date(),
      })
      .returning();

    return { balanceVnd: updated.balanceVnd, txLog };
  });

  // Push SSE event tới user (realtime).
  publish(userId, 'balance', { balanceVnd: result.balanceVnd, source: 'admin_credit' });
  publish(userId, 'topup-completed', {
    balanceVnd: result.balanceVnd,
    amountVnd: amount,
    note,
  });

  return NextResponse.json({
    ok: true,
    balanceVnd: result.balanceVnd,
    transaction: result.txLog,
  });
}
