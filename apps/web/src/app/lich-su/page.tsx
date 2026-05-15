import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getDb } from '@tuvi/db';
import { sql } from 'drizzle-orm';
import Link from 'next/link';
import { ALL_SIGNS_VI } from '@/lib/horoscope-lib';
import Pagination from '@/components/Pagination';

const SERIF_FONT = "'Cormorant Garamond',serif";

export const metadata = { title: 'Lịch sử của tôi · Vận Mệnh' };
export const dynamic = 'force-dynamic';

type Kind = 'tu-vi' | 'tu-tru' | 'hoang-dao' | 'tarot';
type KindFilter = Kind | 'all';

// Index signature cần thiết vì drizzle `db.execute<T>` constraint T extends Record<string, unknown>.
type HistoryRow = {
  kind: Kind;
  id: string;
  name: string;
  gender: string;
  created_at: string;
  extra: Record<string, unknown>;
} & Record<string, unknown>;

interface CountsByKind {
  tuVi: number;
  tuTru: number;
  hoangDao: number;
  tarot: number;
  total: number;
}

const KIND_STYLE: Record<Kind, { label: string; color: string; icon: string }> = {
  'tu-vi': { label: 'Tử Vi', color: '#5a3a1a', icon: '☯' },
  'tu-tru': { label: 'Tứ Trụ', color: '#4a6c7a', icon: '四' },
  'hoang-dao': { label: 'Hoàng Đạo', color: '#c8361d', icon: '♆' },
  tarot: { label: 'Tarot', color: '#7a4a3a', icon: '✦' },
};

