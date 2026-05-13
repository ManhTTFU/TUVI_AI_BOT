'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ZodiacDetail } from '@/lib/zodiac-detail';
import { HOROSCOPE } from '@/lib/home-data';
import { useDailyHoroscope } from '@/lib/use-daily-horoscope';

const SERIF_FONT = "'Cormorant Garamond',serif";

// Tone theo nguyên tố — cùng map với HoangDaoClient
const ELEMENT_TONE: Record<string, { ring: string; chip: string; bg: string }> = {
  Lửa: {
    ring: 'from-[#e9b48a] to-[#c8361d]',
    chip: 'text-[#c8361d] border-[#c8361d]/40 bg-[#c8361d]/8',
    bg: 'rgba(200,54,29,0.06)',
  },
  Đất: {
    ring: 'from-[#e9d4b6] to-[#c89146]',
    chip: 'text-[#5a3a1a] border-[#c89146]/45 bg-[#c89146]/10',
    bg: 'rgba(200,145,70,0.08)',
  },
  Khí: {
    ring: 'from-[#c9d8df] to-[#4a6c7a]',
    chip: 'text-[#4a6c7a] border-[#4a6c7a]/40 bg-[#4a6c7a]/8',
    bg: 'rgba(74,108,122,0.06)',
  },
  Nước: {
    ring: 'from-[#b8c4d0] to-[#2a3a4a]',
    chip: 'text-[#2a3a4a] border-[#2a3a4a]/40 bg-[#2a3a4a]/8',
    bg: 'rgba(42,58,74,0.06)',
  },
};

function Breadcrumb({ current }: { current: string }) {
  return (
    <nav
      aria-label="Đường dẫn"
      className="text-[12px] text-[#4a3a30] flex items-center gap-2 flex-wrap"
    >
      <Link href="/" className="hover:text-[#5a3a1a] transition">
        Trang chủ
      </Link>
      <span className="text-[#c89146]">›</span>
      <Link href="/hoang-dao" className="hover:text-[#5a3a1a] transition">
        12 Cung Hoàng Đạo
      </Link>
      <span className="text-[#c89146]">›</span>
      <span className="text-[#5a3a1a] font-medium">{current}</span>
    </nav>
  );
}

