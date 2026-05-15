import { auth } from '@/auth';
import { analyzeDeepReadings, seedFromHash } from '@tuvi/ai';
import type { ChartData, DeepReadingsData } from '@tuvi/core';
import { getDb, charts, deepReadings } from '@tuvi/db';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(_req: Request, ctx: { params: { chartId: string } }) {
  try {
    console.log('[deep-readings] start, chartId:', ctx.params.chartId);

    const session = await auth();
    console.log('[deep-readings] auth ok, userId:', session?.user?.id);
    if (!session?.user?.id) {
      return NextResponse.json({ ok: false, error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const db = getDb();
    const [chartRow] = await db
      .select()
      .from(charts)
      .where(and(eq(charts.id, ctx.params.chartId), eq(charts.userId, session.user.id)))
      .limit(1);
    console.log('[deep-readings] chartRow found:', !!chartRow);
    if (!chartRow) {
      return NextResponse.json(
        { ok: false, error: 'Không tìm thấy lá số' },
        { status: 404 },
      );
    }

    const birthYear = Number(chartRow.birthDate.split('/')[2]);
    const currentYear = new Date().getFullYear();

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
    console.log('[deep-readings] cache hit:', !!cached);
    if (cached) {
      return NextResponse.json({
        ok: true,
        deep: cached.data as DeepReadingsData,
        cached: true,
      });
    }

    try {
      console.log('[deep-readings] calling AI analyzeDeepReadings...');
      const data = await analyzeDeepReadings(
        chartRow.chartData as ChartData,
        birthYear,
        currentYear,
        { seed: seedFromHash(chartRow.birthHash) + currentYear },
      );
      console.log('[deep-readings] AI ok, saving cache');

      await db
        .insert(deepReadings)
        .values({ birthHash: chartRow.birthHash, year: currentYear, data })
        .onConflictDoNothing();

      return NextResponse.json({ ok: true, deep: data, cached: false });
    } catch (e) {
      const msg = (e as Error).message ?? 'Lỗi không xác định khi sinh luận giải';
      console.error(`[deep-readings] AI error: ${msg}`, e);
      return NextResponse.json({ ok: false, error: msg }, { status: 502 });
    }
  } catch (topErr) {
    const e = topErr as Error;
    console.error('[deep-readings] TOP-LEVEL CRASH:', e.message, e.stack);
    return NextResponse.json(
      { ok: false, error: `Server error: ${e.message}` },
      { status: 500 },
    );
  }
}
