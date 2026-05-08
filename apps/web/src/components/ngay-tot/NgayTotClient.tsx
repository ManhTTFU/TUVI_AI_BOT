'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const SERIF_FONT = "'Cormorant Garamond',serif";

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const WEEKDAY_NAMES = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
];

const VIET_WORK = [
  { key: 'khaitruong', label: 'Khai trương' },
  { key: 'cuoihoi', label: 'Cưới hỏi' },
  { key: 'xuathanh', label: 'Xuất hành' },
  { key: 'kykethopdong', label: 'Ký kết hợp đồng' },
  { key: 'dongtho', label: 'Động thổ' },
  { key: 'nhapha', label: 'Nhập trạch' },
  { key: 'antang', label: 'An táng' },
  { key: 'khaitruongkho', label: 'Mở kho' },
];

const NEN_LAM_POOL = [
  'Khai trương',
  'Cưới hỏi',
  'Xuất hành',
  'Ký kết hợp đồng',
  'Cầu tài',
  'Nhập trạch',
  'Động thổ',
  'Khai bút',
  'Cầu phúc',
  'Hội họp',
  'Sửa nhà',
  'Đính hôn',
];
const KIENG_KY_POOL = [
  'An táng',
  'Mở kho',
  'Vay mượn',
  'Tranh chấp',
  'Phá dỡ',
  'Đi xa',
  'Khởi công',
  'Mua bán lớn',
  'Phẫu thuật',
  'Cải táng',
  'Giao dịch',
  'Kiện tụng',
];

const SELECT_STYLE =
  'w-full h-11 px-3 rounded-lg border border-[#c89146]/55 bg-[#fbf3e2] text-[#0f0a08] focus:outline-none focus:border-[#4a6c7a]';

type DayKind = 'daicat' | 'hoangdao' | 'hacdao' | 'binh';

type DayMeta = {
  kind: DayKind;
  canChi: string;
  yearCanChi: string;
  monthCanChi: string;
  lunarDay: number;
  lunarMonth: number;
  nenLam: string[];
  kiengKy: string[];
  gioTot: string[];
};

type YMD = { y: number; m: number; d: number };
type YM = { y: number; m: number };
type Cell = { d: number; out: boolean; m: number; y: number };

function pseudo(seed: number): number {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function dayMeta(year: number, month: number, day: number): DayMeta {
  const seed = year * 10000 + month * 100 + day;
  const r = pseudo(seed);
  let kind: DayKind;
  if (r < 0.1) kind = 'daicat';
  else if (r < 0.55) kind = 'hoangdao';
  else if (r < 0.85) kind = 'hacdao';
  else kind = 'binh';

  const canIdx = seed % 10;
  const chiIdx = seed % 12;
  const yearCan = CAN[(year + 6) % 10];
  const yearChi = CHI[(year + 8) % 12];

  const date = new Date(year, month - 1, day);
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(year, 0, 0).getTime()) / 86400000
  );
  const lunarDay = ((dayOfYear - 30 + 30) % 30) + 1;
  const lunarMonth = Math.max(1, Math.min(12, month - 1 || 12));

  const shuffleByR = (arr: readonly string[], k: number): string[] => {
    const a = [...arr];
    for (let i = 0; i < k && i < a.length; i++) {
      const j = Math.floor(pseudo(seed + i * 31) * (a.length - i)) + i;
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a.slice(0, k);
  };

  return {
    kind,
    canChi: `${CAN[canIdx]} ${CHI[chiIdx]}`,
    yearCanChi: `${yearCan} ${yearChi}`,
    monthCanChi: `${CAN[(canIdx + 2) % 10]} ${CHI[(chiIdx + 5) % 12]}`,
    lunarDay,
    lunarMonth,
    nenLam: shuffleByR(NEN_LAM_POOL, 4),
    kiengKy: shuffleByR(KIENG_KY_POOL, 4),
    gioTot: shuffleByR(CHI, 4),
  };
}

