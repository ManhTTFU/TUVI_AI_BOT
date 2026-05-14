import { auth } from '@/auth';
import { getDb, transactions } from '@tuvi/db';
import { count, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1') || 1);
  const size = clamp(parseInt(url.searchParams.get('size') ?? '10') || 10, 10, 100);

  const db = getDb();
  const userId = session.user.id;

  const [rows, totalRes] = await Promise.all([
    db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(size)
      .offset((page - 1) * size),
    db.select({ value: count() }).from(transactions).where(eq(transactions.userId, userId)),
  ]);

  return NextResponse.json({
    ok: true,
    transactions: rows,
    total: totalRes[0]?.value ?? 0,
    page,
    size,
  });
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
