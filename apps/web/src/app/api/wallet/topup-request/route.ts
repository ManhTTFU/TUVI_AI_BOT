import { auth } from '@/auth';
import {
  getDb,
  subscriptionPlans,
  transactions,
  type Plan,
} from '@tuvi/db';
import { and, eq } from 'drizzle-orm';
import { makeBankRef } from '@/lib/money';
import { NextResponse } from 'next/server';

const VALID_PLANS: Plan[] = ['monthly', 'semi_annual', 'annual', 'lifetime'];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Chưa đăng nhập' }, { status: 401 });
  }

  let body: { plan?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON không hợp lệ' }, { status: 400 });
  }
  const plan = body.plan as Plan;
  if (!plan || !VALID_PLANS.includes(plan)) {
    return NextResponse.json({ ok: false, error: 'Gói không hợp lệ' }, { status: 400 });
  }

  const db = getDb();
  const [planRow] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.plan, plan))
    .limit(1);
  if (!planRow) {
    return NextResponse.json({ ok: false, error: 'Gói không tồn tại' }, { status: 404 });
  }

  // Chống spam: tối đa 5 pending tx subscription cùng lúc.
  const pending = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, session.user.id),
        eq(transactions.type, 'subscription'),
        eq(transactions.status, 'pending'),
      ),
    );
  if (pending.length >= 5) {
    return NextResponse.json(
      { ok: false, error: 'Bạn đang có quá nhiều giao dịch chờ duyệt' },
      { status: 429 },
    );
  }

  const bankRef = makeBankRef();
  const [tx] = await db
    .insert(transactions)
    .values({
      userId: session.user.id,
      type: 'subscription',
      status: 'pending',
      amountVnd: planRow.amountVnd,
      bankRef,
      metadata: {
        plan: planRow.plan,
        durationDays: planRow.durationDays,
        label: planRow.label,
      },
    })
    .returning();

  return NextResponse.json({
    ok: true,
    transaction: tx,
    plan: planRow,
  });
}
