import { auth } from '@/auth';
import { calculateChart } from '@tuvi/astrology';
import { CANH_GIO } from '@tuvi/core';
import { getDb, users, charts } from '@tuvi/db';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { parseBirthPayload, birthHash } from '@/lib/birth';
import { isProActive } from '@/lib/tier';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Chưa đăng nhập' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON không hợp lệ' }, { status: 400 });
  }

  let info: ReturnType<typeof parseBirthPayload>;
  try {
    info = parseBirthPayload(body);
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
  if (!info.timeName) info.timeName = CANH_GIO[info.timeIndex].name;

  const db = getDb();

  // Tier check: PRO mới được lập lá số.
  const [u] = await db
    .select({ proUntil: users.proUntil })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!u || !isProActive(u.proUntil)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Cần gói PRO để lập lá số',
        code: 'PRO_REQUIRED',
        proUntil: u?.proUntil ?? null,
      },
      { status: 402 },
    );
  }

  const hash = birthHash(info);
  const chart = calculateChart(info);

  const [chartRow] = await db
    .insert(charts)
    .values({
      userId: session.user.id,
      name: info.name,
      gender: info.gender,
      birthDate: info.birthDate,
      timeIndex: info.timeIndex,
      lunarMode: info.lunarMode,
      birthHash: hash,
      chartData: chart,
    })
    .returning();

  return NextResponse.json({
    ok: true,
    chartId: chartRow.id,
    chart,
  });
}
