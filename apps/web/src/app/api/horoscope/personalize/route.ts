import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDb, users } from '@tuvi/db';
import { eq } from 'drizzle-orm';
import { isProActive } from '@/lib/tier';
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

  // PRO gate: chỉ tài khoản PRO mới được luận giải cá nhân hóa.
  const db = getDb();
  const [u] = await db
    .select({ proUntil: users.proUntil })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!u || !isProActive(u.proUntil)) {
    return NextResponse.json(
      { ok: false, error: 'Cần tài khoản PRO để xem luận giải cá nhân', code: 'PRO_REQUIRED' },
      { status: 402 },
    );
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

  try {
    const result = await getPersonalizedHoroscope(session.user.id, {
      signEn,
      gender,
      status,
      goal,
    });
    return NextResponse.json({ ok: true, id: result.id, reading: result.reading });
  } catch (e) {
    const msg = (e as Error).message ?? 'Lỗi không xác định';
    console.error(`[horoscope/personalize] ${msg}`);
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
