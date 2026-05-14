import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { chargeReading, InsufficientBalanceError } from '@/lib/wallet';
import {
  getPersonalizedHoroscope,
  type Gender,
  type Status,
  type Goal,
} from '@/lib/horoscope-personalize-server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const VALID_GENDER: Gender[] = ['male', 'female'];
const VALID_STATUS: Status[] = ['single', 'dating', 'married', 'divorced'];
const VALID_GOAL: Goal[] = ['career', 'love', 'wealth', 'health', 'study', 'family'];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Chưa đăng nhập' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'Body không hợp lệ' }, { status: 400 });
  }

  const signEn = String(body.signEn ?? '').trim();
  const gender = body.gender as Gender;
  const status = body.status as Status;
  const goal = body.goal as Goal;

  if (!signEn) {
    return NextResponse.json({ ok: false, error: 'Thiếu signEn' }, { status: 400 });
  }
  if (!VALID_GENDER.includes(gender)) {
    return NextResponse.json({ ok: false, error: 'Giới tính không hợp lệ' }, { status: 400 });
  }
  if (!VALID_STATUS.includes(status)) {
    return NextResponse.json({ ok: false, error: 'Trạng thái không hợp lệ' }, { status: 400 });
  }
  if (!VALID_GOAL.includes(goal)) {
    return NextResponse.json({ ok: false, error: 'Mục tiêu không hợp lệ' }, { status: 400 });
  }

  // Charge 5k trước khi gọi AI. Tarot/Hoàng Đạo cache cross-user, nhưng user
  // vẫn trả 5k cho luận giải cá nhân hóa của họ — không phân biệt cache hit/miss.
  let charge: Awaited<ReturnType<typeof chargeReading>>;
  try {
    charge = await chargeReading(session.user.id, {
      service: 'hoang-dao',
      metadata: { signEn, gender, status, goal },
    });
  } catch (e) {
    if (e instanceof InsufficientBalanceError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Số dư không đủ để xem luận giải cá nhân',
          code: 'INSUFFICIENT_BALANCE',
          balanceVnd: e.balance,
          requiredVnd: e.required,
        },
        { status: 402 },
      );
    }
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }

  try {
    const result = await getPersonalizedHoroscope(session.user.id, {
      signEn,
      gender,
      status,
      goal,
    });
    return NextResponse.json({
      ok: true,
      id: result.id,
      reading: result.reading,
      balanceVnd: charge.balanceAfter,
      chargedVnd: charge.amountCharged,
    });
  } catch (e) {
    const msg = (e as Error).message ?? 'Lỗi không xác định';
    console.error(`[horoscope/personalize] ${msg}`);
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
