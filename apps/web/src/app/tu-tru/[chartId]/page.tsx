import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getDb, batTuCharts, batTuAnalyses } from '@tuvi/db';
import { and, eq } from 'drizzle-orm';
import type { BatTuChart } from '@/lib/bat-tu';
import TuTruResultView from '@/components/tu-tru/TuTruResultView';

interface PageProps {
  params: { chartId: string };
}

export const metadata: Metadata = {
  title: 'Tứ Trụ Bát Tự · Diễn Cầm Tam Thế',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function Page({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/dang-nhap?callbackUrl=/tu-tru/${params.chartId}`);
  }

  const db = getDb();
  const isAdmin = session.user.role === 'admin';

  const [row] = await db
    .select()
    .from(batTuCharts)
    .where(
      isAdmin
        ? eq(batTuCharts.id, params.chartId)
        : and(eq(batTuCharts.id, params.chartId), eq(batTuCharts.userId, session.user.id)),
    )
    .limit(1);
  if (!row) notFound();

  const [analysisRow] = await db
    .select({ markdown: batTuAnalyses.markdown })
    .from(batTuAnalyses)
    .where(eq(batTuAnalyses.birthHash, row.birthHash))
    .limit(1);

  const chart = row.chartData as BatTuChart;

  return (
    <div className="min-h-screen px-6 py-12 text-[#0f0a08]">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
          <Link
            href="/lich-su"
            className="text-[12px] tracking-[0.2em] uppercase text-[#4a6c7a] hover:text-[#5a3a1a]"
          >
            ← Lịch sử
          </Link>
          <Link
            href="/tu-tru-bat-tu"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#5a3a1a] to-[#c89146] text-[#fbf3e2] text-[12.5px] font-semibold hover:from-[#4a6c7a] hover:to-[#d4a05a] transition"
          >
            ✦ Lập lá số khác
          </Link>
        </div>

        <TuTruResultView
          chartId={row.id}
          chart={chart}
          name={row.name}
          gender={row.gender as 'male' | 'female'}
          initialMarkdown={analysisRow?.markdown ?? null}
        />
      </div>
    </div>
  );
}
