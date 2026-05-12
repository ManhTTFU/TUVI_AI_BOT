'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { HOROSCOPE } from '@/lib/home-data';
import { ZODIAC_DETAILS } from '@/lib/zodiac-detail';

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
  useEffect(() => {
    setTodayLabel(
      new Date().toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    );
  }, []);
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
          <div className="mt-8 inline-flex items-center gap-4 px-5 py-2.5 rounded-full border border-[#c89146]/40 bg-[#0f0a08]/40 text-[12px] text-[#e9d4b6] backdrop-blur-sm">
            <span className="text-[#c89146] font-semibold tracking-wide uppercase text-[10px]">
              Hôm nay
            </span>
            <span className="w-px h-3.5 bg-[#c89146]/40" />
            <span suppressHydrationWarning>{todayLabel}</span>
          </div>
        )}
      </div>
    </section>
  );
}

function ZodiacCard({ h }: { h: (typeof HOROSCOPE)[number] }) {
  const tone = ELEMENT_TONE[h.el] ?? ELEMENT_TONE.Đất;
  const slug = SLUG_BY_NAME[h.name];
  return (
    <Link
      href={slug ? `/hoang-dao/${slug}` : '/hoang-dao'}
      className={`group relative rounded-2xl border border-[#c89146]/55 bg-[#fbf3e2]/94 backdrop-blur-sm p-6 hover:border-[#4a6c7a]/60 hover:-translate-y-0.5 transition-all duration-300 ${tone.glow}`}
    >
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
      <p className="text-[14px] text-[#0f0a08] leading-relaxed">{h.text}</p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-[#4a6c7a] group-hover:text-[#5a3a1a] text-sm font-medium transition">
        Xem chi tiết <span aria-hidden>→</span>
      </span>
    </Link>
  );
}

function Grid() {
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
            <ZodiacCard key={h.name} h={h} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HoangDaoClient() {
  return (
    <>
      <Hero />
      <Grid />
    </>
  );
}
