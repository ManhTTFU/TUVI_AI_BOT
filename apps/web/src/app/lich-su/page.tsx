import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getDb, charts } from '@tuvi/db';
import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';

const SERIF_FONT = "'Cormorant Garamond',serif";

export const metadata = { title: 'Lịch sử của tôi · Diễn Cầm Tam Thế' };
export const dynamic = 'force-dynamic';

const TYPE_COLOR = '#5a3a1a';

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/dang-nhap?callbackUrl=/lich-su');

  const db = getDb();
  const rows = await db
    .select({
      id: charts.id,
      name: charts.name,
      gender: charts.gender,
      birthDate: charts.birthDate,
      slug: charts.slug,
      createdAt: charts.createdAt,
    })
    .from(charts)
    .where(eq(charts.userId, session.user.id))
    .orderBy(desc(charts.createdAt))
    .limit(100);

  return (
    <div className="min-h-screen px-6 py-12 text-[#0f0a08]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
          <div>
            <h1
              className="text-4xl md:text-5xl font-serif italic"
              style={{ fontFamily: SERIF_FONT }}
            >
              Lịch sử của tôi
            </h1>
            <p className="mt-2 text-[14px] text-[#4a3a30]">
              {rows.length} lá số · sắp xếp theo thời gian gần nhất
            </p>
          </div>
          <Link
            href="/xem-tu-vi"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#5a3a1a] to-[#c89146] text-[#fbf3e2] font-semibold text-[13px] hover:from-[#4a6c7a] hover:to-[#d4a05a] transition shadow"
          >
            <span>✦</span> Lập lá số mới
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#c89146]/55 bg-[#fbf3e2]/70 p-10 text-center">
            <div className="text-5xl mb-3">📜</div>
            <p className="text-[15px] text-[#4a3a30] mb-4">
              Bạn chưa có lá số nào. Bắt đầu lập lá số đầu tiên ngay!
            </p>
            <Link
              href="/xem-tu-vi"
              className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-[#5a3a1a] to-[#c89146] text-[#fbf3e2] font-semibold"
            >
              Lập Lá Số
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-4 rounded-2xl border border-[#4a6c7a]/30 bg-[#fbf3e2]/90 hover:bg-[#fbf3e2] hover:border-[#4a6c7a]/55 transition p-4"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5a3a1a] to-[#c89146] text-[#fbf3e2] flex items-center justify-center text-xl shrink-0">
                  ☯
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[15px] text-[#0f0a08]">
                      {c.name}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] tracking-[0.2em] uppercase font-bold"
                      style={{
                        background: TYPE_COLOR + '15',
                        color: TYPE_COLOR,
                        border: `1px solid ${TYPE_COLOR}40`,
                      }}
                    >
                      Tử Vi
                    </span>
                  </div>
                  <div className="mt-0.5 text-[12px] text-[#4a3a30]">
                    {c.birthDate} · {c.gender === 'male' ? '♂ Nam' : '♀ Nữ'} ·{' '}
                    {new Date(c.createdAt).toLocaleString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <Link
                  href={`/tu-vi/${c.slug}`}
                  className="px-4 py-2 rounded-full bg-[#fbf3e2] border border-[#c89146]/55 text-[#5a3a1a] text-[12.5px] font-semibold hover:bg-[#f5e3c0] transition"
                >
                  Xem chi tiết →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
