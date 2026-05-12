import { auth } from '@/auth';
import { getDb, users, transactions } from '@tuvi/db';
import { eq } from 'drizzle-orm';
import { publish } from '@/lib/sse-bus';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Không có quyền' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId ?? '').trim();
  const note = String(body.note ?? '').trim() || null;

  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Thiếu userId' }, { status: 400 });
  }
  if (userId === session.user.id) {
    return NextResponse.json(
      { ok: false, error: 'Không thể hủy gói PRO của chính mình' },
      { status: 400 },
    );
  }

  const db = getDb();
  await db.transaction(async (tx) => {
    const [u] = await tx
      .select({ proUntil: users.proUntil })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!u) throw new Error('User không tồn tại');

    await tx.update(users).set({ proUntil: null }).where(eq(users.id, userId));

    await tx.insert(transactions).values({
      userId,
      type: 'admin_extend',
      status: 'completed',
      amountVnd: 0,
      note,
      metadata: {
        action: 'revoke',
        previousProUntil: u.proUntil ? u.proUntil.toISOString() : null,
        adminId: session.user.id,
        adminEmail: session.user.email,
      },
      completedAt: new Date(),
    });
  });

  publish(userId, 'subscription', {
    proUntil: null,
    tier: 'NORMAL',
    source: 'admin_revoke',
  });

  return NextResponse.json({ ok: true });
}
