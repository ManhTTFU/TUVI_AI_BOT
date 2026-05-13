import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getDb, charts, batTuCharts, hoangDaoCharts } from '@tuvi/db';
import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { ALL_SIGNS_VI } from '@/lib/horoscope-lib';

const SERIF_FONT = "'Cormorant Garamond',serif";

export const metadata = { title: 'Lịch sử của tôi · Diễn Cầm Tam Thế' };
export const dynamic = 'force-dynamic';

type HistoryItem = {
  kind: 'tu-vi' | 'tu-tru' | 'hoang-dao';
  id: string;
  name: string;
  gender: string;
  birthDate: string;
  href: string;
  createdAt: Date;
};

const KIND_STYLE: Record<HistoryItem['kind'], { label: string; color: string; icon: string }> = {
  'tu-vi': { label: 'Tử Vi', color: '#5a3a1a', icon: '☯' },
  'tu-tru': { label: 'Tứ Trụ', color: '#4a6c7a', icon: '四' },
  'hoang-dao': { label: 'Hoàng Đạo', color: '#c8361d', icon: '♆' },
};

const STATUS_LABEL: Record<string, string> = {
  single: 'Độc thân',
  dating: 'Đang yêu',
  married: 'Đã kết hôn',
  divorced: 'Ly hôn / Goá',
};
const GOAL_LABEL: Record<string, string> = {
  career: 'Sự nghiệp',
  love: 'Tình cảm',
  wealth: 'Tài chính',
  health: 'Sức khỏe',
  study: 'Học hành',
  family: 'Gia đình',
};
const SIGN_VI_BY_EN = new Map(ALL_SIGNS_VI.map((s) => [s.en, s]));

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/dang-nhap?callbackUrl=/lich-su');

  const db = getDb();

  const [tuViRows, tuTruRows, hoangDaoRows] = await Promise.all([
    db
      .select({
        id: charts.id,
        name: charts.name,
        gender: charts.gender,
        birthDate: charts.birthDate,
        createdAt: charts.createdAt,
      })
      .from(charts)
      .where(eq(charts.userId, session.user.id))
      .orderBy(desc(charts.createdAt))
      .limit(100),
    db
      .select({
        id: batTuCharts.id,
        name: batTuCharts.name,
        gender: batTuCharts.gender,
        solarDate: batTuCharts.solarDate,
        hour: batTuCharts.hour,
        minute: batTuCharts.minute,
        createdAt: batTuCharts.createdAt,
      })
      .from(batTuCharts)
      .where(eq(batTuCharts.userId, session.user.id))
      .orderBy(desc(batTuCharts.createdAt))
      .limit(100),
    db
      .select({
        id: hoangDaoCharts.id,
        signEn: hoangDaoCharts.signEn,
        gender: hoangDaoCharts.gender,
        status: hoangDaoCharts.status,
        goal: hoangDaoCharts.goal,
        createdAt: hoangDaoCharts.createdAt,
      })
      .from(hoangDaoCharts)
      .where(eq(hoangDaoCharts.userId, session.user.id))
      .orderBy(desc(hoangDaoCharts.createdAt))
      .limit(100),
  ]);

  const items: HistoryItem[] = [
    ...tuViRows.map<HistoryItem>((r) => ({
      kind: 'tu-vi',
      id: r.id,
      name: r.name,
      gender: r.gender,
      birthDate: r.birthDate,
      href: `/tu-vi/${r.id}`,
      createdAt: r.createdAt,
    })),
    ...tuTruRows.map<HistoryItem>((r) => ({
      kind: 'tu-tru',
      id: r.id,
      name: r.name,
      gender: r.gender,
      birthDate: `${r.solarDate} ${String(r.hour).padStart(2, '0')}:${String(r.minute).padStart(2, '0')}`,
      href: `/tu-tru/${r.id}`,
      createdAt: r.createdAt,
    })),
    ...hoangDaoRows.map<HistoryItem>((r) => {
      const sv = SIGN_VI_BY_EN.get(r.signEn);
      return {
        kind: 'hoang-dao',
        id: r.id,
        name: sv ? `Cung ${sv.name}` : r.signEn,
        gender: r.gender,
        birthDate: `${STATUS_LABEL[r.status] ?? r.status} · Mục tiêu: ${GOAL_LABEL[r.goal] ?? r.goal}`,
        href: `/hoang-dao/luan-giai?sign=${encodeURIComponent(r.signEn)}&gender=${r.gender}&status=${r.status}&goal=${r.goal}`,
        createdAt: r.createdAt,
      };
    }),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

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
              {items.length} lá số ({tuViRows.length} Tử Vi · {tuTruRows.length} Tứ Trụ · {hoangDaoRows.length} Hoàng Đạo) — sắp xếp theo thời gian gần nhất
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/xem-tu-vi"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#5a3a1a] to-[#c89146] text-[#fbf3e2] font-semibold text-[12.5px] hover:from-[#4a6c7a] hover:to-[#d4a05a] transition shadow"
            >
              <span>✦</span> Lập Tử Vi
            </Link>
            <Link
              href="/tu-tru-bat-tu"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#4a6c7a]/55 bg-[#fbf3e2] text-[#4a6c7a] font-semibold text-[12.5px] hover:bg-[#e8eef2] transition"
            >
              <span>四</span> Lập Tứ Trụ
            </Link>
            <Link
              href="/hoang-dao"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#c8361d]/55 bg-[#fbf3e2] text-[#c8361d] font-semibold text-[12.5px] hover:bg-[#fde8e5] transition"
            >
              <span>♆</span> Xem Hoàng Đạo
            </Link>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#c89146]/55 bg-[#fbf3e2]/70 p-10 text-center">
            <div className="text-5xl mb-3">📜</div>
            <p className="text-[15px] text-[#4a3a30] mb-4">
              Bạn chưa có lá số nào. Bắt đầu khám phá bản mệnh ngay!
            </p>
            <div className="flex items-center justify-center gap-2">
              <Link
                href="/xem-tu-vi"
                className="inline-block px-5 py-2.5 rounded-full bg-gradient-to-r from-[#5a3a1a] to-[#c89146] text-[#fbf3e2] font-semibold text-[13px]"
              >
                Lập Tử Vi
              </Link>
              <Link
                href="/tu-tru-bat-tu"
                className="inline-block px-5 py-2.5 rounded-full border border-[#4a6c7a]/55 bg-[#fbf3e2] text-[#4a6c7a] font-semibold text-[13px]"
              >
                Lập Tứ Trụ
              </Link>
              <Link
                href="/hoang-dao"
                className="inline-block px-5 py-2.5 rounded-full border border-[#c8361d]/55 bg-[#fbf3e2] text-[#c8361d] font-semibold text-[13px]"
              >
                Xem Hoàng Đạo
              </Link>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((c) => {
              const style = KIND_STYLE[c.kind];
              return (
                <li
                  key={`${c.kind}-${c.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-[#4a6c7a]/30 bg-[#fbf3e2]/90 hover:bg-[#fbf3e2] hover:border-[#4a6c7a]/55 transition p-4"
                >
                  <div
                    className="w-12 h-12 rounded-full text-[#fbf3e2] flex items-center justify-center text-xl shrink-0 font-serif"
                    style={{
                      background: `linear-gradient(135deg, ${style.color}, #c89146)`,
                      fontFamily: SERIF_FONT,
                    }}
                  >
                    {style.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[15px] text-[#0f0a08]">{c.name}</span>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] tracking-[0.2em] uppercase font-bold"
                        style={{
                          background: style.color + '15',
                          color: style.color,
                          border: `1px solid ${style.color}40`,
                        }}
                      >
                        {style.label}
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
                    href={c.href}
                    className="px-4 py-2 rounded-full bg-[#fbf3e2] border border-[#c89146]/55 text-[#5a3a1a] text-[12.5px] font-semibold hover:bg-[#f5e3c0] transition"
                  >
                    Xem chi tiết →
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
