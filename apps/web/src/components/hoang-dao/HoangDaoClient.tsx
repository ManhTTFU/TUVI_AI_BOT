'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { HOROSCOPE } from '@/lib/home-data';
import { ZODIAC_DETAILS } from '@/lib/zodiac-detail';
import { getSignFromDate, getSignToday } from '@/lib/horoscope-lib';
import { useDailyHoroscope } from '@/lib/use-daily-horoscope';
import { isProActive } from '@/lib/tier';

const SLUG_BY_NAME: Record<string, string> = Object.fromEntries(
  ZODIAC_DETAILS.map((z) => [z.name, z.slug])
);

const SERIF_FONT = "'Cormorant Garamond',serif";

// 4 nguyên tố — palette nằm trong brand: chu sa (Lửa), vàng đồng (Đất), xanh núi (Khí), mực tàu (Nước).
// Không dùng tím/indigo.
const ELEMENT_TONE: Record<string, { ring: string; chip: string; glow: string }> = {
  Lửa: {
    ring: 'from-[#e9b48a] to-[#c8361d]',
    chip: 'text-[#c8361d] border-[#c8361d]/40 bg-[#c8361d]/8',
    glow: 'shadow-[0_0_24px_-8px_rgba(200,54,29,0.45)]',
  },
  Đất: {
    ring: 'from-[#e9d4b6] to-[#c89146]',
    chip: 'text-[#5a3a1a] border-[#c89146]/45 bg-[#c89146]/10',
    glow: 'shadow-[0_0_24px_-8px_rgba(200,145,70,0.45)]',
  },
  Khí: {
    ring: 'from-[#c9d8df] to-[#4a6c7a]',
    chip: 'text-[#4a6c7a] border-[#4a6c7a]/40 bg-[#4a6c7a]/8',
    glow: 'shadow-[0_0_24px_-8px_rgba(74,108,122,0.45)]',
  },
  Nước: {
    ring: 'from-[#b8c4d0] to-[#2a3a4a]',
    chip: 'text-[#2a3a4a] border-[#2a3a4a]/40 bg-[#2a3a4a]/8',
    glow: 'shadow-[0_0_24px_-8px_rgba(42,58,74,0.45)]',
  },
};

