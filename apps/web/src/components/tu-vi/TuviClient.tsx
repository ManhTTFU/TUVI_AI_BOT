'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { solarToLunar } from '@tuvi/lichvannien';
import type {
  AnalysisSections,
  ChartData,
  DeepReadingsData,
} from '@tuvi/core';
import { formatVnd } from '@/lib/money';
import { emitOptimisticBalance } from '@/lib/wallet-sse';
import { trackPurchase } from '@/lib/track-purchase';
import DeepReadings, { BasicInfo } from './DeepReadings';
import VietnameseCenter from './VietnameseCenter';
import { toast } from '@/components/ui/toast';
import '@/styles/iztrolabe-overrides.css';

// react-iztro renders DOM directly + reads window; load client-side only.
const Iztrolabe = dynamic(
  () => import('react-iztro').then((m) => ({ default: m.Iztrolabe })),
  { ssr: false },
);

type IztroSnap = {
  birthday: string;
  birthTime: number;
  gender: 'male' | 'female';
  birthdayType: 'solar' | 'lunar';
};

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
  birthPlace: string;
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

export default function TuviClient() {
  const [form, setForm] = useState<FormState>({
    name: '',
    year: '',
    month: '',
    day: '',
    hour: 6,
    gender: 'nam',
    calendar: 'duong',
    birthPlace: '',
  });
  const router = useRouter();
  const { data: session } = useSession();
  const [chart, setChart] = useState<ChartData | null>(null);
  const [iztroSnap, setIztroSnap] = useState<IztroSnap | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisSections | null>(null);
  const [deep, setDeep] = useState<DeepReadingsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [insufficient, setInsufficient] = useState<{ balance: number; required: number } | null>(null);
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
      birthPlace: form.birthPlace.trim(),
    };
  };

  const fetchAnalysis = (chartId: string) => {
    setAiLoading(true);
    setAnalysis(null);
    setAiError(null);
    fetch(`/api/tuvi/${chartId}/analyze`, { method: 'POST' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data?.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
        setAnalysis(data.analysis as AnalysisSections);
        toast.success('Luận giải Tử Vi xong');
      })
      .catch((err: Error) => {
        setAiError(err.message);
        toast.error(`Lỗi luận Tử Vi: ${err.message}`);
      })
      .finally(() => setAiLoading(false));
  };

  const fetchDeep = (chartId: string) => {
    setDeepLoading(true);
    setDeep(null);
    setDeepError(null);
    fetch(`/api/tuvi/${chartId}/deep-readings`, { method: 'POST' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data?.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
        setDeep(data.deep as DeepReadingsData);
        toast.success('Luận đại hạn + 12 cung xong');
      })
      .catch((err: Error) => {
        setDeepError(err.message);
        toast.error(`Lỗi luận chi tiết: ${err.message}`);
      })
      .finally(() => setDeepLoading(false));
  };

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAiError(null);
    setDeepError(null);
    setInsufficient(null);

    if (!session?.user) {
      router.push('/dang-nhap?callbackUrl=/xem-tu-vi');
      return;
    }

    const info = buildBirthInfo();
    if (!info) return;

    const [bd, bm, by] = info.birthDate.split('/').map(Number);
    setIztroSnap({
      birthday: `${by}-${pad2(bm)}-${pad2(bd)}`,
      birthTime: info.timeIndex,
      gender: info.gender,
      birthdayType: 'solar',
    });

    setLoading(true);
    setChart(null);
    setAnalysis(null);
    setDeep(null);

    // Optimistic: drop balance trong header trước khi fetch hoàn thành.
    const PRICE = 5000;
    const currentBalance = session?.user?.balanceVnd ?? 0;
    emitOptimisticBalance({
      balanceVnd: Math.max(0, currentBalance - PRICE),
      delta: -PRICE,
      reason: 'charge',
      service: 'tu-vi',
    });

    try {
      const res = await fetch(`/api/tuvi/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info),
      });
      const data = await res.json();
      if (res.status === 402 && data?.code === 'INSUFFICIENT_BALANCE') {
        emitOptimisticBalance({ balanceVnd: Number(data.balanceVnd ?? 0), delta: 0, reason: 'charge', service: 'tu-vi' });
        setInsufficient({
          balance: Number(data.balanceVnd ?? 0),
          required: Number(data.requiredVnd ?? 5000),
        });
        setIztroSnap(null);
        toast.error('Số dư không đủ — nạp thêm để lập lá số');
        return;
      }
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      setChart(data.chart as ChartData);
      if (typeof data.balanceVnd === 'number') {
        emitOptimisticBalance({ balanceVnd: data.balanceVnd, delta: -(data.chargedVnd ?? PRICE), reason: 'charge', service: 'tu-vi' });
      }
      trackPurchase('tu-vi', data.chartId as string);
      toast.success(
        typeof data.chargedVnd === 'number'
          ? `Đã lập lá số — trừ ${formatVnd(data.chargedVnd)}, còn lại ${formatVnd(data.balanceVnd ?? 0)}`
          : 'Đã lập lá số Tử Vi — đang chờ hệ thống luận giải',
      );
      fetchAnalysis(data.chartId as string);
      fetchDeep(data.chartId as string);
    } catch (err) {
      const msg = (err as Error).message;
      setError(`Không lập được lá số: ${msg}`);
      toast.error(`Lập lá số thất bại: ${msg}`);
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
              <FieldLabel icon="📍">Nơi sinh (không bắt buộc)</FieldLabel>
              <input
                value={form.birthPlace}
                onChange={(e) => setForm({ ...form, birthPlace: e.target.value })}
                placeholder="VD: TP. Hồ Chí Minh"
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

            {insufficient && (
              <div className="rounded-xl border border-[#c89146]/55 bg-[#f5e3c0]/50 px-4 py-3 text-[#5a3a1a] text-[13.5px] space-y-2">
                <div>
                  ⚠ <strong>Số dư không đủ.</strong> Cần{' '}
                  <strong>{formatVnd(insufficient.required)}</strong> cho 1 lần lập lá số,
                  bạn còn <strong>{formatVnd(insufficient.balance)}</strong>.
                </div>
                <Link
                  href="/vi-cua-toi"
                  className="inline-block px-4 py-1.5 rounded-full bg-[#5a3a1a] text-[#fbf3e2] text-[12.5px] font-semibold hover:bg-[#4a6c7a]"
                >
                  Nạp tiền vào ví →
                </Link>
              </div>
            )}

            <div className="rounded-xl border border-[#c89146]/55 bg-gradient-to-br from-[#f5e3c0]/40 to-[#fbf3e2]/60 px-4 py-3 text-[12.5px] text-[#4a3a30]">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <span className="text-[10px] tracking-[0.25em] uppercase font-bold">
                    Phí dịch vụ
                  </span>
                  <div className="text-[#0f0a08]">
                    Trừ <strong>{formatVnd(5_000)}</strong> mỗi lần lập lá số. Tối thiểu nạp{' '}
                    {formatVnd(20_000)}.
                  </div>
                </div>
                <div
                  className="text-2xl font-serif italic text-[#5a3a1a]"
                  style={{ fontFamily: SERIF_FONT }}
                >
                  {formatVnd(5_000)}/lần
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-full bg-gradient-to-r from-[#5a3a1a] via-[#7a4a1f] to-[#c89146] text-[#fbf3e2] font-semibold tracking-wide hover:from-[#4a6c7a] hover:via-[#8a5520] hover:to-[#d4a05a] transition shadow-[0_10px_30px_-10px_rgba(90,58,26,0.6)] flex items-center justify-center gap-2.5 text-[15px] disabled:opacity-60 disabled:cursor-wait"
            >
              <span className="text-lg">✦</span>
              <span>
                {loading
                  ? 'Đang lập lá số…'
                  : session?.user
                    ? 'Lập Lá Số Tử Vi'
                    : 'Đăng nhập để lập lá số'}
              </span>
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
            <div className="mb-6">
              <BasicInfo chart={chart} form={form} />
            </div>

            {iztroSnap && (
              <div className="rounded-2xl border border-[#4a6c7a]/55 bg-[#fbf3e2]/94 p-3 md:p-5 shadow-[0_30px_80px_-30px_rgba(90,58,26,0.3)] overflow-x-auto">
                <div className="min-w-[860px] relative">
                  <Iztrolabe
                    birthday={iztroSnap.birthday}
                    birthTime={iztroSnap.birthTime}
                    gender={iztroSnap.gender}
                    birthdayType={iztroSnap.birthdayType}
                    lang="vi-VN"
                    width="100%"
                    centerPalaceAlign
                  />
                  <VietnameseCenter chart={chart} />
                </div>
              </div>
            )}

            <DeepReadings
              chart={chart}
              form={form}
              deep={deep}
              deepLoading={deepLoading}
              deepError={deepError}
              analysis={analysis}
              analysisLoading={aiLoading}
              analysisError={aiError}
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
