import { auth } from '@/auth';
import {
  getDb,
  users,
  transactions,
  subscriptionPlans,
  subscriptionPurchases,
  type Plan,
} from '@tuvi/db';
import { eq } from 'drizzle-orm';
import { publish } from '@/lib/sse-bus';
import { LIFETIME_DATE } from '@/lib/tier';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Không có quyền' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId ?? '').trim();
  const plan = body.plan as Plan;
  const note = String(body.note ?? '').trim() || null;

  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Thiếu userId' }, { status: 400 });
  }
  if (!['monthly', 'semi_annual', 'annual', 'lifetime'].includes(plan)) {
    return NextResponse.json({ ok: false, error: 'Plan không hợp lệ' }, { status: 400 });
  }

  const db = getDb();
  const result = await db.transaction(async (tx) => {
    const [planRow] = await tx
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.plan, plan))
      .limit(1);
    if (!planRow) throw new Error('Plan không tồn tại');

    const [u] = await tx
      .select({ proUntil: users.proUntil })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!u) throw new Error('User không tồn tại');

    const now = new Date();
    const base = u.proUntil && u.proUntil > now ? u.proUntil : now;
    const newProUntil =
      planRow.durationDays == null
        ? LIFETIME_DATE
        : new Date(base.getTime() + planRow.durationDays * 24 * 60 * 60 * 1000);

    await tx.update(users).set({ proUntil: newProUntil }).where(eq(users.id, userId));

    const [txn] = await tx
      .insert(transactions)
      .values({
        userId,
        type: 'admin_extend',
        status: 'completed',
        amountVnd: 0,
        note,
        metadata: {
          plan,
          label: planRow.label,
          durationDays: planRow.durationDays,
          adminId: session.user.id,
          adminEmail: session.user.email,
        },
        completedAt: now,
      })
      .returning();

    await tx.insert(subscriptionPurchases).values({
      userId,
      plan,
      amountVnd: 0,
      transactionId: txn.id,
      proUntilAfter: newProUntil,
    });

    return { newProUntil };
  });

  publish(userId, 'subscription', {
    proUntil: result.newProUntil.toISOString(),
    tier: 'PRO',
    source: 'admin_extend',
  });

  return NextResponse.json({
    ok: true,
    proUntil: result.newProUntil.toISOString(),
  });
}