function HeroCard({ detail }: { detail: ZodiacDetail }) {
  const tone = ELEMENT_TONE[detail.el] ?? ELEMENT_TONE.Đất;
  return (
    <header
      className="relative rounded-3xl border border-[#c89146]/55 bg-[#fbf3e2]/95 backdrop-blur-sm shadow-[0_24px_60px_-30px_rgba(90,58,26,0.35)] overflow-hidden"
      style={{ backgroundImage: `radial-gradient(circle at 50% 0%, ${tone.bg}, transparent 60%)` }}
    >
      <div className="px-6 md:px-10 py-12 text-center">
        <div
          className={`mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br ${tone.ring} border border-[#c89146]/60 flex items-center justify-center text-[#fbf3e2] text-4xl shadow-inner`}
        >
          {detail.sym}
        </div>
        <h1
          className="mt-6 font-serif text-[#0f0a08] text-[clamp(44px,6vw,76px)] leading-[1]"
          style={{ fontFamily: SERIF_FONT }}
        >
          {detail.name}
        </h1>
        <div className="mt-2 text-[14px] tracking-[0.3em] uppercase text-[#4a3a30]">
          {detail.en}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <span className="px-3.5 py-1.5 rounded-full border border-[#c89146]/55 bg-[#fbf3e2] text-[12px] text-[#5a3a1a] font-medium">
            {detail.range}
          </span>
          <span
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold tracking-[0.2em] uppercase border ${tone.chip}`}
          >
            {detail.el}
          </span>
          <span className="px-3.5 py-1.5 rounded-full border border-[#4a6c7a]/40 bg-[#4a6c7a]/8 text-[12px] text-[#4a6c7a] font-medium">
            {detail.quality}
          </span>
          <span className="px-3.5 py-1.5 rounded-full border border-[#c89146]/55 bg-[#c89146]/10 text-[12px] text-[#5a3a1a] font-medium">
            Sao chiếu · {detail.ruler}
          </span>
        </div>
      </div>
    </header>
  );
}

function TodayLine({ name }: { name: string }) {
  const [today, setToday] = useState('');
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    );
  }, []);
  const horoscope = HOROSCOPE.find((h) => h.name === name);
  const daily = useDailyHoroscope();
  if (!horoscope) return null;
  const reading = daily?.readings[horoscope.en];
  return (
    <div className="rounded-2xl border border-[#c89146]/45 bg-[#fbf3e2]/85 p-6 md:p-8">
      <div className="flex items-center gap-2 text-[11px] tracking-[0.3em] uppercase text-[#4a6c7a] font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-[#c89146]" />
        Hôm nay <span suppressHydrationWarning>· {today}</span>
      </div>
      {reading ? (
        <p className="mt-3 text-[15px] md:text-[16px] text-[#0f0a08] leading-relaxed">
          {reading}
        </p>
      ) : (
        <div className="mt-3 inline-flex items-center gap-2 text-[14px] text-[#4a6c7a] italic">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c89146] animate-pulse" />
          Hệ thống đang luận giải vận trình hôm nay…
        </div>
      )}
    </div>
  );
}

function OverviewBlock({ detail }: { detail: ZodiacDetail }) {
  return (
    <section className="rounded-2xl bg-[#fbf3e2]/85 border border-[#c89146]/45 p-6 md:p-10">
      <div className="text-[11px] tracking-[0.4em] uppercase text-[#4a6c7a] font-semibold">
        Tổng quan
      </div>
      <h2
        className="mt-2 text-3xl md:text-4xl font-serif text-[#0f0a08]"
        style={{ fontFamily: SERIF_FONT }}
      >
        Tính cách <em className="text-[#5a3a1a]">{detail.name}</em>
      </h2>
      <p className="mt-5 text-[15px] md:text-[16px] text-[#0f0a08] leading-[1.85] text-justify">
        {detail.overview}
      </p>
    </section>
  );
}

function TraitsGrid({ detail }: { detail: ZodiacDetail }) {
  return (
    <section className="grid md:grid-cols-2 gap-5">
      <div className="rounded-2xl bg-[#fbf3e2]/85 border border-[#c89146]/45 p-6">
        <div className="flex items-center gap-2 text-[11px] tracking-[0.3em] uppercase text-[#4a6c7a] font-semibold">
          <span className="text-[#c89146]">✦</span> Điểm mạnh
        </div>
        <ul className="mt-4 flex flex-wrap gap-2">
          {detail.strengths.map((s) => (
            <li
              key={s}
              className="px-3 py-1.5 rounded-full bg-[#c89146]/12 border border-[#c89146]/45 text-[13px] text-[#5a3a1a] font-medium"
            >
              {s}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl bg-[#fbf3e2]/85 border border-[#c8361d]/40 p-6">
        <div className="flex items-center gap-2 text-[11px] tracking-[0.3em] uppercase text-[#c8361d] font-semibold">
          <span>⚠</span> Điểm yếu
        </div>
        <ul className="mt-4 flex flex-wrap gap-2">
          {detail.weaknesses.map((w) => (
            <li
              key={w}
              className="px-3 py-1.5 rounded-full bg-[#c8361d]/10 border border-[#c8361d]/40 text-[13px] text-[#c8361d] font-medium"
            >
              {w}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function MetaGrid({ detail }: { detail: ZodiacDetail }) {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Sao chiếu mệnh', value: detail.ruler },
    { label: 'Nguyên tố', value: detail.el },
    { label: 'Phân loại', value: detail.quality },
    { label: 'Màu may mắn', value: detail.luckyColor },
    { label: 'Số may mắn', value: detail.luckyNumber },
    { label: 'Cung hợp nhất', value: detail.compatible.join(', ') },
  ];
  return (
    <section className="rounded-2xl bg-[#fbf3e2]/85 border border-[#c89146]/45 p-6 md:p-8">
      <div className="text-[11px] tracking-[0.3em] uppercase text-[#4a6c7a] font-semibold">
        Thông tin cung
      </div>
      <dl className="mt-5 grid sm:grid-cols-2 gap-x-8 gap-y-3">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-baseline justify-between gap-4 border-b border-[#c89146]/25 py-2"
          >
            <dt className="text-[13px] text-[#4a3a30]">{r.label}</dt>
            <dd className="text-[14px] text-[#0f0a08] font-medium text-right">
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function NavButtons({
  neighbors,
}: {
  neighbors: { prev: ZodiacDetail; next: ZodiacDetail };
}) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-3 pt-4">
      <Link
        href={`/hoang-dao/${neighbors.prev.slug}`}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#c89146]/55 bg-[#fbf3e2] text-[#5a3a1a] hover:border-[#4a6c7a]/60 hover:text-[#4a6c7a] text-sm font-medium transition"
      >
        <span aria-hidden>←</span>
        <span className="hidden sm:inline">Trang trước ·</span>{' '}
        {neighbors.prev.name}
      </Link>
      <Link
        href="/hoang-dao"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#5a3a1a] text-[#fbf3e2] hover:bg-[#4a6c7a] transition shadow-lg shadow-[#5a3a1a]/20 text-sm font-semibold"
      >
        ✦ Xem 12 Cung Hoàng Đạo
      </Link>
      <Link
        href={`/hoang-dao/${neighbors.next.slug}`}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#c89146]/55 bg-[#fbf3e2] text-[#5a3a1a] hover:border-[#4a6c7a]/60 hover:text-[#4a6c7a] text-sm font-medium transition"
      >
        {neighbors.next.name}{' '}
        <span className="hidden sm:inline">· Trang sau</span>
        <span aria-hidden>→</span>
      </Link>
    </section>
  );
}

function RelatedSection({ related }: { related: ZodiacDetail[] }) {
  const daily = useDailyHoroscope();
  const dailyReadings = daily?.readings ?? {};
  return (
    <section className="pt-2">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="text-[11px] tracking-[0.4em] uppercase text-[#4a6c7a] font-semibold">
            Luận giải hôm nay
          </div>
          <h2
            className="mt-2 text-2xl md:text-3xl font-serif text-[#0f0a08]"
            style={{ fontFamily: SERIF_FONT }}
          >
            Các cung <em className="text-[#5a3a1a]">hợp nhất</em>
          </h2>
        </div>
        <Link
          href="/hoang-dao"
          className="text-[#4a6c7a] hover:text-[#5a3a1a] text-sm transition"
        >
          Xem tất cả →
        </Link>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {related.map((r) => {
          const tone = ELEMENT_TONE[r.el] ?? ELEMENT_TONE.Đất;
          const horoscope = HOROSCOPE.find((h) => h.name === r.name);
          return (
            <Link
              key={r.slug}
              href={`/hoang-dao/${r.slug}`}
              className="group rounded-2xl border border-[#c89146]/55 bg-[#fbf3e2]/94 p-5 hover:border-[#4a6c7a]/60 hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tone.ring} border border-[#c89146]/55 flex items-center justify-center text-[#fbf3e2] text-xl shadow-inner`}
                >
                  {r.sym}
                </div>
                <div>
                  <div
                    className="text-lg font-serif text-[#5a3a1a]"
                    style={{ fontFamily: SERIF_FONT }}
                  >
                    {r.name}
                  </div>
                  <div className="text-[10px] tracking-[0.18em] uppercase text-[#4a3a30]">
                    {r.en} · {r.range}
                  </div>
                </div>
              </div>
              {horoscope && dailyReadings[horoscope.en] && (
                <p className="text-[13px] text-[#0f0a08] leading-relaxed line-clamp-3">
                  {dailyReadings[horoscope.en]}
                </p>
              )}
              <div className="mt-4 text-[12px] text-[#4a6c7a] group-hover:text-[#5a3a1a] font-medium">
                Xem chi tiết →
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function HoangDaoDetail({
  detail,
  neighbors,
  related,
}: {
  detail: ZodiacDetail;
  neighbors: { prev: ZodiacDetail; next: ZodiacDetail };
  related: ZodiacDetail[];
}) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10 md:py-14">
      <Breadcrumb current={detail.name} />
      <div className="mt-6 space-y-6 md:space-y-8">
        <HeroCard detail={detail} />
        <TodayLine name={detail.name} />
        <OverviewBlock detail={detail} />
        <TraitsGrid detail={detail} />
        <MetaGrid detail={detail} />
        <NavButtons neighbors={neighbors} />
        <RelatedSection related={related} />
      </div>
    </div>
  );
}
