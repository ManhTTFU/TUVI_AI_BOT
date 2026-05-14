import { auth } from '@/auth';
import { calculateChart } from '@tuvi/astrology';
import { CANH_GIO } from '@tuvi/core';
import { getDb, charts } from '@tuvi/db';
import { NextResponse } from 'next/server';
import { parseBirthPayload, birthHash } from '@/lib/birth';
import { chargeReading, InsufficientBalanceError } from '@/lib/wallet';

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

  // Charge ví trước khi tính chart (chart calc cheap, nhưng charge trước = nếu
  // user thiếu tiền không tốn cycle, và nếu charge ok mà insert lỗi → còn ledger
  // truy vết được).
  let charge: Awaited<ReturnType<typeof chargeReading>>;
  try {
    charge = await chargeReading(session.user.id, { service: 'tu-vi' });
  } catch (e) {
    if (e instanceof InsufficientBalanceError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Số dư không đủ để lập lá số',
          code: 'INSUFFICIENT_BALANCE',
          balanceVnd: e.balance,
          requiredVnd: e.required,
        },
        { status: 402 },
      );
    }
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }

  const db = getDb();
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
    balanceVnd: charge.balanceAfter,
    chargedVnd: charge.amountCharged,
  });
}