function kindBadge(kind: DayKind): { label: string; dot: string; color: string } {
  switch (kind) {
    case 'daicat':
      return { label: 'ĐẠI CÁT · NGÀY TỐT NHẤT', dot: '#3a8a5e', color: '#3a8a5e' };
    case 'hoangdao':
      return { label: 'HOÀNG ĐẠO · NGÀY TỐT', dot: '#3a8a5e', color: '#3a8a5e' };
    case 'hacdao':
      return { label: 'HẮC ĐẠO · NGÀY KỴ', dot: '#c8361d', color: '#c8361d' };
    default:
      return { label: 'NGÀY BÌNH', dot: '#c89146', color: '#c89146' };
  }
}

function dotColorFor(kind: DayKind): string {
  if (kind === 'hacdao') return '#c8361d';
  if (kind === 'daicat' || kind === 'hoangdao') return '#3a8a5e';
  return '#c89146';
}

function todayYMD(): YMD {
  const t = new Date();
  return { y: t.getFullYear(), m: t.getMonth() + 1, d: t.getDate() };
}

// ====== Calendar ======
function Calendar() {
  const [today, setToday] = useState<YMD | null>(null);
  const [view, setView] = useState<YM | null>(null);
  const [selected, setSelected] = useState<YMD | null>(null);

  useEffect(() => {
    const t = todayYMD();
    setToday(t);
    setView({ y: t.y, m: t.m });
    setSelected(t);
  }, []);

  if (!today || !view || !selected) {
    return <CalendarSkeleton />;
  }

  const { y, m } = view;
  const firstDay = new Date(y, m - 1, 1).getDay();
  const daysInMonth = new Date(y, m, 0).getDate();
  const prevDays = new Date(y, m - 1, 0).getDate();

  const cells: Cell[] = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push({
      d: prevDays - firstDay + 1 + i,
      out: true,
      m: m - 1 || 12,
      y: m === 1 ? y - 1 : y,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ d, out: false, m, y });
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    cells.push({
      d: cells.length - firstDay - daysInMonth + 1,
      out: true,
      m: m === 12 ? 1 : m + 1,
      y: m === 12 ? y + 1 : y,
    });
  }

  const meta = dayMeta(selected.y, selected.m, selected.d);
  const badge = kindBadge(meta.kind);
  const monthName = `Tháng ${m} ${y}`;
  const selectedDate = new Date(selected.y, selected.m - 1, selected.d);
  const wdName = WEEKDAY_NAMES[selectedDate.getDay()];

  const navMonth = (delta: number) => {
    let nm = m + delta;
    let ny = y;
    if (nm < 1) {
      nm = 12;
      ny--;
    }
    if (nm > 12) {
      nm = 1;
      ny++;
    }
    setView({ y: ny, m: nm });
  };

  const isSelected = (c: Cell) =>
    !c.out && c.y === selected.y && c.m === selected.m && c.d === selected.d;
  const isToday = (c: Cell) =>
    !c.out && c.y === today.y && c.m === today.m && c.d === today.d;

  return (
    <section id="lich" className="relative py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 text-[11px] tracking-[0.4em] text-[#4a6c7a] uppercase">
            <span className="w-8 h-px bg-[#4a6c7a]/60" />
            Lịch Vạn Niên
            <span className="w-8 h-px bg-[#4a6c7a]/60" />
          </div>
          <h2
            className="mt-3 text-5xl md:text-6xl font-serif text-[#0f0a08]"
            style={{ fontFamily: SERIF_FONT }}
          >
            Ngày tốt cho <em className="text-[#4a6c7a]">mọi việc</em>
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-[#0f0a08]">
            Đối chiếu âm dương lịch, xem ngày hoàng đạo — hắc đạo, can chi tứ
            trụ và việc nên làm trong ngày.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          <div className="rounded-3xl border border-[#c89146]/55 bg-[#fbf3e2]/94 backdrop-blur-sm shadow-[0_30px_80px_-30px_rgba(90,58,26,0.25)] p-6 md:p-8">
            <div className="flex items-center justify-between mb-5">
              <button
                type="button"
                onClick={() => navMonth(-1)}
                className="w-10 h-10 rounded-full border border-[#c89146]/55 hover:bg-[#5a3a1a] hover:text-[#fbf3e2] transition flex items-center justify-center text-[#5a3a1a]"
                aria-label="Tháng trước"
              >
                ‹
              </button>
              <div
                className="font-serif italic text-[26px] text-[#0f0a08]"
                style={{ fontFamily: SERIF_FONT }}
              >
                {monthName}
              </div>
              <button
                type="button"
                onClick={() => navMonth(1)}
                className="w-10 h-10 rounded-full border border-[#c89146]/55 hover:bg-[#5a3a1a] hover:text-[#fbf3e2] transition flex items-center justify-center text-[#5a3a1a]"
                aria-label="Tháng sau"
              >
                ›
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1.5 mb-2">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="text-center text-[11px] tracking-widest text-[#0f0a08] py-2"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {cells.map((c, i) => {
                const cellMeta = !c.out ? dayMeta(c.y, c.m, c.d) : null;
                const sel = isSelected(c);
                const tod = isToday(c);
                return (
                  <button
                    type="button"
                    key={i}
                    disabled={c.out}
                    onClick={() =>
                      !c.out && setSelected({ y: c.y, m: c.m, d: c.d })
                    }
                    className={`relative aspect-square rounded-xl border text-left p-2 transition group ${
                      sel
                        ? 'bg-gradient-to-br from-[#e9c98a] to-[#c89146] border-[#4a6c7a] shadow-[0_8px_24px_-8px_rgba(138,90,46,0.6)]'
                        : c.out
                        ? 'border-transparent text-[#4a3a30]/50 cursor-default'
                        : tod
                        ? 'border-[#4a6c7a] border-2 bg-[#fbf3e2]'
                        : 'border-[#c89146]/45 bg-[#fbf3e2]/75 hover:border-[#4a6c7a]/60 hover:bg-[#fbf3e2]'
                    }`}
                  >
                    {!c.out && cellMeta && !sel && (
                      <span
                        className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                        style={{ background: dotColorFor(cellMeta.kind) }}
                      />
                    )}
                    <div className="text-[15px] font-semibold text-[#0f0a08]">
                      {c.d}
                    </div>
                    {!c.out && cellMeta && (
                      <div
                        className={`text-[10px] mt-0.5 ${
                          sel ? 'text-[#5a3a1a]' : 'text-[#0f0a08]'
                        }`}
                      >
                        {cellMeta.lunarDay}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-5 pt-4 border-t border-[#c89146]/45 flex flex-wrap gap-4 text-[11px] text-[#0f0a08]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3a8a5e]" /> Hoàng đạo
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#c8361d]" /> Hắc đạo
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#c89146]" /> Bình
              </span>
              <span className="inline-flex items-center gap-1.5 ml-auto">
                <span className="w-3 h-3 rounded-md border-2 border-[#4a6c7a]" />{' '}
                Hôm nay
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-[#c89146]/55 bg-[#fbf3e2]/94 backdrop-blur-sm p-6 md:p-7">
            <div className="flex items-baseline gap-4">
              <div
                className="text-[88px] leading-none font-serif italic text-[#5a3a1a]"
                style={{ fontFamily: SERIF_FONT }}
              >
                {selected.d}
              </div>
              <div>
                <div className="text-[#0f0a08] font-medium">
                  {wdName}, Tháng {selected.m} {selected.y}
                </div>
                <div className="text-sm text-[#0f0a08] mt-1">
                  Âm lịch:{' '}
                  <span className="text-[#5a3a1a] font-semibold">
                    {meta.lunarDay}/{meta.lunarMonth}
                  </span>{' '}
                  năm{' '}
                  <span className="text-[#5a3a1a] font-semibold">
                    {meta.yearCanChi}
                  </span>
                </div>
              </div>
            </div>
            <div
              className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border"
              style={{
                borderColor: badge.color + '55',
                background: badge.color + '12',
                color: badge.color,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: badge.dot }}
              />
              <span className="text-[11px] tracking-[0.2em] font-semibold">
                {badge.label}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#c89146]/50 bg-[#fbf3e2]/80 p-4">
                <div className="text-[10px] tracking-[0.3em] text-[#0f0a08] font-semibold uppercase mb-2">
                  Nên làm
                </div>
                <ul className="space-y-1.5 text-sm text-[#0f0a08]">
                  {meta.nenLam.map((n) => (
                    <li key={n} className="flex gap-2">
                      <span className="text-[#3a8a5e]">•</span>
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-[#c89146]/50 bg-[#fbf3e2]/80 p-4">
                <div className="text-[10px] tracking-[0.3em] text-[#0f0a08] font-semibold uppercase mb-2">
                  Kiêng kỵ
                </div>
                <ul className="space-y-1.5 text-sm text-[#0f0a08]">
                  {meta.kiengKy.map((n) => (
                    <li key={n} className="flex gap-2">
                      <span className="text-[#c8361d]">•</span>
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-[#c89146]/45 grid grid-cols-4 gap-2">
              <PillarCard label="Năm" value={meta.yearCanChi} />
              <PillarCard label="Tháng" value={meta.monthCanChi} />
              <PillarCard label="Ngày" value={meta.canChi} />
              <PillarCard
                label="Giờ tốt"
                value={meta.gioTot.slice(0, 4).join(', ')}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CalendarSkeleton() {
  return (
    <section className="relative py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-3xl border border-[#c89146]/55 bg-[#fbf3e2]/94 backdrop-blur-sm p-8 min-h-[600px] flex items-center justify-center text-[#0f0a08]">
          Đang tải lịch…
        </div>
      </div>
    </section>
  );
}

function PillarCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#c89146]/50 bg-[#fbf3e2]/75 px-2.5 py-2.5 text-center">
      <div className="text-[9px] tracking-[0.25em] text-[#0f0a08] font-semibold uppercase">
        {label}
      </div>
      <div
        className="mt-1 text-[13px] font-serif italic text-[#5a3a1a]"
        style={{ fontFamily: SERIF_FONT }}
      >
        {value}
      </div>
    </div>
  );
}

// ====== Deep Reading ======
function DeepReading() {
  const [date, setDate] = useState<YMD | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDate(todayYMD());
  }, []);

  if (!date) return null;

  const meta = dayMeta(date.y, date.m, date.d);
  const badge = kindBadge(meta.kind);
  const dt = new Date(date.y, date.m - 1, date.d);
  const wdName = WEEKDAY_NAMES[dt.getDay()];
  const dateStr = `${String(date.d).padStart(2, '0')}/${String(date.m).padStart(2, '0')}/${date.y}`;

  const isTamNuong = [3, 7, 13, 18, 22, 27].includes(meta.lunarDay);
  const isNguyetKy = [5, 14, 23].includes(meta.lunarDay);

  const fallback = `Ngày ${dateStr}, Can Chi ${meta.canChi}, là một ngày ${
    meta.kind === 'hoangdao'
      ? 'Hoàng Đạo'
      : meta.kind === 'daicat'
      ? 'Đại Cát'
      : meta.kind === 'hacdao'
      ? 'Hắc Đạo'
      : 'bình'
  } với năng lượng ${
    meta.kind === 'hacdao' ? 'cần thận trọng' : 'tích cực'
  }.\n\nNên làm: ${meta.nenLam.join(', ')}.\n\nKiêng kỵ: ${meta.kiengKy.join(
    ', '
  )}.\n\nGiờ tốt nên hành sự: ${meta.gioTot
    .slice(0, 3)
    .map((c) => 'Giờ ' + c)
    .join(', ')}.`;

  const ask = async () => {
    setLoading(true);
    setText('');
    try {
      // TODO: thay bằng call thật tới AI endpoint, ví dụ:
      //   const res = await fetch('/api/tuvi/ngay-tot/luangiai', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({ date, meta, isTamNuong, isNguyetKy }),
      //   });
      //   const { text } = await res.json();
      //   setText(text);
      throw new Error('AI endpoint chưa wire — dùng fallback');
    } catch {
      setText(fallback);
    } finally {
      setLoading(false);
    }
  };

  const paragraphs = text ? text.split(/\n\n+/).filter(Boolean) : [];

  return (
    <section id="luangiai" className="relative py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-3xl border border-[#c89146]/55 bg-[#fbf3e2]/90 backdrop-blur-sm p-7 md:p-10 shadow-[0_30px_80px_-30px_rgba(90,58,26,0.25)]">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div
                className="text-2xl md:text-3xl font-serif italic text-[#0f0a08]"
                style={{ fontFamily: SERIF_FONT }}
              >
                {wdName}, {dateStr}
              </div>
              <div className="mt-1 text-[#0f0a08]">
                Ngày {meta.lunarDay} tháng {meta.lunarMonth} năm{' '}
                <span className="font-semibold">{meta.yearCanChi}</span>
              </div>
              <div className="text-[#0f0a08]">
                Can Chi:{' '}
                <span className="font-semibold text-[#5a3a1a]">
                  {meta.canChi}
                </span>
              </div>
            </div>
            <div
              className="px-4 py-1.5 rounded-full border"
              style={{
                borderColor: badge.color + '55',
                background: badge.color + '12',
                color: badge.color,
              }}
            >
              <span className="text-[12px] tracking-[0.2em] font-semibold uppercase">
                {meta.kind === 'daicat'
                  ? 'Đại Cát'
                  : meta.kind === 'hoangdao'
                  ? 'Tốt'
                  : meta.kind === 'hacdao'
                  ? 'Cẩn Trọng'
                  : 'Bình Thường'}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#3a8a5e]/40 bg-[#3a8a5e]/10 text-[#2a6e48] text-[13px] font-medium">
              ✦ Minh Đường — Hoàng Đạo
            </span>
            {isTamNuong && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c8361d]/40 bg-[#c8361d]/10 text-[#c8361d] text-[13px] font-medium">
                ⚠ Ngày Tam Nương
              </span>
            )}
            {isNguyetKy && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c8361d]/40 bg-[#c8361d]/10 text-[#c8361d] text-[13px] font-medium">
                ⚠ Ngày Nguyệt Kỵ
              </span>
            )}
          </div>

          <div className="my-6 h-px bg-gradient-to-r from-transparent via-[#b58a4a]/40 to-transparent" />

          <div className="flex items-center gap-3 mb-4">
            <h3
              className="text-2xl font-serif text-[#0f0a08]"
              style={{ fontFamily: SERIF_FONT }}
            >
              Luận Giải Ngày
            </h3>
            <span className="px-2.5 py-1 rounded-full bg-[#3a8a5e]/15 text-[#2a6e48] text-[10px] tracking-[0.2em] font-bold uppercase">
              Miễn Phí
            </span>
          </div>

          <div className="rounded-2xl border border-[#3a8a5e]/30 bg-gradient-to-br from-[#f5e8d0]/60 to-[#fbf3e2]/30 p-6 md:p-8">
            {!text && !loading && (
              <div className="text-center py-6">
                <p
                  className="text-[#0f0a08] mb-4 italic font-serif text-lg"
                  style={{ fontFamily: SERIF_FONT }}
                >
                  Diễn Cầm sẽ luận giải sâu sắc về ngày này — kết hợp Can Chi,
                  sao chiếu và phong thủy.
                </p>
                <button
                  type="button"
                  onClick={ask}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-gradient-to-br from-[#c89146] to-[#4a6c7a] text-[#fbf3e2] font-medium hover:from-[#d4a05a] hover:to-[#85501a] transition shadow-md"
                >
                  ✦ Xin luận giải ngày này
                </button>
              </div>
            )}
            {loading && (
              <div className="flex items-center justify-center gap-3 py-10 text-[#0f0a08] italic">
                <span className="inline-block w-2 h-2 bg-[#4a6c7a] rounded-full animate-pulse" />
                <span
                  className="inline-block w-2 h-2 bg-[#4a6c7a] rounded-full animate-pulse"
                  style={{ animationDelay: '0.2s' }}
                />
                <span
                  className="inline-block w-2 h-2 bg-[#4a6c7a] rounded-full animate-pulse"
                  style={{ animationDelay: '0.4s' }}
                />
                <span className="ml-2">Đang lắng nghe linh khí…</span>
              </div>
            )}
            {paragraphs.length > 0 && (
              <div className="space-y-4 text-[15.5px] leading-[1.85] text-[#000]">
                {paragraphs.map((p, i) => (
                  <p
                    key={i}
                    className={
                      i === 0
                        ? 'first-letter:text-5xl first-letter:font-serif first-letter:text-[#5a3a1a] first-letter:mr-2 first-letter:float-left first-letter:leading-[0.9]'
                        : ''
                    }
                  >
                    {p}
                  </p>
                ))}
                <div className="pt-3 border-t border-[#c89146]/45 flex flex-wrap gap-3 items-center justify-between">
                  <div className="text-xs text-[#0f0a08]">
                    Diễn giải bởi{' '}
                    <span className="text-[#5a3a1a] font-semibold italic">
                      Diễn Cầm
                    </span>{' '}
                    · {dateStr}
                  </div>
                  <button
                    type="button"
                    onClick={ask}
                    className="text-[#5a3a1a] hover:text-[#4a6c7a] text-sm"
                  >
                    ↻ Luận giải lại
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 flex-wrap text-sm">
            <span className="text-[#0f0a08]">Chọn ngày khác:</span>
            <input
              type="date"
              value={`${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`}
              onChange={(e) => {
                const parts = e.target.value.split('-').map(Number);
                const [yy, mm, dd] = parts;
                if (yy && mm && dd) {
                  setDate({ y: yy, m: mm, d: dd });
                  setText('');
                }
              }}
              className="px-3 py-2 rounded-lg border border-[#c89146]/55 bg-[#fbf3e2] text-[#0f0a08] focus:outline-none focus:border-[#4a6c7a]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ====== Find Day ======
type FindResult = { d: number; y: number; m: number; meta: DayMeta; score: number };

function FindDay() {
  const [today, setToday] = useState<YMD | null>(null);
  const [work, setWork] = useState('cuoihoi');
  const [birth, setBirth] = useState(1988);
  const [month, setMonth] = useState<YM | null>(null);
  const [results, setResults] = useState<FindResult[] | null>(null);

  useEffect(() => {
    const t = todayYMD();
    setToday(t);
    setMonth({ y: t.y, m: t.m });
  }, []);

  if (!today || !month) {
    return (
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto text-center text-[#0f0a08]">
          Đang tải…
        </div>
      </section>
    );
  }

  const search = () => {
    const { y, m } = month;
    const dim = new Date(y, m, 0).getDate();
    const candidates: FindResult[] = [];
    for (let d = 1; d <= dim; d++) {
      const meta = dayMeta(y, m, d);
      if (meta.kind === 'daicat' || meta.kind === 'hoangdao') {
        const score =
          (meta.kind === 'daicat' ? 100 : 60) +
          pseudo(birth * 100 + d) * 30;
        candidates.push({ d, y, m, meta, score });
      }
    }
    candidates.sort((a, b) => b.score - a.score);
    setResults(candidates.slice(0, 3));
  };

  const years: number[] = [];
  for (let i = today.y; i >= 1940; i--) years.push(i);

  const months: YM[] = [];
  for (let i = 0; i < 18; i++) {
    const d = new Date(today.y, today.m - 1 + i, 1);
    months.push({ y: d.getFullYear(), m: d.getMonth() + 1 });
  }

  return (
    <section id="timngay" className="relative py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 text-[11px] tracking-[0.4em] text-[#4a6c7a] uppercase">
            <span className="w-8 h-px bg-[#4a6c7a]/60" />
            Tìm Ngày Tốt
            <span className="w-8 h-px bg-[#4a6c7a]/60" />
          </div>
          <h2
            className="mt-3 text-5xl md:text-6xl font-serif text-[#0f0a08]"
            style={{ fontFamily: SERIF_FONT }}
          >
            Chọn ngày <em className="text-[#4a6c7a]">hoàng đạo</em>
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-[#0f0a08]">
            Tra cứu ngày giờ tốt cho từng việc trọng đại — đối chiếu tuổi, mệnh
            và can chi.
          </p>
        </div>

        <div className="rounded-3xl border border-[#c89146]/55 bg-[#fbf3e2]/94 backdrop-blur-sm p-6 md:p-8 shadow-[0_30px_80px_-30px_rgba(90,58,26,0.25)]">
          <div className="grid sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
            <Field label="Việc cần xem">
              <select
                value={work}
                onChange={(e) => setWork(e.target.value)}
                className={SELECT_STYLE}
              >
                {VIET_WORK.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Năm sinh">
              <select
                value={birth}
                onChange={(e) => setBirth(+e.target.value)}
                className={SELECT_STYLE}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tháng cần xem">
              <select
                value={`${month.y}-${month.m}`}
                onChange={(e) => {
                  const [yy, mm] = e.target.value.split('-').map(Number);
                  setMonth({ y: yy, m: mm });
                }}
                className={SELECT_STYLE}
              >
                {months.map((o) => (
                  <option key={`${o.y}-${o.m}`} value={`${o.y}-${o.m}`}>
                    Tháng {o.m}/{o.y}
                  </option>
                ))}
              </select>
            </Field>
            <button
              type="button"
              onClick={search}
              className="h-11 px-7 rounded-full bg-gradient-to-br from-[#c89146] to-[#4a6c7a] text-[#fbf3e2] font-medium hover:from-[#d4a05a] hover:to-[#a06a32] transition shadow-md whitespace-nowrap"
            >
              ✦ Tìm ngày
            </button>
          </div>

          {results && (
            <div className="mt-7 grid sm:grid-cols-3 gap-4">
              {results.length === 0 && (
                <div className="sm:col-span-3 text-center py-10 text-[#0f0a08]">
                  Không tìm thấy ngày phù hợp trong tháng này — hãy thử tháng
                  khác.
                </div>
              )}
              {results.map((r, i) => {
                const date = new Date(r.y, r.m - 1, r.d);
                const wd = WEEKDAYS[date.getDay()];
                const ratingLabel =
                  r.meta.kind === 'daicat'
                    ? 'ĐẠI CÁT'
                    : r.meta.kind === 'hoangdao'
                    ? 'TỐT'
                    : 'BÌNH';
                return (
                  <div
                    key={i}
                    className="rounded-2xl border border-[#c89146]/55 bg-[#fbf3e2]/85 p-5 text-center hover:border-[#4a6c7a]/60 transition"
                  >
                    <div className="text-[10px] tracking-[0.3em] text-[#0f0a08] font-semibold uppercase">
                      {wd} · Tháng {r.m}/{r.y}
                    </div>
                    <div
                      className="my-3 text-[64px] leading-none font-serif italic text-[#4a6c7a]"
                      style={{ fontFamily: SERIF_FONT }}
                    >
                      {r.d}
                    </div>
                    <div className="text-sm text-[#0f0a08]">
                      Âm:{' '}
                      <span className="text-[#0f0a08] font-medium">
                        {r.meta.lunarDay}/{r.meta.lunarMonth}
                      </span>{' '}
                      · {r.meta.canChi}
                    </div>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#3a8a5e]/40 bg-[#3a8a5e]/10 text-[#3a8a5e]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3a8a5e]" />
                      <span className="text-[11px] tracking-[0.2em] font-semibold">
                        {ratingLabel}
                      </span>
                    </div>
                    <div className="mt-3 text-[11px] text-[#0f0a08]">
                      Giờ tốt:{' '}
                      {r.meta.gioTot
                        .slice(0, 3)
                        .map((c) => 'Giờ ' + c)
                        .join(' · ')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-[10px] tracking-[0.3em] text-[#0f0a08] font-semibold uppercase mb-1.5">
        {label}
      </div>
      {children}
    </label>
  );
}

export default function NgayTotClient() {
  return (
    <div className="relative text-[#0f0a08]">
      <section id="top" className="pt-12 pb-8 px-6 text-center">
        <Link
          href="/"
          className="inline-block text-[11px] tracking-[0.3em] text-[#4a6c7a] hover:text-[#5a3a1a] uppercase"
        >
          ← Trang chủ
        </Link>
        <h1
          className="mt-3 font-serif text-[#0f0a08] leading-[0.95] text-[clamp(48px,7vw,96px)]"
          style={{ fontFamily: SERIF_FONT }}
        >
          Xem Ngày <em className="text-[#4a6c7a]">Tốt</em>
        </h1>
        <p className="mt-4 max-w-xl mx-auto text-[#0f0a08]">
          Lịch vạn niên — Đối chiếu hoàng đạo, hắc đạo, can chi tứ trụ và giờ
          tốt cho mọi việc trọng đại.
        </p>
      </section>
      <Calendar />
      <DeepReading />
      <FindDay />
    </div>
  );
}
