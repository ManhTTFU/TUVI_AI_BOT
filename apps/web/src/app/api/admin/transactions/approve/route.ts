import { auth } from '@/auth';
import {
  getDb,
  transactions,
  users,
  subscriptionPurchases,
  type Plan,
} from '@tuvi/db';
import { eq, and } from 'drizzle-orm';
import { publish } from '@/lib/sse-bus';
import { LIFETIME_DATE } from '@/lib/tier';
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
  const result = await db.transaction(async (tx) => {
    const [txn] = await tx
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.status, 'pending')))
      .limit(1);
    if (!txn) throw new Error('Giao dịch không tồn tại hoặc đã xử lý');

    // Hỗ trợ 2 loại pending: subscription (mới) và topup (legacy balance).
    if (txn.type !== 'subscription' && txn.type !== 'topup') {
      throw new Error('Chỉ duyệt được giao dịch nạp tiền / mua gói');
    }

    const [u] = await tx
      .select({ proUntil: users.proUntil, balanceVnd: users.balanceVnd })
      .from(users)
      .where(eq(users.id, txn.userId))
      .limit(1);
    if (!u) throw new Error('User không tồn tại');

    let newProUntil = u.proUntil;
    let newBalance = u.balanceVnd;
    let purchaseId: string | null = null;

    if (txn.type === 'subscription') {
      const meta = (txn.metadata ?? {}) as { plan?: Plan; durationDays?: number | null };
      const plan = meta.plan;
      const durationDays = meta.durationDays ?? null;

      if (!plan) throw new Error('Thiếu plan trong metadata');

      // Tính pro_until mới: max(now, current) + duration. Lifetime → LIFETIME_DATE.
      const now = new Date();
      const base = u.proUntil && u.proUntil > now ? u.proUntil : now;
      if (durationDays == null || plan === 'lifetime') {
        newProUntil = LIFETIME_DATE;
      } else {
        newProUntil = new Date(base.getTime() + durationDays * 24 * 60 * 60 * 1000);
      }

      await tx.update(users).set({ proUntil: newProUntil }).where(eq(users.id, txn.userId));

      const [purchase] = await tx
        .insert(subscriptionPurchases)
        .values({
          userId: txn.userId,
          plan,
          amountVnd: txn.amountVnd,
          transactionId: txn.id,
          proUntilAfter: newProUntil,
        })
        .returning({ id: subscriptionPurchases.id });
      purchaseId = purchase.id;
    } else {
      // Legacy topup → balance
      newBalance = u.balanceVnd + txn.amountVnd;
      await tx
        .update(users)
        .set({ balanceVnd: newBalance })
        .where(eq(users.id, txn.userId));
    }

    await tx
      .update(transactions)
      .set({
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          ...((txn.metadata as Record<string, unknown>) ?? {}),
          approvedBy: session.user.id,
          approvedByEmail: session.user.email,
          purchaseId,
        },
      })
      .where(eq(transactions.id, id));

    return {
      userId: txn.userId,
      type: txn.type,
      proUntil: newProUntil,
      balanceVnd: newBalance,
      amount: txn.amountVnd,
    };
  });

  // SSE push tới user.
  if (result.type === 'subscription') {
    publish(result.userId, 'subscription', {
      proUntil: result.proUntil ? result.proUntil.toISOString() : null,
      tier: 'PRO',
    });
  } else {
    publish(result.userId, 'balance', {
      balanceVnd: result.balanceVnd,
      source: 'topup_approved',
    });
  }

  return NextResponse.json({
    ok: true,
    proUntil: result.proUntil ? result.proUntil.toISOString() : null,
    balanceVnd: result.balanceVnd,
  });
}
