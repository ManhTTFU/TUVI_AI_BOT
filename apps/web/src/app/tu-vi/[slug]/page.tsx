import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getDb, charts, analyses, deepReadings } from '@tuvi/db';
import { and, eq } from 'drizzle-orm';
import type { AnalysisSections, ChartData, DeepReadingsData } from '@tuvi/core';
import ChartDetailClient from '@/components/tu-vi/ChartDetailClient';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Lá số · Diễn Cầm Tam Thế`,
    alternates: { canonical: `/tu-vi/${params.slug}` },
    robots: { index: false, follow: false },
  };
}

export const dynamic = 'force-dynamic';

export default async function Page({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/dang-nhap?callbackUrl=/tu-vi/${params.slug}`);
  }

  const db = getDb();
  const isAdmin = session.user.role === 'admin';

  const [chartRow] = await db
    .select()
    .from(charts)
    .where(
      isAdmin
        ? eq(charts.slug, params.slug)
        : and(eq(charts.slug, params.slug), eq(charts.userId, session.user.id)),
    )
    .limit(1);
  if (!chartRow) notFound();

  const [analysisRow] = await db
    .select({ sections: analyses.sections })
    .from(analyses)
    .where(eq(analyses.birthHash, chartRow.birthHash))
    .limit(1);

  const currentYear = new Date().getFullYear();
  const [deepRow] = await db
    .select({ data: deepReadings.data })
    .from(deepReadings)
    .where(
      and(
        eq(deepReadings.birthHash, chartRow.birthHash),
        eq(deepReadings.year, currentYear),
      ),
    )
    .limit(1);

  return (
    <ChartDetailClient
      chartId={chartRow.id}
      chart={chartRow.chartData as ChartData}
      initialAnalysis={(analysisRow?.sections as AnalysisSections) ?? null}
      initialDeep={(deepRow?.data as DeepReadingsData) ?? null}
      lunarMode={chartRow.lunarMode}
      createdAt={chartRow.createdAt.toISOString()}
    />
  );
}
