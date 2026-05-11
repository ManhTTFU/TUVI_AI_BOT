import { auth } from '@/auth';
import { getDb, users } from '@tuvi/db';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Chưa đăng nhập' }, { status: 401 });
  }
  const db = getDb();
  const [u] = await db
    .select({ balanceVnd: users.balanceVnd })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  return NextResponse.json({ ok: true, balanceVnd: u?.balanceVnd ?? 0 });
}
