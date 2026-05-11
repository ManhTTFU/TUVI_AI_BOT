import { auth } from '@/auth';
import { getDb, transactions } from '@tuvi/db';
import { and, eq } from 'drizzle-orm';
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
  const [updated] = await db
    .update(transactions)
    .set({ status: 'rejected', completedAt: new Date() })
    .where(and(eq(transactions.id, id), eq(transactions.status, 'pending')))
    .returning();

  if (!updated) {
    return NextResponse.json(
      { ok: false, error: 'Giao dịch không tồn tại hoặc đã xử lý' },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true });
}
