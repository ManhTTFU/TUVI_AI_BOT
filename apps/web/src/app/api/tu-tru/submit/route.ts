import { auth } from '@/auth';
import { getDb, users, batTuCharts } from '@tuvi/db';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { isProActive } from '@/lib/tier';
import { calculateBatTu, type BatTuInput } from '@/lib/bat-tu';
import { batTuBirthHash } from '@/lib/bat-tu-hash';

export const runtime = 'nodejs';

interface SubmitPayload {
  name: string;
  gender: 'male' | 'female';
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  birthPlace?: string;
}

function parsePayload(body: unknown): SubmitPayload {
  if (!body || typeof body !== 'object') throw new Error('Body không hợp lệ');
  const b = body as Record<string, unknown>;
  const name = String(b.name ?? '').trim();
  if (!name) throw new Error('Thiếu họ tên');
  const gender = b.gender === 'female' ? 'female' : 'male';
  const year = Number(b.year);
  const month = Number(b.month);
  const day = Number(b.day);
  const hour = Number(b.hour);
  const minute = Number(b.minute);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) throw new Error('Năm sinh ngoài khoảng 1900–2100');
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new Error('Tháng phải 1–12');
  if (!Number.isInteger(day) || day < 1 || day > 31) throw new Error('Ngày phải 1–31');
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new Error('Giờ phải 0–23');
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) throw new Error('Phút phải 0–59');
  const birthPlace = String(b.birthPlace ?? '').trim() || undefined;
  return { name, gender, year, month, day, hour, minute, birthPlace };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Chưa đăng nhập' }, { status: 401 });
  }

  let payload: SubmitPayload;
  try {
    const body = await req.json();
    payload = parsePayload(body);
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }

  const db = getDb();
  const [u] = await db
    .select({ proUntil: users.proUntil })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!u || !isProActive(u.proUntil)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Cần gói PRO để xem Tứ Trụ Bát Tự',
        code: 'PRO_REQUIRED',
        proUntil: u?.proUntil ?? null,
      },
      { status: 402 },
    );
  }

  const input: BatTuInput = {
    year: payload.year,
    month: payload.month,
    day: payload.day,
    hour: payload.hour,
    minute: payload.minute,
    birthPlace: payload.birthPlace,
  };
  const chart = calculateBatTu(input);

  const solarDate = `${pad(payload.day)}/${pad(payload.month)}/${payload.year}`;
  const hash = batTuBirthHash({
    gender: payload.gender,
    solarDate,
    hour: payload.hour,
    minute: payload.minute,
  });

  const [row] = await db
    .insert(batTuCharts)
    .values({
      userId: session.user.id,
      name: payload.name,
      gender: payload.gender,
      solarDate,
      hour: payload.hour,
      minute: payload.minute,
      birthPlace: payload.birthPlace ?? null,
      birthHash: hash,
      chartData: chart,
    })
    .returning({ id: batTuCharts.id });

  return NextResponse.json({
    ok: true,
    chartId: row.id,
    name: payload.name,
    gender: payload.gender,
    chart,
  });
}
