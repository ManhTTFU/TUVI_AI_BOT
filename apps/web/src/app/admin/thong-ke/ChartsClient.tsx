'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useMemo } from 'react';
import { formatVnd } from '@/lib/money';
import type { DayBucket, MonthBucket, UserDayBucket } from '@/lib/admin-stats';

const SERIF = "'Cormorant Garamond',serif";

const COLORS = {
  gold: '#c89146',
  goldDark: '#5a3a1a',
  cream: '#f5e3c0',
  mountain: '#4a6c7a',
  mountainLight: '#8aaab8',
  ink: '#0f0a08',
  inkMute: '#4a3a30',
  border: '#c89146',
};

export default function ChartsClient({
  daily,
  monthly,
  usersDaily,
}: {
  daily: DayBucket[];
  monthly: MonthBucket[];
  usersDaily: UserDayBucket[];
}) {
  const dailyData = useMemo(() => padDaily(daily, 30), [daily]);
  const monthlyData = useMemo(() => padMonthly(monthly, 12), [monthly]);
  const userData = useMemo(() => padUsersDaily(usersDaily, 30), [usersDaily]);

  const totalRevenue30 = dailyData.reduce((s, d) => s + d.totalVnd, 0);
  const totalRevenue12 = monthlyData.reduce((s, d) => s + d.totalVnd, 0);
  const totalUsers30 = userData.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-6">
      <ChartCard
        title="Doanh thu 30 ngày qua"
        subtitle={`Tổng: ${formatVnd(totalRevenue30)} · trung bình ${formatVnd(Math.round(totalRevenue30 / 30))}/ngày`}
      >
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={dailyData} margin={{ top: 10, right: 16, left: 8, bottom: 6 }}>
            <defs>
              <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.gold} stopOpacity={0.55} />
                <stop offset="100%" stopColor={COLORS.gold} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={COLORS.mountain} strokeOpacity={0.12} strokeDasharray="3 3" />
            <XAxis
              dataKey="dayLabel"
              tick={{ fill: COLORS.inkMute, fontSize: 11 }}
              stroke={COLORS.mountain}
              strokeOpacity={0.3}
              interval={Math.floor(dailyData.length / 10)}
            />
            <YAxis
              tickFormatter={compactVnd}
              tick={{ fill: COLORS.inkMute, fontSize: 11 }}
              stroke={COLORS.mountain}
              strokeOpacity={0.3}
              width={60}
            />
            <Tooltip content={<VndTooltip suffix=" • lượt nạp" countKey="count" />} cursor={{ stroke: COLORS.gold, strokeWidth: 1, strokeDasharray: '3 3' }} />
            <Area
              type="monotone"
              dataKey="totalVnd"
              name="Doanh thu"
              stroke={COLORS.goldDark}
              strokeWidth={2}
              fill="url(#goldFill)"
              activeDot={{ r: 5, fill: COLORS.goldDark, stroke: COLORS.cream, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Doanh thu 12 tháng qua"
        subtitle={`Tổng: ${formatVnd(totalRevenue12)} · trung bình ${formatVnd(Math.round(totalRevenue12 / 12))}/tháng`}
      >
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={monthlyData} margin={{ top: 20, right: 16, left: 8, bottom: 6 }}>
            <defs>
              <linearGradient id="goldBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.gold} stopOpacity={1} />
                <stop offset="100%" stopColor={COLORS.goldDark} stopOpacity={0.9} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={COLORS.mountain} strokeOpacity={0.12} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="monthLabel"
              tick={{ fill: COLORS.inkMute, fontSize: 11 }}
              stroke={COLORS.mountain}
              strokeOpacity={0.3}
            />
            <YAxis
              tickFormatter={compactVnd}
              tick={{ fill: COLORS.inkMute, fontSize: 11 }}
              stroke={COLORS.mountain}
              strokeOpacity={0.3}
              width={60}
            />
            <Tooltip content={<VndTooltip suffix=" • lượt nạp" countKey="count" />} cursor={{ fill: COLORS.cream, fillOpacity: 0.35 }} />
            <Bar
              dataKey="totalVnd"
              name="Doanh thu"
              fill="url(#goldBar)"
              radius={[6, 6, 0, 0]}
              maxBarSize={56}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="User đăng ký 30 ngày qua"
        subtitle={`Tổng: ${totalUsers30} user · trung bình ${(totalUsers30 / 30).toFixed(1)}/ngày`}
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={userData} margin={{ top: 10, right: 16, left: 8, bottom: 6 }}>
            <defs>
              <linearGradient id="mountainBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.mountainLight} stopOpacity={1} />
                <stop offset="100%" stopColor={COLORS.mountain} stopOpacity={0.95} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={COLORS.mountain} strokeOpacity={0.12} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="dayLabel"
              tick={{ fill: COLORS.inkMute, fontSize: 11 }}
              stroke={COLORS.mountain}
              strokeOpacity={0.3}
              interval={Math.floor(userData.length / 10)}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: COLORS.inkMute, fontSize: 11 }}
              stroke={COLORS.mountain}
              strokeOpacity={0.3}
              width={40}
            />
            <Tooltip content={<CountTooltip />} cursor={{ fill: COLORS.cream, fillOpacity: 0.35 }} />
            <Bar
              dataKey="count"
              name="User mới"
              fill="url(#mountainBar)"
              radius={[4, 4, 0, 0]}
              maxBarSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-[#4a6c7a]/35 bg-[#fbf3e2]/95 p-5 md:p-6 shadow-[0_18px_50px_-30px_rgba(90,58,26,0.25)]">
      <header className="mb-4">
        <h2
          className="text-xl md:text-2xl font-serif italic text-[#5a3a1a]"
          style={{ fontFamily: SERIF }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-[12.5px] text-[#4a3a30] mt-0.5">{subtitle}</p>
        )}
      </header>
      {children}
    </div>
  );
}