const FIELD_LABEL_TAROT: Record<string, string> = {
  love: 'Tình duyên',
  career: 'Sự nghiệp',
  finance: 'Tài chính',
  health: 'Sức khỏe',
  general: 'Tổng quát',
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

const VALID_KINDS: KindFilter[] = ['all', 'tu-vi', 'tu-tru', 'hoang-dao', 'tarot'];

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: { page?: string; size?: string; kind?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/dang-nhap?callbackUrl=/lich-su');
  const userId = session.user.id;

  const page = Math.max(1, parseInt(searchParams.page ?? '1') || 1);
  const size = clamp(parseInt(searchParams.size ?? '20') || 20, 10, 100);
  const kindParam = searchParams.kind ?? 'all';
  const kind: KindFilter = (VALID_KINDS as string[]).includes(kindParam)
    ? (kindParam as KindFilter)
    : 'all';

  const db = getDb();

  // UNION ALL 4 bảng để paginate ACROSS các loại. Mỗi nguồn đẩy về cùng schema
  // (kind, id, name, gender, created_at, extra jsonb). Filter kind áp ở outer
  // query để giữ subquery đơn giản — planner tự push-down predicate khi cần.
  const offset = (page - 1) * size;
  const kindFilter = kind === 'all' ? sql`TRUE` : sql`kind = ${kind}`;

  const [rowsRes, countsRes] = await Promise.all([
    db.execute<HistoryRow>(sql`
      SELECT * FROM (
        SELECT
          'tu-vi'::text AS kind,
          id::text AS id,
          name,
          gender,
          created_at,
          jsonb_build_object('birthDate', birth_date) AS extra
        FROM charts WHERE user_id = ${userId}
        UNION ALL
        SELECT
          'tu-tru'::text AS kind,
          id::text AS id,
          name,
          gender,
          created_at,
          jsonb_build_object('solarDate', solar_date, 'hour', hour, 'minute', minute) AS extra
        FROM bat_tu_charts WHERE user_id = ${userId}
        UNION ALL
        SELECT
          'hoang-dao'::text AS kind,
          id::text AS id,
          sign_en AS name,
          gender,
          created_at,
          jsonb_build_object('signEn', sign_en, 'status', status, 'goal', goal) AS extra
        FROM hoang_dao_charts WHERE user_id = ${userId}
        UNION ALL
        SELECT
          'tarot'::text AS kind,
          id::text AS id,
          name,
          gender,
          created_at,
          jsonb_build_object('field', field, 'numCards', num_cards, 'question', question) AS extra
        FROM tarot_charts WHERE user_id = ${userId}
      ) t
      WHERE ${kindFilter}
      ORDER BY created_at DESC
      LIMIT ${size} OFFSET ${offset}
    `),
    db.execute<{ tu_vi: string; tu_tru: string; hoang_dao: string; tarot: string } & Record<string, unknown>>(sql`
      SELECT
        (SELECT COUNT(*) FROM charts WHERE user_id = ${userId}) AS tu_vi,
        (SELECT COUNT(*) FROM bat_tu_charts WHERE user_id = ${userId}) AS tu_tru,
        (SELECT COUNT(*) FROM hoang_dao_charts WHERE user_id = ${userId}) AS hoang_dao,
        (SELECT COUNT(*) FROM tarot_charts WHERE user_id = ${userId}) AS tarot
    `),
  ]);

  const c = countsRes.rows[0] ?? { tu_vi: '0', tu_tru: '0', hoang_dao: '0', tarot: '0' };
  const counts: CountsByKind = {
    tuVi: Number(c.tu_vi),
    tuTru: Number(c.tu_tru),
    hoangDao: Number(c.hoang_dao),
    tarot: Number(c.tarot),
    total: Number(c.tu_vi) + Number(c.tu_tru) + Number(c.hoang_dao) + Number(c.tarot),
  };

  const totalForKind: Record<KindFilter, number> = {
    all: counts.total,
    'tu-vi': counts.tuVi,
    'tu-tru': counts.tuTru,
    'hoang-dao': counts.hoangDao,
    tarot: counts.tarot,
  };
  const total = totalForKind[kind];

  const items = rowsRes.rows.map(buildHistoryItem);

  return (
    <div className="min-h-screen px-6 py-12 text-[#0f0a08]">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between gap-3 flex-wrap mb-6">
          <div>
            <h1
              className="text-4xl md:text-5xl font-serif italic"
              style={{ fontFamily: SERIF_FONT }}
            >
              Lịch sử của tôi
            </h1>
            <p className="mt-2 text-[14px] text-[#4a3a30]">
              {counts.total} lá số ({counts.tuVi} Tử Vi · {counts.tuTru} Tứ Trụ · {counts.hoangDao} Hoàng Đạo · {counts.tarot} Tarot) — sắp xếp theo thời gian gần nhất
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CreateLink href="/xem-tu-vi" tone="brown" icon="✦">Lập Tử Vi</CreateLink>
            <CreateLink href="/tu-tru-bat-tu" tone="mountain" icon="四">Lập Tứ Trụ</CreateLink>
            <CreateLink href="/hoang-dao" tone="red" icon="♆">Xem Hoàng Đạo</CreateLink>
            <CreateLink href="/xem-tarot" tone="tarot" icon="✦">Xem Tarot</CreateLink>
          </div>
        </header>

        {/* Tab filter */}
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <KindTab kind="all" current={kind} count={counts.total} />
          <KindTab kind="tu-vi" current={kind} count={counts.tuVi} />
          <KindTab kind="tu-tru" current={kind} count={counts.tuTru} />
          <KindTab kind="hoang-dao" current={kind} count={counts.hoangDao} />
          <KindTab kind="tarot" current={kind} count={counts.tarot} />
        </div>

        {counts.total === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#c89146]/55 bg-[#fbf3e2]/70 p-10 text-center">
            <div className="text-5xl mb-3">📜</div>
            <p className="text-[15px] text-[#4a3a30] mb-4">
              Bạn chưa có lá số nào. Bắt đầu khám phá bản mệnh ngay!
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <CreateLink href="/xem-tu-vi" tone="brown" icon="">Lập Tử Vi</CreateLink>
              <CreateLink href="/tu-tru-bat-tu" tone="mountain" icon="">Lập Tứ Trụ</CreateLink>
              <CreateLink href="/hoang-dao" tone="red" icon="">Xem Hoàng Đạo</CreateLink>
              <CreateLink href="/xem-tarot" tone="tarot" icon="">Xem Tarot</CreateLink>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-[#4a6c7a]/30 bg-[#fbf3e2]/70 p-8 text-center text-[14px] text-[#4a3a30] italic">
            Không có lá số {kind !== 'all' ? KIND_STYLE[kind].label : ''} trong trang này.
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
                      {c.detail} · {c.gender === 'male' ? '♂ Nam' : '♀ Nữ'} ·{' '}
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

        {total > 0 && <Pagination page={page} pageSize={size} total={total} />}
      </div>
    </div>
  );
}

function buildHistoryItem(row: HistoryRow): {
  kind: Kind;
  id: string;
  name: string;
  gender: string;
  detail: string;
  href: string;
  createdAt: string;
} {
  const extra = row.extra ?? {};
  if (row.kind === 'tu-vi') {
    return {
      kind: 'tu-vi',
      id: row.id,
      name: row.name,
      gender: row.gender,
      detail: String(extra.birthDate ?? ''),
      href: `/tu-vi/${row.id}`,
      createdAt: row.created_at,
    };
  }
  if (row.kind === 'tu-tru') {
    const hour = String(extra.hour ?? '0').padStart(2, '0');
    const minute = String(extra.minute ?? '0').padStart(2, '0');
    return {
      kind: 'tu-tru',
      id: row.id,
      name: row.name,
      gender: row.gender,
      detail: `${extra.solarDate ?? ''} ${hour}:${minute}`,
      href: `/tu-tru/${row.id}`,
      createdAt: row.created_at,
    };
  }
  if (row.kind === 'hoang-dao') {
    const signEn = String(extra.signEn ?? row.name);
    const sv = SIGN_VI_BY_EN.get(signEn);
    const status = String(extra.status ?? '');
    const goal = String(extra.goal ?? '');
    return {
      kind: 'hoang-dao',
      id: row.id,
      name: sv ? `Cung ${sv.name}` : signEn,
      gender: row.gender,
      detail: `${STATUS_LABEL[status] ?? status} · Mục tiêu: ${GOAL_LABEL[goal] ?? goal}`,
      href: `/hoang-dao/luan-giai?sign=${encodeURIComponent(signEn)}&gender=${row.gender}&status=${status}&goal=${goal}`,
      createdAt: row.created_at,
    };
  }
  // tarot
  const field = String(extra.field ?? '');
  const numCards = Number(extra.numCards ?? 0);
  const question = typeof extra.question === 'string' ? extra.question : '';
  return {
    kind: 'tarot',
    id: row.id,
    name: row.name,
    gender: row.gender,
    detail: `Tarot ${numCards} lá · ${FIELD_LABEL_TAROT[field] ?? field}${
      question ? ` — "${question.slice(0, 50)}${question.length > 50 ? '…' : ''}"` : ''
    }`,
    href: `/xem-tarot/${row.id}`,
    createdAt: row.created_at,
  };
}

function KindTab({
  kind,
  current,
  count,
}: {
  kind: KindFilter;
  current: KindFilter;
  count: number;
}) {
  const active = kind === current;
  const label = kind === 'all' ? 'Tất cả' : KIND_STYLE[kind].label;
  const color = kind === 'all' ? '#5a3a1a' : KIND_STYLE[kind].color;
  return (
    <Link
      href={kind === 'all' ? '/lich-su' : `/lich-su?kind=${kind}`}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition border ${
        active
          ? 'text-[#fbf3e2] border-transparent shadow-[0_4px_12px_-4px_rgba(90,58,26,0.4)]'
          : 'bg-[#fbf3e2] text-[#4a3a30] border-[#4a6c7a]/30 hover:border-[#4a6c7a]/60'
      }`}
      style={active ? { background: color } : undefined}
    >
      <span>{label}</span>
      <span
        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
          active ? 'bg-[#fbf3e2]/25 text-[#fbf3e2]' : 'bg-[#4a6c7a]/15 text-[#4a3a30]'
        }`}
      >
        {count}
      </span>
    </Link>
  );
}

function CreateLink({
  href,
  tone,
  icon,
  children,
}: {
  href: string;
  tone: 'brown' | 'mountain' | 'red' | 'tarot';
  icon: string;
  children: React.ReactNode;
}) {
  const TONE = {
    brown: 'bg-gradient-to-r from-[#5a3a1a] to-[#c89146] text-[#fbf3e2] hover:from-[#4a6c7a] hover:to-[#d4a05a] shadow',
    mountain: 'border border-[#4a6c7a]/55 bg-[#fbf3e2] text-[#4a6c7a] hover:bg-[#e8eef2]',
    red: 'border border-[#c8361d]/55 bg-[#fbf3e2] text-[#c8361d] hover:bg-[#fde8e5]',
    tarot: 'border border-[#7a4a3a]/55 bg-[#fbf3e2] text-[#7a4a3a] hover:bg-[#f0e3d3]',
  } as const;
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-[12.5px] transition ${TONE[tone]}`}
    >
      {icon && <span>{icon}</span>}
      {children}
    </Link>
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
