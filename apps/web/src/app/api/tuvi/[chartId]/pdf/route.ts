import { auth } from '@/auth';
import { buildPdf } from '@tuvi/pdf';
import type { AnalysisSections, ChartData } from '@tuvi/core';
import { getDb, charts, analyses } from '@tuvi/db';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(_req: Request, ctx: { params: { chartId: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const db = getDb();
  const isAdmin = session.user.role === 'admin';

  const [chartRow] = await db
    .select()
    .from(charts)
    .where(
      isAdmin
        ? eq(charts.id, ctx.params.chartId)
        : and(eq(charts.id, ctx.params.chartId), eq(charts.userId, session.user.id)),
    )
    .limit(1);
  if (!chartRow) {
    return NextResponse.json({ error: 'Không tìm thấy lá số' }, { status: 404 });
  }

  const [analysisRow] = await db
    .select({ sections: analyses.sections })
    .from(analyses)
    .where(eq(analyses.birthHash, chartRow.birthHash))
    .limit(1);
  if (!analysisRow) {
    return NextResponse.json(
      { error: 'Chưa có luận giải — chờ hệ thống sinh xong rồi tải PDF' },
      { status: 409 },
    );
  }

  const buffer = await buildPdf({
    chart: chartRow.chartData as ChartData,
    analysis: analysisRow.sections as AnalysisSections,
  });

  const safeName = chartRow.name.replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'la-so';
  const filename = `${safeName.replace(/\s+/g, '-')}-${chartRow.birthDate.replace(/\//g, '')}.pdf`;

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, max-age=300',
    },
  });
}
