'use client';

import Link from 'next/link';
import { useState } from 'react';
import { solarToLunar } from '@tuvi/lichvannien';
import type {
  AnalysisSections,
  ChartData,
  DeepReadingsData,
  PalaceData,
} from '@tuvi/core';
import { ANALYSIS_TITLES } from '@tuvi/core';
import { API_BASE_URL } from '@/lib/env';
import DeepReadings from './DeepReadings';

const SERIF_FONT = "'Cormorant Garamond',serif";

const CHI_TV = [
  'Tý',
  'Sửu',
  'Dần',
  'Mão',
  'Thìn',
  'Tỵ',
  'Ngọ',
  'Mùi',
  'Thân',
  'Dậu',
  'Tuất',
  'Hợi',
];

type Gender = 'nam' | 'nu';
type Calendar = 'duong' | 'am';

type FormState = {
  name: string;
  year: string;
  month: string;
  day: string;
  hour: number;
  gender: Gender;
  calendar: Calendar;
};

const ANALYSIS_ORDER: Array<keyof AnalysisSections> = [
  'overview',
  'career',
  'love',
  'health',
  'decade',
  'advice',
];

const CELL_POS: Record<string, [number, number]> = {
  Tỵ: [0, 0], Ngọ: [0, 1], Mùi: [0, 2], Thân: [0, 3],
  Thìn: [1, 0], Dậu: [1, 3],
  Mão: [2, 0], Tuất: [2, 3],
  Dần: [3, 0], Sửu: [3, 1], Tý: [3, 2], Hợi: [3, 3],
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

// Brute-force lunar→solar (lichvannien chỉ export solarToLunar). Lunar (ly,lm,ld)
// rơi vào solar đâu đó cách solar same-numeric ngày 0..50 ngày; quét ±10..+60 đủ an toàn.
function lunarToSolar(
  ld: number,
  lm: number,
  ly: number
): { d: number; m: number; y: number } | null {
  const base = new Date(ly, lm - 1, ld);
  if (Number.isNaN(base.getTime())) return null;
  for (let off = -10; off <= 60; off++) {
    const t = new Date(base);
    t.setDate(base.getDate() + off);
    const ts = solarToLunar(t.getDate(), t.getMonth() + 1, t.getFullYear());
    if (ts.day === ld && ts.month === lm && ts.year === ly && ts.leap === 0) {
      return { d: t.getDate(), m: t.getMonth() + 1, y: t.getFullYear() };
    }
  }
  return null;
}

type ApiBirthInfo = {
  name: string;
  gender: 'male' | 'female';
  birthDate: string;
  timeIndex: number;
  birthPlace: string;
};

function PalaceCell({ palace }: { palace: PalaceData | null }) {
  if (!palace) return <div className="rounded-lg border border-dashed border-[#4a6c7a]/25 bg-[#fbf3e2]/30 min-h-[120px]" />;

  const isMenh = palace.name === 'Mệnh';
  const isThan = palace.isBodyPalace;

  return (
    <div
      className={`relative rounded-lg border bg-[#fbf3e2]/95 p-2.5 min-h-[120px] flex flex-col ${
        isMenh
          ? 'border-[#c8361d] border-2 shadow-[0_0_0_2px_#c8361d20]'
          : 'border-[#4a6c7a]/45'
      }`}
    >
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <div className="text-[9px] tracking-[0.2em] uppercase text-[#4a3a30] font-semibold leading-none">
          {palace.name}
        </div>
        <div className="text-[10px] text-[#4a6c7a] font-semibold leading-none">
          {palace.heavenlyStem} {palace.earthlyBranch}
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-1">
        {palace.majorStars.map((s, i) => (
          <div
            key={i}
            className="text-[11px] font-semibold text-[#c8361d] leading-tight"
            title={s.brightness ? `Độ sáng: ${s.brightness}` : undefined}
          >
            {s.name}
            {s.mutagen && (
              <span className="ml-1 text-[9px] text-[#4a6c7a]">
                [Hóa {s.mutagen}]
              </span>
            )}
          </div>
        ))}
        {palace.minorStars.map((s, i) => (
          <div
            key={i}
            className="text-[10px] text-[#4a3a30] italic leading-tight"
          >
            {s.name}
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-1">
        {isMenh && (
          <span className="px-1.5 py-0.5 rounded-full bg-[#c8361d] text-[#fbf3e2] text-[9px] tracking-wider">
            MỆNH
          </span>
        )}
        {isThan && (
          <span className="px-1.5 py-0.5 rounded-full bg-[#3a8a5e] text-[#fbf3e2] text-[9px] tracking-wider">
            THÂN
          </span>
        )}
      </div>
    </div>
  );
}

function CenterCard({ chart }: { chart: ChartData }) {
  const isMale = chart.info.gender === 'male';
  return (
    <div className="rounded-lg border-2 border-[#4a6c7a]/60 bg-gradient-to-br from-[#fbf3e2] to-[#e9d4b6] p-4 flex flex-col justify-center h-full">
      <div className="text-center">
        <div className="text-[10px] tracking-[0.3em] uppercase text-[#0f0a08] font-semibold">
          Lá Số Tử Vi
        </div>
        <div
          className="mt-2 text-2xl font-serif italic text-[#5a3a1a]"
          style={{ fontFamily: SERIF_FONT }}
        >
          {isMale ? 'Càn Tạo' : 'Khôn Tạo'}
        </div>
        <div className="mt-3 space-y-1 text-[12px] text-[#0f0a08]">
          <div>
            Dương:{' '}
            <span className="font-semibold text-[#5a3a1a]">
              {chart.solarDate}
            </span>
          </div>
          <div>
            Âm:{' '}
            <span className="font-semibold text-[#5a3a1a]">
              {chart.lunarDate}
            </span>
          </div>
          <div>
            Can chi:{' '}
            <span className="font-semibold text-[#5a3a1a]">
              {chart.chineseDate}
            </span>
          </div>
          <div>
            Giờ:{' '}
            <span className="font-semibold text-[#5a3a1a]">
              {chart.time} ({chart.timeRange})
            </span>
          </div>
          <div>
            Ngũ hành:{' '}
            <span className="font-semibold text-[#5a3a1a]">
              {chart.fiveElementsClass}
            </span>
          </div>
          <div>
            Mệnh chủ:{' '}
            <span className="font-semibold text-[#5a3a1a]">{chart.soul}</span>{' '}
            · Thân chủ:{' '}
            <span className="font-semibold text-[#5a3a1a]">{chart.body}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LaSo({ chart }: { chart: ChartData }) {
  const grid: (PalaceData | null)[][] = Array(4)
    .fill(null)
    .map(() => Array(4).fill(null));
  for (const p of chart.palaces) {
    const pos = CELL_POS[p.earthlyBranch];
    if (pos) grid[pos[0]][pos[1]] = p;
  }
  return (
    <div className="rounded-2xl border border-[#4a6c7a]/55 bg-[#fbf3e2]/94 p-4 md:p-5 shadow-[0_30px_80px_-30px_rgba(90,58,26,0.3)]">
      <div className="grid grid-cols-4 grid-rows-4 gap-2">
        {grid.map((row, r) =>
          row.map((cell, c) => {
            if (r === 1 && c === 1) {
              return (
                <div key={`${r}-${c}`} className="col-span-2 row-span-2">
                  <CenterCard chart={chart} />
                </div>
              );
            }
            if ((r === 1 || r === 2) && (c === 1 || c === 2)) return null;
            return <PalaceCell key={`${r}-${c}`} palace={cell} />;
          })
        )}
      </div>
    </div>
  );
}

function FieldLabel({
  icon,
  children,
}: {
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-2.5 text-[#0f0a08]">
      <span className="text-[#4a6c7a] text-[15px]">{icon}</span>
      <span className="text-[14px] font-medium">{children}</span>
    </div>
  );
}

type SegOption<T extends string> = { value: T; label: string; icon: string };

function SegmentChoice<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: SegOption<T>[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`group relative h-[78px] rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${
              active
                ? 'border-[#4a6c7a] bg-gradient-to-br from-[#f5e3c0] to-[#e9c98a] shadow-[0_4px_14px_-4px_rgba(110,69,32,0.45)]'
                : 'border-[#4a6c7a]/30 bg-[#fbf3e2]/85 hover:border-[#4a6c7a]/55 hover:bg-[#fbf3e2]'
            }`}
          >
            <div
              className={`text-2xl leading-none ${
                active ? 'text-[#5a3a1a]' : 'text-[#4a6c7a]'
              }`}
            >
              {o.icon}
            </div>
            <div
              className={`text-[14px] font-semibold ${
                active ? 'text-[#0f0a08]' : 'text-[#0f0a08]'
              }`}
            >
              {o.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function AnalysisCards({ analysis }: { analysis: AnalysisSections }) {
  return (
    <div className="mt-6 grid md:grid-cols-2 gap-5">
      {ANALYSIS_ORDER.map((key) => {
        const text = analysis[key];
        if (!text) return null;
        const paragraphs = text.split(/\n\n+/).filter(Boolean);
        return (
          <article
            key={key}
            className="rounded-2xl border border-[#3a8a5e]/35 bg-gradient-to-br from-[#f5e8d0]/70 to-[#fbf3e2]/40 p-6 md:p-7"
          >
            <h4
              className="text-xl font-serif italic text-[#5a3a1a] mb-3"
              style={{ fontFamily: SERIF_FONT }}
            >
              {ANALYSIS_TITLES[key]}
            </h4>
            <div className="space-y-3 text-[14.5px] leading-[1.8] text-[#0f0a08]">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default function TuviClient() {
  const [form, setForm] = useState<FormState>({
    name: '',
    year: '',
    month: '',
    day: '',
    hour: 6,
    gender: 'nam',
    calendar: 'duong',
  });
  const [chart, setChart] = useState<ChartData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisSections | null>(null);
  const [deep, setDeep] = useState<DeepReadingsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [deepLoading, setDeepLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [deepError, setDeepError] = useState<string | null>(null);

  const buildBirthInfo = (): ApiBirthInfo | null => {
    const name = form.name.trim();
    if (!name) {
      setError('Vui lòng nhập họ và tên.');
      return null;
    }
    const yi = +form.year;
    const mi = +form.month;
    const di = +form.day;
    if (!yi || !mi || !di) {
      setError('Vui lòng nhập đầy đủ Ngày / Tháng / Năm sinh.');
      return null;
    }
    if (yi < 1900 || yi > 2100) {
      setError('Năm sinh ngoài khoảng cho phép (1900–2100).');
      return null;
    }
    if (mi < 1 || mi > 12) {
      setError('Tháng phải trong khoảng 1–12.');
      return null;
    }
    if (di < 1 || di > 31) {
      setError('Ngày phải trong khoảng 1–31.');
      return null;
    }

    let y = yi;
    let m = mi;
    let d = di;
    if (form.calendar === 'am') {
      const solar = lunarToSolar(d, m, y);
      if (!solar) {
        setError(
          'Không tìm được dương lịch tương ứng — kiểm tra lại ngày âm (có thể rơi vào tháng nhuận).'
        );
        return null;
      }
      y = solar.y;
      m = solar.m;
      d = solar.d;
    } else {
      const test = new Date(y, m - 1, d);
      if (test.getFullYear() !== y || test.getMonth() !== m - 1 || test.getDate() !== d) {
        setError('Ngày dương lịch không hợp lệ.');
        return null;
      }
    }

    return {
      name,
      gender: form.gender === 'nam' ? 'male' : 'female',
      birthDate: `${pad2(d)}/${pad2(m)}/${y}`,
      timeIndex: form.hour,
      birthPlace: '',
    };
  };

  const fetchAnalysis = (info: ApiBirthInfo) => {
    setAiLoading(true);
    setAnalysis(null);
    setAiError(null);
    fetch(`${API_BASE_URL}/api/tuvi/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(info),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data?.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
        setAnalysis(data.analysis as AnalysisSections);
      })
      .catch((err: Error) => setAiError(err.message))
      .finally(() => setAiLoading(false));
  };

  const fetchDeep = (info: ApiBirthInfo) => {
    setDeepLoading(true);
    setDeep(null);
    setDeepError(null);
    fetch(`${API_BASE_URL}/api/tuvi/deep-readings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(info),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data?.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
        setDeep(data.deep as DeepReadingsData);
      })
      .catch((err: Error) => setDeepError(err.message))
      .finally(() => setDeepLoading(false));
  };

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAiError(null);
    setDeepError(null);
    const info = buildBirthInfo();
    if (!info) return;
    setLoading(true);
    setChart(null);
    setAnalysis(null);
    setDeep(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tuvi/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      setChart(data.chart as ChartData);
      // Fire AI calls in parallel — chart already shown, hai phần AI tự fill khi xong.
      fetchAnalysis(info);
      fetchDeep(info);
    } catch (err) {
      setError(`Không lập được lá số: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative text-[#0f0a08]">
      <section className="pt-12 pb-8 px-6 text-center">
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
          Xem <em className="text-[#4a6c7a]">Tử Vi</em>
        </h1>
        <p className="mt-4 max-w-xl mx-auto text-[#0f0a08]">
          Lập lá số tử vi 14 chính tinh — luận giải 12 cung, sự nghiệp, tình
          duyên, tài lộc theo Can Chi và mệnh nạp âm.
        </p>
      </section>

      <section className="px-6">
        <div className="max-w-2xl mx-auto rounded-3xl border border-[#4a6c7a]/45 bg-[#fbf3e2]/95 p-7 md:p-10 shadow-[0_30px_80px_-30px_rgba(90,58,26,0.3)]">
          <form onSubmit={generate} className="space-y-7">
            <div>
              <FieldLabel icon="👤">Họ và tên</FieldLabel>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nhập tên của bạn"
                className="w-full h-12 px-4 rounded-2xl border border-[#4a6c7a]/35 bg-[#fbf3e2] text-[#0f0a08] placeholder:text-[#7a6a52] focus:outline-none focus:border-[#4a6c7a] focus:ring-2 focus:ring-[#4a6c7a]/15 transition"
              />
            </div>

            <div>
              <FieldLabel icon="⚥">Giới tính</FieldLabel>
              <SegmentChoice<Gender>
                value={form.gender}
                onChange={(v) => setForm({ ...form, gender: v })}
                options={[
                  { value: 'nam', label: 'Nam', icon: '♂' },
                  { value: 'nu', label: 'Nữ', icon: '♀' },
                ]}
              />
            </div>

            <div>
              <FieldLabel icon="🗓">Loại lịch</FieldLabel>
              <SegmentChoice<Calendar>
                value={form.calendar}
                onChange={(v) => setForm({ ...form, calendar: v })}
                options={[
                  { value: 'duong', label: 'Dương lịch', icon: '☀' },
                  { value: 'am', label: 'Âm lịch', icon: '☾' },
                ]}
              />
            </div>

            <div>
              <FieldLabel icon="📅">
                Ngày / Tháng / Năm sinh & Giờ sinh
              </FieldLabel>
              <p className="text-[12.5px] text-[#0f0a08] leading-relaxed mb-3">
                Chọn loại lịch (Dương lịch hoặc Âm lịch) ở trên, rồi nhập Ngày –
                Tháng – Năm theo đúng lịch đó. Lá số sẽ hiển thị cả dương lịch
                và âm lịch.
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-[1fr_1fr_1fr_1.6fr] gap-3">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={form.day}
                  onChange={(e) => setForm({ ...form, day: e.target.value })}
                  placeholder="Ngày"
                  className="h-12 px-4 rounded-2xl border border-[#4a6c7a]/35 bg-[#fbf3e2] text-[#0f0a08] text-center placeholder:text-[#7a6a52] focus:outline-none focus:border-[#4a6c7a] focus:ring-2 focus:ring-[#4a6c7a]/15 transition"
                />
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={form.month}
                  onChange={(e) => setForm({ ...form, month: e.target.value })}
                  placeholder="Tháng"
                  className="h-12 px-4 rounded-2xl border border-[#4a6c7a]/35 bg-[#fbf3e2] text-[#0f0a08] text-center placeholder:text-[#7a6a52] focus:outline-none focus:border-[#4a6c7a] focus:ring-2 focus:ring-[#4a6c7a]/15 transition"
                />
                <input
                  type="number"
                  min="1900"
                  max="2100"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  placeholder="Năm"
                  className="h-12 px-4 rounded-2xl border-2 border-[#4a6c7a]/55 bg-[#fbf3e2] text-[#0f0a08] text-center placeholder:text-[#7a6a52] focus:outline-none focus:border-[#4a6c7a] focus:ring-2 focus:ring-[#4a6c7a]/15 transition"
                />
                <select
                  value={form.hour}
                  onChange={(e) =>
                    setForm({ ...form, hour: +e.target.value })
                  }
                  className="col-span-3 sm:col-span-1 h-12 px-4 rounded-2xl border border-[#4a6c7a]/35 bg-[#fbf3e2] text-[#0f0a08] focus:outline-none focus:border-[#4a6c7a] focus:ring-2 focus:ring-[#4a6c7a]/15 transition appearance-none bg-no-repeat"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='none' stroke='%236e4520' stroke-width='1.5' d='M1 1.5l5 5 5-5'/></svg>\")",
                    backgroundPosition: 'right 16px center',
                    paddingRight: '40px',
                  }}
                >
                  {CHI_TV.map((c, i) => {
                    const start = String((23 + i * 2) % 24).padStart(2, '0');
                    const end = String((1 + i * 2) % 24).padStart(2, '0');
                    return (
                      <option key={i} value={i}>
                        Giờ {c} ({start}:00 – {end}:00)
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-[#c8361d]/40 bg-[#c8361d]/10 px-4 py-3 text-[#c8361d] text-[13.5px]">
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-full bg-gradient-to-r from-[#5a3a1a] via-[#7a4a1f] to-[#c89146] text-[#fbf3e2] font-semibold tracking-wide hover:from-[#4a6c7a] hover:via-[#8a5520] hover:to-[#d4a05a] transition shadow-[0_10px_30px_-10px_rgba(90,58,26,0.6)] flex items-center justify-center gap-2.5 text-[15px] disabled:opacity-60 disabled:cursor-wait"
            >
              <span className="text-lg">✦</span>
              <span>{loading ? 'Đang lập lá số…' : 'Lập Lá Số Tử Vi'}</span>
            </button>
          </form>
        </div>
      </section>

      {chart && (
        <section className="mt-10 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-6">
              <div className="text-[11px] tracking-[0.4em] text-[#4a6c7a] uppercase">
                紫 微 斗 數 · Tử Vi Đẩu Số
              </div>
              <h2
                className="mt-2 text-4xl font-serif italic text-[#0f0a08]"
                style={{ fontFamily: SERIF_FONT }}
              >
                Lá số {chart.info.name}
              </h2>
            </div>
            <LaSo chart={chart} />

            <div className="mt-6 rounded-2xl border border-[#3a8a5e]/35 bg-gradient-to-br from-[#f5e8d0]/70 to-[#fbf3e2]/40 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-3">
                <h3
                  className="text-2xl font-serif text-[#0f0a08]"
                  style={{ fontFamily: SERIF_FONT }}
                >
                  Diễn Cầm Luận Giải
                </h3>
                <span className="px-2.5 py-1 rounded-full bg-[#3a8a5e]/15 text-[#2a6e48] text-[10px] tracking-[0.2em] font-bold uppercase">
                  6 phần · AI
                </span>
              </div>

              {aiLoading && (
                <div className="flex items-center justify-center gap-3 py-8 text-[#0f0a08] italic">
                  <span className="inline-block w-2 h-2 bg-[#4a6c7a] rounded-full animate-pulse" />
                  <span
                    className="inline-block w-2 h-2 bg-[#4a6c7a] rounded-full animate-pulse"
                    style={{ animationDelay: '0.2s' }}
                  />
                  <span
                    className="inline-block w-2 h-2 bg-[#4a6c7a] rounded-full animate-pulse"
                    style={{ animationDelay: '0.4s' }}
                  />
                  <span className="ml-2">
                    Đang lắng nghe linh khí… (AI đang viết 6 đoạn)
                  </span>
                </div>
              )}
              {aiError && !aiLoading && (
                <div className="rounded-lg border border-[#c8361d]/40 bg-[#c8361d]/10 px-3 py-2 text-[#c8361d] text-[13px]">
                  ⚠ Không luận giải được: {aiError}
                </div>
              )}
              {analysis && <AnalysisCards analysis={analysis} />}
            </div>

            <DeepReadings
              chart={chart}
              form={form}
              deep={deep}
              deepLoading={deepLoading}
              deepError={deepError}
            />
          </div>
        </section>
      )}

      {!chart && !loading && (
        <section className="px-6 py-16">
          <div className="max-w-5xl mx-auto text-center text-[#0f0a08]">
            <p
              className="font-serif italic text-2xl"
              style={{ fontFamily: SERIF_FONT }}
            >
              &quot;Số mệnh là một cuốn sách viết bằng sao trời — tử vi giúp ta
              đọc được vài dòng đầu.&quot;
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
