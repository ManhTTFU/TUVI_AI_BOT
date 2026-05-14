import { auth } from '@/auth';
import { debitBalance } from '@/lib/wallet';
import { NextResponse } from 'next/server';

/**
 * Admin trừ tiền ví user. Endpoint name là legacy `/revoke-pro` từ model PRO;
 * model mới: admin debit theo `amountVnd`. KHÔNG hỗ trợ trừ về âm theo mặc định
 * (`requirePositive: true`) — admin muốn override phải qua tool khác.
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
  if (userId === session.user.id) {
    return NextResponse.json(
      { ok: false, error: 'Không thể trừ tiền của chính mình' },
      { status: 400 },
    );
  }
  if (!Number.isInteger(amountVnd) || amountVnd <= 0) {
    return NextResponse.json({ ok: false, error: 'Số tiền không hợp lệ' }, { status: 400 });
  }

  try {
    const result = await debitBalance(userId, amountVnd, {
      note,
      metadata: {
        adminId: session.user.id,
        adminEmail: session.user.email,
      },
      requirePositive: true,
    });
    return NextResponse.json({ ok: true, balanceVnd: result.balanceAfter });
  } catch (e) {
    const msg = (e as Error).message ?? 'Lỗi trừ tiền';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
