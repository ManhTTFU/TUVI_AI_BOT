import Link from 'next/link';
import { formatVnd } from '@/lib/money';
import type { AdminStats } from '@/lib/admin-stats';

/**
 * KPI snapshot ở đầu trang admin/transactions. Time-series charts (30 ngày /
 * 12 tháng / user signup) ở trang riêng `/admin/thong-ke` — page này cố tình
 * giữ ngắn để admin focus vào duyệt giao dịch.
 */
export default function StatsPanel({ stats }: { stats: AdminStats }) {
  const SERIF = "'Cormorant Garamond',serif";

  return (
    <section className="space-y-5 mb-6">
      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Doanh thu hôm nay"
          big={formatVnd(stats.todayRevenueVnd)}
          sub={`${stats.todayTopupCount} lượt nạp`}
          tone="gold"
          serif={SERIF}
        />
        <KpiCard
          label="Doanh thu tháng này"
          big={formatVnd(stats.monthRevenueVnd)}
          sub={`${stats.monthTopupCount} lượt nạp`}
          tone="green"
          serif={SERIF}
        />
        <KpiCard
          label="User đăng ký hôm nay"
          big={String(stats.usersToday)}
          sub={`Tháng này: ${stats.usersMonth} · Tổng: ${stats.usersTotal}`}
          tone="mountain"
          serif={SERIF}
        />
        <KpiCard
          label="Lượt luận giải hôm nay"
          big={String(stats.todayChargeCount)}
          sub={`Tháng này: ${stats.monthChargeCount} · Tổng: ${stats.totalChargeCount}`}
          tone="red"
          serif={SERIF}
        />
      </div>

      {/* Doanh thu tổng (toàn thời gian) + CTA sang trang chart */}
      <div className="rounded-2xl border border-[#c89146]/45 bg-gradient-to-br from-[#f5e3c0]/60 to-[#fbf3e2] p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-[#4a3a30] font-semibold">
              Doanh thu lũy kế
            </div>
            <div className="mt-1 text-3xl md:text-4xl font-serif italic text-[#5a3a1a]" style={{ fontFamily: SERIF }}>
              {formatVnd(stats.totalRevenueVnd)}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[#4a3a30]">Tổng lượt nạp</div>
            <div className="text-2xl font-bold text-[#5a3a1a] tabular-nums">{stats.totalTopupCount}</div>
          </div>
        </div>
        <Link
          href="/admin/thong-ke"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#5a3a1a] text-[#fbf3e2] text-[12.5px] font-semibold tracking-wide hover:bg-[#4a6c7a] transition shadow-[0_8px_20px_-10px_rgba(90,58,26,0.5)]"
        >
          <span>📊</span> Xem chart chi tiết →
        </Link>
      </div>
    </section>
  );
}

function KpiCard({
  label,
  big,
  sub,
  tone,
  serif,
}: {
  label: string;
  big: string;
  sub: string;
  tone: 'gold' | 'green' | 'mountain' | 'red';
  serif: string;
}) {
  const TONE: Record<typeof tone, { border: string; bg: string; text: string }> = {
    gold: { border: 'border-[#c89146]/55', bg: 'from-[#f5e3c0] to-[#fbf3e2]', text: '#5a3a1a' },
    green: { border: 'border-[#3a8a5e]/55', bg: 'from-[#d6ead8] to-[#fbf3e2]', text: '#2a6e48' },
    mountain: { border: 'border-[#4a6c7a]/55', bg: 'from-[#d8e3e8] to-[#fbf3e2]', text: '#4a6c7a' },
    red: { border: 'border-[#c8361d]/55', bg: 'from-[#f5d4cd] to-[#fbf3e2]', text: '#c8361d' },
  };
  const t = TONE[tone];
  return (
    <div className={`rounded-2xl border ${t.border} bg-gradient-to-br ${t.bg} p-4`}>
      <div className="text-[10px] tracking-[0.25em] uppercase font-bold text-[#4a3a30]">
        {label}
      </div>
      <div
        className="mt-2 text-3xl font-serif italic tabular-nums leading-tight"
        style={{ fontFamily: serif, color: t.text }}
      >
        {big}
      </div>
      <div className="mt-1 text-[11.5px] text-[#4a3a30] leading-tight">{sub}</div>
    </div>
  );
}

