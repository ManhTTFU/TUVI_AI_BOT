import { auth } from '@/auth';
import { getDb, batTuCharts, batTuAnalyses } from '@tuvi/db';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { analyzeBatTu, seedFromHash } from '@tuvi/ai';
import { formatBatTuForAI, type BatTuChart } from '@/lib/bat-tu';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(_req: Request, ctx: { params: { chartId: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const db = getDb();

  // Không gate / không charge ở đây — đã charge ở /submit. Endpoint này là
  // "lấy luận giải cho chart đã tồn tại của tôi", chỉ check ownership.
  const [chartRow] = await db
    .select()
    .from(batTuCharts)
    .where(and(eq(batTuCharts.id, ctx.params.chartId), eq(batTuCharts.userId, session.user.id)))
    .limit(1);
  if (!chartRow) {
    return NextResponse.json(
      { ok: false, error: 'Không tìm thấy lá số Tứ Trụ' },
      { status: 404 },
    );
  }

  // Cache hit theo birthHash → share giữa user trùng input.
  const [cached] = await db
    .select({ markdown: batTuAnalyses.markdown })
    .from(batTuAnalyses)
    .where(eq(batTuAnalyses.birthHash, chartRow.birthHash))
    .limit(1);
  if (cached) {
    return NextResponse.json({ ok: true, markdown: cached.markdown, cached: true });
  }

  try {
    const chart = chartRow.chartData as BatTuChart;
    const context = formatBatTuForAI(chart, chartRow.name, chartRow.gender as 'male' | 'female');
    const markdown = await analyzeBatTu(context, seedFromHash(chartRow.birthHash));

    await db
      .insert(batTuAnalyses)
      .values({ birthHash: chartRow.birthHash, markdown })
      .onConflictDoNothing();

    return NextResponse.json({ ok: true, markdown, cached: false });
  } catch (e) {
    const msg = (e as Error).message ?? 'Lỗi không xác định khi sinh luận giải';
    console.error(`[bat-tu:analyze] ${msg}`);
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