function Hero() {
  const [todayLabel, setTodayLabel] = useState('');
  const [todaySignEn, setTodaySignEn] = useState<string | null>(null);
  useEffect(() => {
    const now = new Date();
    setTodayLabel(
      now.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    );
    setTodaySignEn(getSignToday(now)?.en ?? null);
  }, []);

  const todaySign = todaySignEn
    ? HOROSCOPE.find((h) => h.en === todaySignEn)
    : null;

  return (
    <section className="relative overflow-hidden">
      {/* brand dark gradient: mực tàu → bronze → đồng cổ (warm sumi), gold accents */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f0a08] via-[#2a1c14] to-[#5a3a1a]" />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 25%, #c89146 0px, transparent 1.5px), radial-gradient(circle at 70% 60%, #e9d4b6 0px, transparent 1.2px), radial-gradient(circle at 40% 80%, #c89146 0px, transparent 1.4px), radial-gradient(circle at 88% 20%, #e9d4b6 0px, transparent 1.2px)',
          backgroundSize: '180px 180px, 240px 240px, 200px 200px, 260px 260px',
        }}
      />
      <div className="relative max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-3 text-[11px] tracking-[0.4em] uppercase text-[#c89146]">
          <span className="w-8 h-px bg-[#c89146]/60" />
          十 二 星 座 · Tinh Tọa
          <span className="w-8 h-px bg-[#c89146]/60" />
        </div>
        <h1
          className="mt-5 font-serif text-[#fbf3e2] leading-[0.95] text-[clamp(48px,7.5vw,96px)]"
          style={{ fontFamily: SERIF_FONT }}
        >
          12 Cung <em className="text-[#c89146]">Hoàng Đạo</em>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-[#e9d4b6] text-base md:text-lg leading-relaxed">
          Mỗi cung mang một nguyên tố — Lửa, Đất, Khí, Nước — định hình tính
          cách, vận trình, tình duyên và sự nghiệp. Khám phá năng lượng dẫn dắt
          ngày hôm nay.
        </p>
        {todayLabel && (
          <div
            className="mt-8 inline-flex flex-wrap items-center justify-center gap-4 px-5 py-2.5 rounded-full border border-[#c89146]/40 bg-[#0f0a08]/40 text-[12px] text-[#e9d4b6] backdrop-blur-sm"
            suppressHydrationWarning
          >
            <span className="text-[#c89146] font-semibold tracking-wide uppercase text-[10px]">
              Hôm nay
            </span>
            <span className="w-px h-3.5 bg-[#c89146]/40" />
            <span>{todayLabel}</span>
            {todaySign && (
              <>
                <span className="w-px h-3.5 bg-[#c89146]/40" />
                <span>
                  Mặt Trời chiếu cung{' '}
                  <strong className="text-[#fbf3e2]">
                    {todaySign.name} {todaySign.sym}
                  </strong>
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function ZodiacCard({
  h,
  highlight,
  dailyText,
  loading,
}: {
  h: (typeof HOROSCOPE)[number];
  highlight?: boolean;
  dailyText?: string;
  loading?: boolean;
}) {
  const tone = ELEMENT_TONE[h.el] ?? ELEMENT_TONE.Đất;
  const slug = SLUG_BY_NAME[h.name];
  return (
    <Link
      href={slug ? `/hoang-dao/${slug}` : '/hoang-dao'}
      data-sign-en={h.en}
      className={`group relative rounded-2xl border backdrop-blur-sm p-6 hover:-translate-y-0.5 transition-all duration-300 ${
        highlight
          ? 'border-[#5a3a1a] bg-gradient-to-br from-[#f5e3c0] to-[#e9d4b6] shadow-[0_18px_45px_-15px_rgba(90,58,26,0.55)] ring-2 ring-[#c89146]/60'
          : `border-[#c89146]/55 bg-[#fbf3e2]/94 hover:border-[#4a6c7a]/60 ${tone.glow}`
      }`}
    >
      {highlight && (
        <span className="absolute -top-2 left-4 px-2.5 py-0.5 rounded-full text-[10px] tracking-[0.2em] uppercase font-bold text-[#fbf3e2] bg-[#c8361d] shadow-md">
          Cung của bạn
        </span>
      )}
      <header className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tone.ring} border border-[#c89146]/60 flex items-center justify-center text-[#fbf3e2] text-2xl shadow-inner`}
          >
            {h.sym}
          </div>
          <div>
            <h3
              className="text-xl font-serif text-[#5a3a1a] leading-tight"
              style={{ fontFamily: SERIF_FONT }}
            >
              {h.name}
            </h3>
            <div className="text-[10px] tracking-[0.18em] uppercase text-[#4a3a30] mt-0.5">
              {h.en} · {h.range}
            </div>
          </div>
        </div>
        <span
          className={`shrink-0 text-[10px] tracking-[0.25em] uppercase font-semibold px-2.5 py-1 rounded-full border ${tone.chip}`}
        >
          {h.el}
        </span>
      </header>
      {dailyText ? (
        <p className="text-[14px] text-[#0f0a08] leading-relaxed">{dailyText}</p>
      ) : (
        <div className="inline-flex items-center gap-2 text-[13px] text-[#4a6c7a] italic">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c89146] animate-pulse" />
          {loading ? 'Hệ thống đang luận giải vận trình hôm nay…' : 'Chưa có luận giải hôm nay'}
        </div>
      )}
    </Link>
  );
}

function Grid({ userSignEn }: { userSignEn: string | null }) {
  const daily = useDailyHoroscope();

  return (
    <section className="relative py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="text-[11px] tracking-[0.4em] text-[#4a6c7a] font-semibold uppercase">
              黃 道 · Hoàng Đạo
            </div>
            <h2
              className="mt-3 text-4xl md:text-5xl font-serif text-[#0f0a08]"
              style={{ fontFamily: SERIF_FONT }}
            >
              12 cung <em className="text-[#4a6c7a]">hoàng đạo</em>
            </h2>
            <p className="mt-2 text-[#4a3a30] max-w-2xl">
              Luận giải vận trình hôm nay cho từng cung — tình duyên, sự nghiệp,
              tài lộc. Cập nhật mỗi ngày.
            </p>
          </div>
          <div className="text-[12px] text-[#4a3a30] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c89146]" />
            <span>{HOROSCOPE.length} cung</span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {HOROSCOPE.map((h) => (
            <ZodiacCard
              key={h.name}
              h={h}
              highlight={userSignEn === h.en}
              dailyText={daily?.readings[h.en]}
              loading={!daily}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FORM section — luận giải cá nhân theo ngày sinh + bối cảnh
// ─────────────────────────────────────────────────────────────────────────────

type Gender = 'male' | 'female';
type Status = 'single' | 'dating' | 'married' | 'divorced';
type Goal = 'career' | 'love' | 'wealth' | 'health' | 'study' | 'family';

interface FormState {
  day: string;
  month: string;
  year: string;
  gender: Gender;
  status: Status;
  goal: Goal;
}

const STATUS_OPTIONS: { value: Status; label: string; icon: string }[] = [
  { value: 'single', label: 'Độc thân', icon: '✦' },
  { value: 'dating', label: 'Đang yêu', icon: '♡' },
  { value: 'married', label: 'Đã kết hôn', icon: '⚭' },
  { value: 'divorced', label: 'Ly hôn / Goá', icon: '◐' },
];

const GOAL_OPTIONS: { value: Goal; label: string; icon: string }[] = [
  { value: 'career', label: 'Sự nghiệp', icon: '⚔' },
  { value: 'love', label: 'Tình cảm', icon: '♥' },
  { value: 'wealth', label: 'Tài chính', icon: '◈' },
  { value: 'health', label: 'Sức khỏe', icon: '☯' },
  { value: 'study', label: 'Học hành', icon: '✎' },
  { value: 'family', label: 'Gia đình', icon: '⌂' },
];

function FieldLabel({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2 text-[#0f0a08]">
      <span className="text-[#4a6c7a] text-[14px]">{icon}</span>
      <span className="text-[13.5px] font-medium">{children}</span>
    </div>
  );
}

function SegmentChoice<T extends string>({
  value,
  onChange,
  options,
  cols = 2,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon: string }[];
  cols?: 2 | 3;
}) {
  const gridCls = cols === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2';
  return (
    <div className={`grid ${gridCls} gap-2.5`}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`h-[64px] rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-0.5 ${
              active
                ? 'border-[#4a6c7a] bg-gradient-to-br from-[#f5e3c0] to-[#e9c98a]'
                : 'border-[#4a6c7a]/30 bg-[#fbf3e2]/85 hover:border-[#4a6c7a]/55'
            }`}
          >
            <div className={`text-xl leading-none ${active ? 'text-[#5a3a1a]' : 'text-[#4a6c7a]'}`}>
              {o.icon}
            </div>
            <div className="text-[13px] font-semibold text-[#0f0a08]">{o.label}</div>
          </button>
        );
      })}
    </div>
  );
}

function HoroscopeForm({ onSignChange }: { onSignChange: (signEn: string | null) => void }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [form, setForm] = useState<FormState>({
    day: '',
    month: '',
    year: '',
    gender: 'male',
    status: 'single',
    goal: 'career',
  });
  const [error, setError] = useState<string | null>(null);
  const [proRequired, setProRequired] = useState(false);

  const isPro = isProActive(session?.user?.proUntil);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProRequired(false);
    const d = +form.day,
      m = +form.month,
      y = +form.year;
    if (!d || !m || !y) {
      setError('Vui lòng nhập đầy đủ Ngày / Tháng / Năm sinh.');
      return;
    }
    if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > new Date().getFullYear()) {
      setError('Ngày sinh không hợp lệ.');
      return;
    }
    const sign = getSignFromDate(m, d);
    if (!sign) {
      setError('Không xác định được cung — kiểm tra lại ngày / tháng.');
      return;
    }
    onSignChange(sign.en);

    // Chưa đăng nhập → redirect login.
    if (!session?.user) {
      router.push(`/dang-nhap?callbackUrl=${encodeURIComponent('/hoang-dao')}`);
      return;
    }
    // Đăng nhập nhưng chưa PRO → show banner.
    if (!isPro) {
      setProRequired(true);
      return;
    }
    // PRO → route sang trang chi tiết.
    const qs = new URLSearchParams({
      sign: sign.en,
      gender: form.gender,
      status: form.status,
      goal: form.goal,
    }).toString();
    router.push(`/hoang-dao/luan-giai?${qs}`);
  };

  return (
    <section id="hoang-dao-form" className="relative px-6 pt-16 md:pt-20 pb-12">
      <div className="max-w-2xl mx-auto rounded-3xl border border-[#4a6c7a]/45 bg-[#fbf3e2]/95 p-6 md:p-9 shadow-[0_30px_80px_-30px_rgba(90,58,26,0.3)]">
        <div className="text-center mb-6">
          <div className="text-[11px] tracking-[0.35em] uppercase text-[#4a6c7a] font-semibold">
            Luận giải cá nhân
          </div>
          <h2
            className="mt-2 text-3xl font-serif text-[#0f0a08]"
            style={{ fontFamily: SERIF_FONT }}
          >
            Cung Hoàng Đạo <em className="text-[#5a3a1a]">của bạn</em>
          </h2>
          <p className="mt-2 text-[13px] text-[#4a3a30]">
            Nhập thông tin để hệ thống luận giải bám sát cung + bối cảnh hiện
            tại của bạn — miễn phí.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <FieldLabel icon="📅">Ngày / Tháng / Năm sinh (dương lịch)</FieldLabel>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="number"
                min="1"
                max="31"
                value={form.day}
                onChange={(e) => setForm({ ...form, day: e.target.value })}
                placeholder="Ngày"
                className="h-11 px-3 rounded-xl border border-[#4a6c7a]/35 bg-[#fbf3e2] text-[#0f0a08] text-center placeholder:text-[#7a6a52] focus:outline-none focus:border-[#4a6c7a] focus:ring-2 focus:ring-[#4a6c7a]/15 transition"
              />
              <input
                type="number"
                min="1"
                max="12"
                value={form.month}
                onChange={(e) => setForm({ ...form, month: e.target.value })}
                placeholder="Tháng"
                className="h-11 px-3 rounded-xl border border-[#4a6c7a]/35 bg-[#fbf3e2] text-[#0f0a08] text-center placeholder:text-[#7a6a52] focus:outline-none focus:border-[#4a6c7a] focus:ring-2 focus:ring-[#4a6c7a]/15 transition"
              />
              <input
                type="number"
                min="1900"
                max="2100"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                placeholder="Năm"
                className="h-11 px-3 rounded-xl border-2 border-[#4a6c7a]/55 bg-[#fbf3e2] text-[#0f0a08] text-center placeholder:text-[#7a6a52] focus:outline-none focus:border-[#4a6c7a] focus:ring-2 focus:ring-[#4a6c7a]/15 transition"
              />
            </div>
          </div>

          <div>
            <FieldLabel icon="⚥">Giới tính</FieldLabel>
            <SegmentChoice<Gender>
              value={form.gender}
              onChange={(v) => setForm({ ...form, gender: v })}
              options={[
                { value: 'male', label: 'Nam', icon: '♂' },
                { value: 'female', label: 'Nữ', icon: '♀' },
              ]}
            />
          </div>

          <div>
            <FieldLabel icon="♡">Trạng thái tình cảm</FieldLabel>
            <SegmentChoice<Status>
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              options={STATUS_OPTIONS}
            />
          </div>

          <div>
            <FieldLabel icon="✦">Mục tiêu quan tâm hiện tại</FieldLabel>
            <SegmentChoice<Goal>
              value={form.goal}
              onChange={(v) => setForm({ ...form, goal: v })}
              options={GOAL_OPTIONS}
              cols={3}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-[#c8361d]/40 bg-[#c8361d]/10 px-4 py-3 text-[#c8361d] text-[13px]">
              ⚠ {error}
            </div>
          )}

          {proRequired && (
            <div className="rounded-xl border border-[#c89146]/55 bg-[#f5e3c0]/50 px-4 py-3 text-[#5a3a1a] text-[13px] space-y-2">
              <div>
                ⚠ <strong>Cần tài khoản PRO.</strong> Đăng ký gói (từ
                20.000đ/tháng) để xem luận giải cá nhân hóa.
              </div>
              <Link
                href="/vi-cua-toi"
                className="inline-block px-4 py-1.5 rounded-full bg-[#5a3a1a] text-[#fbf3e2] text-[12px] font-semibold hover:bg-[#4a6c7a]"
              >
                Đăng ký gói PRO →
              </Link>
            </div>
          )}

          <div className="rounded-xl border border-[#c89146]/55 bg-gradient-to-br from-[#f5e3c0]/40 to-[#fbf3e2]/60 px-4 py-3 text-[12.5px] text-[#4a3a30]">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <span className="text-[10px] tracking-[0.25em] uppercase font-bold">
                  Cần gói PRO
                </span>
                <div className="text-[#0f0a08]">
                  Đăng ký 1 lần, luận giải cá nhân không giới hạn trong thời hạn gói
                </div>
              </div>
              <div
                className="text-2xl font-serif italic text-[#5a3a1a]"
                style={{ fontFamily: SERIF_FONT }}
              >
                từ 20.000đ/tháng
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-14 rounded-full bg-gradient-to-r from-[#5a3a1a] via-[#7a4a1f] to-[#c89146] text-[#fbf3e2] font-semibold tracking-wide hover:from-[#4a6c7a] hover:via-[#8a5520] hover:to-[#d4a05a] transition shadow-[0_10px_30px_-10px_rgba(90,58,26,0.6)] flex items-center justify-center gap-2.5 text-[15px]"
          >
            <span className="text-lg">✦</span>
            <span>
              {!session?.user
                ? 'Đăng nhập để xem luận giải'
                : isPro
                  ? 'Xem luận giải cá nhân'
                  : 'Xem luận giải cá nhân (cần PRO)'}
            </span>
          </button>
        </form>
      </div>
    </section>
  );
}

export default function HoangDaoClient() {
  const [userSignEn, setUserSignEn] = useState<string | null>(null);

  return (
    <>
      <Hero />
      <HoroscopeForm onSignChange={setUserSignEn} />
      <Grid userSignEn={userSignEn} />
    </>
  );
}
