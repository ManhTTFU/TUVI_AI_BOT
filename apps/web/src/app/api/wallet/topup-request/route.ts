import { auth } from '@/auth';
import { getDb, transactions } from '@tuvi/db';
import { and, eq } from 'drizzle-orm';
import { makeBankRef } from '@/lib/money';
import { MIN_TOPUP_VND } from '@/lib/wallet';
import { NextResponse } from 'next/server';

/** Topup tối đa 1 lần (chống user gõ nhầm 10000000 hoặc spam). */
const MAX_TOPUP_VND = 10_000_000;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Chưa đăng nhập' }, { status: 401 });
  }

  let body: { amountVnd?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON không hợp lệ' }, { status: 400 });
  }

  const amount = Number(body.amountVnd);
  if (!Number.isFinite(amount) || !Number.isInteger(amount)) {
    return NextResponse.json({ ok: false, error: 'Số tiền không hợp lệ' }, { status: 400 });
  }
  if (amount < MIN_TOPUP_VND) {
    return NextResponse.json(
      { ok: false, error: `Số tiền nạp tối thiểu ${MIN_TOPUP_VND.toLocaleString('vi-VN')}đ` },
      { status: 400 },
    );
  }
  if (amount > MAX_TOPUP_VND) {
    return NextResponse.json(
      { ok: false, error: `Số tiền nạp vượt giới hạn ${MAX_TOPUP_VND.toLocaleString('vi-VN')}đ — liên hệ admin` },
      { status: 400 },
    );
  }

  const db = getDb();

  // Chống spam: tối đa 5 pending topup cùng lúc.
  const pending = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, session.user.id),
        eq(transactions.type, 'topup'),
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
      type: 'topup',
      status: 'pending',
      amountVnd: amount,
      bankRef,
    })
    .returning();

  return NextResponse.json({ ok: true, transaction: tx });
}
