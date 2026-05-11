import 'server-only';
import type { ChartData, FullResult } from '@tuvi/core';
import { getDb, charts, analyses } from '@tuvi/db';
import { eq } from 'drizzle-orm';

export async function fetchChartBySlug(slug: string): Promise<FullResult | null> {
  const db = getDb();
  const [chartRow] = await db.select().from(charts).where(eq(charts.slug, slug)).limit(1);
  if (!chartRow) return null;

  const [analysisRow] = await db
    .select({ sections: analyses.sections })
    .from(analyses)
    .where(eq(analyses.birthHash, chartRow.birthHash))
    .limit(1);

  const chart = chartRow.chartData as ChartData;
  return {
    slug: chartRow.slug,
    createdAt: chartRow.createdAt.toISOString(),
    info: chart.info,
    chart,
    analysis: (analysisRow?.sections as FullResult['analysis']) ?? {
      overview: '',
      career: '',
      love: '',
      health: '',
      decade: '',
      advice: '',
    },
  };
}
