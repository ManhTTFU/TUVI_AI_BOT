import { auth } from '@/auth';
import { getDb, users } from '@tuvi/db';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Trả số dư hiện tại của user đang đăng nhập. Dùng cho FE polling balance
 * realtime — thay thế SSE `/api/wallet/stream` (broken trên stateless edge).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const db = getDb();
  const [row] = await db
    .select({ balanceVnd: users.balanceVnd })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return NextResponse.json({ balanceVnd: row?.balanceVnd ?? 0 });
}
