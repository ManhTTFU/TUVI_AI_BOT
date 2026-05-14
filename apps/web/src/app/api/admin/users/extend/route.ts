import { auth } from '@/auth';
import { creditBalance } from '@/lib/wallet';
import { NextResponse } from 'next/server';

/**
 * Admin cộng tiền vào ví user (thay endpoint cũ "tặng gói PRO"). Endpoint name
 * giữ nguyên `/extend` để khỏi đổi FE call site — sẽ rename trong refactor sau.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Không có quyền' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId ?? '').trim();
  const amountVnd = Number(body.amountVnd);
  const note = String(body.note ?? '').trim() || undefined;

  if (!userId) {
    return NextResponse.json({ ok: false, error: 'Thiếu userId' }, { status: 400 });
  }
  if (!Number.isInteger(amountVnd) || amountVnd <= 0) {
    return NextResponse.json({ ok: false, error: 'Số tiền không hợp lệ' }, { status: 400 });
  }

  try {
    const result = await creditBalance(userId, {
      type: 'admin_credit',
      amountVnd,
      note,
      metadata: {
        adminId: session.user.id,
        adminEmail: session.user.email,
      },
    });
    return NextResponse.json({ ok: true, balanceVnd: result.balanceAfter });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message ?? 'Lỗi cộng tiền' },
      { status: 500 },
    );
  }
}
