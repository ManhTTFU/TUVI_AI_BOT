import { auth } from '@/auth';
import { analyzeChart, seedFromHash } from '@tuvi/ai';
import type { AnalysisSections, ChartData } from '@tuvi/core';
import { getDb, charts, analyses } from '@tuvi/db';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 120; // Vercel Hobby cap 60s; Pro cho phép 300s. Override khi deploy.

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

  // Cache hit (share theo birthHash giữa user) → trả ngay.
  const [cached] = await db
    .select({ sections: analyses.sections })
    .from(analyses)
    .where(eq(analyses.birthHash, chartRow.birthHash))
    .limit(1);
  if (cached) {
    return NextResponse.json({
      ok: true,
      analysis: cached.sections as AnalysisSections,
      cached: true,
    });
  }

  // Cache miss → call AI (đã wrap aiCall semaphore + retry trong @tuvi/ai).
  try {
    const sections = await analyzeChart(chartRow.chartData as ChartData, {
      seed: seedFromHash(chartRow.birthHash),
    });

    // Save cache. onConflictDoNothing đề phòng race (2 user submit cùng lúc).
    await db
      .insert(analyses)
      .values({ birthHash: chartRow.birthHash, sections })
      .onConflictDoNothing();

    return NextResponse.json({ ok: true, analysis: sections, cached: false });
  } catch (e) {
    const msg = (e as Error).message ?? 'Lỗi không xác định khi sinh luận giải';
    console.error(`[analyze] ${msg}`);
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
