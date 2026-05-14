import { auth } from '@/auth';
import { analyzeDeepReadings, seedFromHash } from '@tuvi/ai';
import type { ChartData, DeepReadingsData } from '@tuvi/core';
import { getDb, charts, deepReadings } from '@tuvi/db';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(_req: Request, ctx: { params: { chartId: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const db = getDb();
  const [chartRow] = await db
    .select()
    .from(charts)
    .where(and(eq(charts.id, ctx.params.chartId), eq(charts.userId, session.user.id)))
    .limit(1);
  if (!chartRow) {
    return NextResponse.json(
      { ok: false, error: 'Không tìm thấy lá số' },
      { status: 404 },
    );
  }

  const birthYear = Number(chartRow.birthDate.split('/')[2]);
  const currentYear = new Date().getFullYear();

  // Cache theo (birthHash, year) — namHienTai phụ thuộc năm.
  const [cached] = await db
    .select({ data: deepReadings.data })
    .from(deepReadings)
    .where(
      and(
        eq(deepReadings.birthHash, chartRow.birthHash),
        eq(deepReadings.year, currentYear),
      ),
    )
    .limit(1);
  if (cached) {
    return NextResponse.json({
      ok: true,
      deep: cached.data as DeepReadingsData,
      cached: true,
    });
  }

  try {
    // Seed = hash(birthHash) + year offset → cache key (birthHash, year) khác nhau
    // → mỗi năm 1 reading deterministic riêng, không "đông cứng" thành cùng output.
    const data = await analyzeDeepReadings(
      chartRow.chartData as ChartData,
      birthYear,
      currentYear,
      { seed: seedFromHash(chartRow.birthHash) + currentYear },
    );

    await db
      .insert(deepReadings)
      .values({ birthHash: chartRow.birthHash, year: currentYear, data })
      .onConflictDoNothing();

    return NextResponse.json({ ok: true, deep: data, cached: false });
  } catch (e) {
    const msg = (e as Error).message ?? 'Lỗi không xác định khi sinh luận giải';
    console.error(`[deep-readings] ${msg}`);
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
