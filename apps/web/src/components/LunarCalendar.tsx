'use client';

import { useMemo, useState } from 'react';
import { getDayInfo, type DayInfo } from '@tuvi/lichvannien';

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTH_LABEL = (m: number) => `Tháng ${m}`;

interface CellData {
  info: DayInfo;
  isCurrentMonth: boolean;
  isToday: boolean;
}

/** Lịch bắt đầu từ Thứ 2. `getDay()` trả 0=CN, ..., 6=T7 → offset = (getDay()+6)%7. */
function buildMonthGrid(year: number, month: number, today: Date): CellData[] {
  const first = new Date(year, month - 1, 1);
  const offset = (first.getDay() + 6) % 7;
  const gridStart = new Date(year, month - 1, 1 - offset);
  const cells: CellData[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const info = getDayInfo(d.getDate(), d.getMonth() + 1, d.getFullYear());
    cells.push({
      info,
      isCurrentMonth: d.getMonth() + 1 === month,
      isToday:
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate(),
    });
  }
  return cells;
}

export function LunarCalendar() {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  });
  const [selected, setSelected] = useState<DayInfo>(() =>
    getDayInfo(today.getDate(), today.getMonth() + 1, today.getFullYear())
  );

  const cells = useMemo(
    () => buildMonthGrid(cursor.year, cursor.month, today),
    [cursor, today]
  );

  const prev = () =>
    setCursor((c) =>
      c.month === 1
        ? { year: c.year - 1, month: 12 }
        : { year: c.year, month: c.month - 1 }
    );
  const next = () =>
    setCursor((c) =>
      c.month === 12
        ? { year: c.year + 1, month: 1 }
        : { year: c.year, month: c.month + 1 }
    );

  const isGood = selected.dayStar.kind === 'hoang-dao';
  const yearShort = selected.solar.year % 100;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#0f0a08] via-[#2a1c14] to-[#5a3a1a] py-20 text-white">
      {/* brand sumi gradient: mực tàu → bronze → đồng cổ, glow vàng đồng + chu sa nhẹ */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute left-1/4 top-10 h-72 w-72 rounded-full bg-[#c89146]/25 blur-3xl" />
        <div className="absolute right-1/4 bottom-10 h-72 w-72 rounded-full bg-[#c8361d]/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        <div className="text-center">
          <h2 className="font-serif text-3xl font-bold md:text-4xl">
            Tra Cứu Lịch Vạn Niên
          </h2>
          <p className="mt-2 text-sm text-white/70">
            Xem ngày tốt xấu và tử vi hàng ngày
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[280px_1fr_300px]">
          {/* LEFT — Hôm nay / Ngày đang chọn */}
          <aside className="rounded-2xl bg-slate-900/60 p-5 shadow-xl ring-1 ring-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/90">
              <span className="inline-block h-2 w-2 rounded-full bg-white" />
              {selected.solar.day === today.getDate() &&
              selected.solar.month === today.getMonth() + 1 &&
              selected.solar.year === today.getFullYear()
                ? 'Hôm nay'
                : 'Ngày đã chọn'}
            </div>
            <div
              className="relative mt-3 overflow-hidden rounded-xl bg-cover bg-center bg-no-repeat text-center shadow-lg ring-1 ring-white/15"
              style={{ backgroundImage: "url('/images/day-card-bg.jpg')" }}
            >
              {/* gradient overlay — đồng tone slate-900 với các panel khác,
                  đậm ở trên/dưới để text rõ, nhẹ ở giữa để lộ ảnh */}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-b from-slate-900/65 via-slate-900/20 to-slate-900/70"
              />
              <div className="relative px-4 py-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90 drop-shadow-md">
                  {selected.solar.weekday === 0
                    ? 'Chủ nhật'
                    : `Thứ ${selected.solar.weekday + 1}`}
                </div>
                <div className="mt-2 font-serif text-7xl font-bold leading-none text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.75)]">
                  {selected.solar.day}
                </div>
                <div className="mt-2 text-[11px] font-medium uppercase tracking-[0.15em] text-white/85 drop-shadow-md">
                  Tháng {selected.solar.month} · {selected.solar.year}
                </div>
              </div>
            </div>

            <div className="my-4 h-px bg-white/20" />

            <div className="text-[11px] font-semibold uppercase tracking-widest text-white/80">
              Âm lịch
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <CanChiCol
                num={selected.lunar.day}
                label={selected.canChiText.day}
              />
              <CanChiCol
                num={selected.lunar.month}
                label={selected.canChiText.month}
                leap={selected.lunar.leap === 1}
              />
              <CanChiCol num={yearShort} label={selected.canChiText.year} />
            </div>

            <div className="my-4 h-px bg-white/20" />

            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/80">
              <span>☀</span> Giờ tốt
              {selected.solar.day === today.getDate() ? ' hôm nay' : ''}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-white/95">
              {selected.luckyHours
                .map((h) => `${h.chi} (${shortRange(h.range)})`)
                .join(', ')}
            </p>
          </aside>

          {/* MIDDLE — Calendar */}
          <div className="rounded-2xl bg-slate-900/60 p-5 shadow-xl ring-1 ring-white/10 backdrop-blur-sm md:p-6">
            <div className="flex items-center justify-between">
              <div className="font-serif text-xl font-semibold text-white">
                {MONTH_LABEL(cursor.month)} - {cursor.year}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Tháng trước"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/80 ring-1 ring-white/10 transition hover:bg-white/10"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Tháng sau"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/80 ring-1 ring-white/10 transition hover:bg-white/10"
                >
                  →
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs font-medium text-white/50">
              {WEEKDAY_LABELS.map((w, i) => (
                <div key={w} className={i === 6 ? 'text-rose-300' : ''}>
                  {w}
                </div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {cells.map((cell, idx) => {
                const isSelected =
                  cell.info.solar.day === selected.solar.day &&
                  cell.info.solar.month === selected.solar.month &&
                  cell.info.solar.year === selected.solar.year;
                const good = cell.info.dayStar.kind === 'hoang-dao';
                const base =
                  'flex min-h-[58px] flex-col items-center justify-center rounded-xl p-1.5 text-center transition';

                let tone = '';
                if (!cell.isCurrentMonth) {
                  tone = 'text-white/25 hover:text-white/50';
                } else if (cell.isToday) {
                  tone =
                    'bg-gradient-to-br from-[#c89146] to-[#5a3a1a] text-white shadow-lg shadow-[#c89146]/30 ring-1 ring-[#e9d4b6]/50';
                } else if (isSelected) {
                  tone = 'bg-white/15 text-white ring-1 ring-white/30';
                } else if (good) {
                  tone =
                    'bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-400/30 hover:bg-emerald-500/25';
                } else {
                  tone =
                    'bg-rose-500/15 text-rose-100 ring-1 ring-rose-400/30 hover:bg-rose-500/25';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelected(cell.info)}
                    className={`${base} ${tone}`}
                    title={`${cell.info.dayStar.name} (${good ? 'hoàng đạo' : 'hắc đạo'})`}
                  >
                    <span className="text-base font-semibold leading-none">
                      {cell.info.solar.day}
                    </span>
                    <span className="mt-1 text-[10px] leading-none opacity-70">
                      {cell.info.lunar.day}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-5 text-xs text-white/70">
              <Dot color="bg-[#c89146]" label="Hôm nay" />
              <Dot color="bg-emerald-400" label="Ngày tốt" />
              <Dot color="bg-rose-400" label="Ngày xấu" />
            </div>
          </div>

          {/* RIGHT — Vận hạn */}
          <aside className="rounded-2xl bg-slate-900/60 p-5 shadow-xl ring-1 ring-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/80">
              <span>✦</span> Vận hạn
            </div>

            <div className="mt-4 space-y-3">
              <InfoRow
                accent="emerald"
                icon="✓"
                title="Ngày tốt"
                body={selected.advice.nen.join(', ')}
              />
              <InfoRow
                accent="rose"
                icon="✗"
                title="Ngày xấu"
                body={selected.advice.kieng.join(', ')}
              />
              <InfoRow
                accent="amber"
                icon="↗"
                title="Hướng xuất hành"
                body={selected.directions.combined}
              />
              <InfoRow
                accent="sky"
                icon="★"
                title="Sao chiếu mệnh"
                body={`${selected.dayStar.name} (${isGood ? 'hoàng đạo' : 'hắc đạo'})`}
              />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function CanChiCol({
  num,
  label,
  leap,
}: {
  num: number;
  label: string;
  leap?: boolean;
}) {
  return (
    <div className="rounded-lg bg-white/10 px-2 py-2 ring-1 ring-white/15">
      <div className="font-serif text-2xl font-bold leading-none">
        {num}
        {leap ? 'N' : ''}
      </div>
      <div className="mt-1 text-[11px] text-white/80">{label}</div>
    </div>
  );
}

function Dot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

const ACCENT_STYLES = {
  emerald: {
    icon: 'bg-emerald-500/20 text-emerald-300 ring-emerald-400/30',
    title: 'text-emerald-200',
  },
  rose: {
    icon: 'bg-rose-500/20 text-rose-300 ring-rose-400/30',
    title: 'text-rose-200',
  },
  amber: {
    icon: 'bg-amber-500/20 text-amber-300 ring-amber-400/30',
    title: 'text-amber-200',
  },
  sky: {
    icon: 'bg-sky-500/20 text-sky-300 ring-sky-400/30',
    title: 'text-sky-200',
  },
} as const;

function InfoRow({
  accent,
  icon,
  title,
  body,
}: {
  accent: keyof typeof ACCENT_STYLES;
  icon: string;
  title: string;
  body: string;
}) {
  const styles = ACCENT_STYLES[accent];
  return (
    <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
      <div className="flex items-center gap-2">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ring-1 ${styles.icon}`}
        >
          {icon}
        </span>
        <span className={`text-xs font-semibold ${styles.title}`}>{title}</span>
      </div>
      <p className="mt-1.5 text-sm text-white/85">{body}</p>
    </div>
  );
}

/** "23:00 – 01:00" → "23-1h" */
function shortRange(range: string): string {
  const m = range.match(/(\d+):\d+ – (\d+):\d+/);
  if (!m) return range;
  const a = parseInt(m[1], 10);
  const b = parseInt(m[2], 10);
  return `${a}-${b}h`;
}