// Recharts v3 typing cho custom Tooltip content rất chặt nhưng không export
// đầy đủ. Dùng inline shape rộng — chỉ đọc `active/payload/label` mà chart truyền vào.
interface TooltipContentProps {
  active?: boolean;
  label?: string | number;
  payload?: Array<{ value?: number | string; payload?: Record<string, unknown> }>;
}

function VndTooltip({
  active,
  payload,
  label,
  countKey,
  suffix,
}: TooltipContentProps & { countKey?: string; suffix?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  const data = item.payload ?? {};
  const total = Number(item.value ?? 0);
  const count = countKey ? Number(data[countKey] ?? 0) : null;
  return (
    <div className="rounded-xl border border-[#c89146]/55 bg-[#fbf3e2] px-3 py-2 shadow-lg text-[12.5px]">
      <div className="text-[11px] tracking-[0.2em] uppercase font-bold text-[#4a6c7a]">{label}</div>
      <div className="mt-0.5 font-bold text-[#5a3a1a] tabular-nums">{formatVnd(total)}</div>
      {count != null && (
        <div className="text-[11px] text-[#4a3a30] mt-0.5 tabular-nums">
          {count}{suffix ?? ''}
        </div>
      )}
    </div>
  );
}

function CountTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const count = Number(payload[0].value ?? 0);
  return (
    <div className="rounded-xl border border-[#4a6c7a]/55 bg-[#fbf3e2] px-3 py-2 shadow-lg text-[12.5px]">
      <div className="text-[11px] tracking-[0.2em] uppercase font-bold text-[#4a6c7a]">{label}</div>
      <div className="mt-0.5 font-bold text-[#4a6c7a] tabular-nums">{count} user mới</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Padding + label helpers

function padDaily(
  data: DayBucket[],
  days: number,
): Array<DayBucket & { dayLabel: string }> {
  const map = new Map(data.map((d) => [d.day, d]));
  const out: Array<DayBucket & { dayLabel: string }> = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = toLocalDate(d);
    const row = map.get(key) ?? { day: key, totalVnd: 0, count: 0 };
    out.push({ ...row, dayLabel: `${d.getDate()}/${d.getMonth() + 1}` });
  }
  return out;
}

function padMonthly(
  data: MonthBucket[],
  months: number,
): Array<MonthBucket & { monthLabel: string }> {
  const map = new Map(data.map((d) => [d.month, d]));
  const out: Array<MonthBucket & { monthLabel: string }> = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const row = map.get(key) ?? { month: key, totalVnd: 0, count: 0 };
    out.push({ ...row, monthLabel: `T${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}` });
  }
  return out;
}

function padUsersDaily(
  data: UserDayBucket[],
  days: number,
): Array<UserDayBucket & { dayLabel: string }> {
  const map = new Map(data.map((d) => [d.day, d]));
  const out: Array<UserDayBucket & { dayLabel: string }> = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = toLocalDate(d);
    const row = map.get(key) ?? { day: key, count: 0 };
    out.push({ ...row, dayLabel: `${d.getDate()}/${d.getMonth() + 1}` });
  }
  return out;
}

function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function compactVnd(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}
