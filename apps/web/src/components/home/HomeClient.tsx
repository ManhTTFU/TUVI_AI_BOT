'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ARTICLES,
  HOROSCOPE,
  LUC_DIEU,
  LUC_DIEU_TONE,
  SERVICES,
  ZODIAC,
} from '@/lib/home-data';
import { getSignToday } from '@/lib/horoscope-lib';
import { useDailyHoroscope } from '@/lib/use-daily-horoscope';

const SERIF_FONT = "'Cormorant Garamond',serif";

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
  const lunar = 'Ngày Quý Mão · Tháng Đinh Tỵ · Năm Bính Ngọ';
  return (
    <section id="top" className="relative pt-16 pb-24 px-6">
      <div className="max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-3 text-[11px] tracking-[0.4em] uppercase text-[#4a6c7a]">
          <span className="w-8 h-px bg-[#4a6c7a]/60" />
          運 命 · Mệnh Lý
          <span className="w-8 h-px bg-[#4a6c7a]/60" />
        </div>
        <h1
          className="mt-6 font-serif text-[#0f0a08] leading-[0.95] text-[clamp(56px,9vw,128px)]"
          style={{ fontFamily: SERIF_FONT }}
        >
          Vận <em className="text-[#4a6c7a]">Mệnh</em>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-[#0f0a08] text-lg leading-relaxed">
          Nơi hội tụ tinh hoa của khoa Chiêm Tinh và Huyền Học Á Đông — giải mã{' '}
          <em>quá khứ, hiện tại, vị lai</em> qua từng lá bài, từng ngôi sao,
          từng quẻ Dịch.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#services"
            className="px-7 py-3 rounded-full bg-[#5a3a1a] text-[#fbf3e2] hover:bg-[#4a6c7a] transition shadow-lg shadow-[#5a3a1a]/20"
          >
            Khám phá Tử Vi
          </a>
          <a
            href="#services"
            className="px-7 py-3 rounded-full border border-[#5a3a1a]/40 text-[#5a3a1a] hover:bg-[#5a3a1a]/10 transition"
          >
            Khám phá dịch vụ
          </a>
        </div>
        <div className="mt-12 inline-flex items-center gap-6 px-6 py-3 rounded-full border border-[#c89146]/55 bg-[#fbf3e2]/85 text-[13px] text-[#0f0a08]">
          <span className="text-[#4a6c7a] font-semibold">Hôm nay</span>
          <span className="w-px h-4 bg-[#b58a4a]/50" />
          <span suppressHydrationWarning>{todayLabel}</span>
          <span className="w-px h-4 bg-[#b58a4a]/50 hidden sm:block" />
          <span className="hidden sm:inline italic text-[#0f0a08]">{lunar}</span>
        </div>
      </div>
    </section>
  );
}

function ServiceGrid() {
  return (
    <section id="services" className="relative py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-[11px] tracking-[0.4em] text-[#4a6c7a] font-semibold uppercase">
            百 術 · Bách Thuật
          </div>
          <h2
            className="mt-3 text-5xl font-serif text-[#0f0a08]"
            style={{ fontFamily: SERIF_FONT }}
          >
            Tám cánh cửa <em className="text-[#4a6c7a]">Huyền Học</em>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {SERVICES.map((s, i) => {
            const content = (
              <>
                <div
                  className="absolute right-3 top-3 text-[44px] leading-none font-serif text-[#5a3a1a]/15 group-hover:text-[#5a3a1a]/30 transition"
                  style={{ fontFamily: SERIF_FONT }}
                >
                  {s.glyph}
                </div>
                <div className="relative">
                  <div className="text-[10px] tracking-[0.3em] uppercase text-[#4a6c7a] font-semibold">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3
                    className="mt-3 text-2xl font-serif text-[#0f0a08] leading-tight"
                    style={{ fontFamily: SERIF_FONT }}
                  >
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm text-[#0f0a08] leading-relaxed min-h-[3rem]">
                    {s.sub}
                  </p>
                  {s.comingSoon ? (
                    <div className="mt-5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c89146]/15 border border-[#c89146]/40 text-[#7a5520] text-[11.5px] font-semibold tracking-wide">
                      <span>⚙</span> Hệ thống đang triển khai
                    </div>
                  ) : (
                    <div className="mt-5 inline-flex items-center gap-2 text-[#5a3a1a] text-sm group-hover:text-[#4a6c7a]">
                      Xem ngay{' '}
                      <span className="transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  )}
                </div>
              </>
            );
            const baseClass =
              'group relative rounded-2xl border border-[#c89146]/55 bg-[#fbf3e2]/92 backdrop-blur-sm p-6 transition-all duration-300 overflow-hidden';
            if (s.comingSoon || !s.href) {
              return (
                <div
                  key={s.key}
                  aria-disabled="true"
                  className={`${baseClass} opacity-80 cursor-not-allowed`}
                  title="Hệ thống đang triển khai"
                >
                  {content}
                </div>
              );
            }
            return (
              <Link
                key={s.key}
                href={s.href}
                className={`${baseClass} hover:border-[#4a6c7a]/60 hover:-translate-y-1`}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-[2px]">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={i < n ? 'text-[#c89146]' : 'text-[#c89146]/25'}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function ZodiacRing() {
  const [active, setActive] = useState(6); // Ngọ
  const z = ZODIAC[active];
  const cats = ['Tổng Quan', 'Tài Lộc', 'Tình Duyên', 'Sức Khỏe'];
  return (
    <section id="zodiac" className="relative py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-[11px] tracking-[0.4em] text-[#4a6c7a] font-semibold uppercase">
            十 二 生 肖 · Thập Nhị
          </div>
          <h2
            className="mt-3 text-5xl font-serif text-[#0f0a08]"
            style={{ fontFamily: SERIF_FONT }}
          >
            Vận hôm nay theo <em className="text-[#4a6c7a]">Con Giáp</em>
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {ZODIAC.map((g, i) => {
            const isActive = i === active;
            return (
              <button
                type="button"
                key={g.name}
                onClick={() => setActive(i)}
                className={`group relative rounded-2xl border transition-all duration-300 px-4 py-5 ${
                  isActive
                    ? 'bg-gradient-to-br from-[#fbf3e2] to-[#f0d9b5] border-[#4a6c7a] shadow-[0_0_0_1px_#4a6c7a,0_8px_24px_-8px_rgba(90,58,26,0.4)]'
                    : 'bg-[#fbf3e2]/92 border-[#c89146]/50 hover:border-[#4a6c7a]/60 hover:bg-[#fbf3e2]/90'
                }`}
              >
                <div
                  className={`text-4xl sm:text-5xl leading-none text-center transition-transform ${
                    isActive ? 'scale-110' : 'group-hover:scale-105'
                  }`}
                  style={{
                    filter: isActive
                      ? 'drop-shadow(0 2px 4px rgba(90,58,26,0.35))'
                      : 'none',
                  }}
                >
                  {g.glyph}
                </div>
                <div
                  className={`mt-2 text-center text-[13px] tracking-[0.3em] uppercase font-semibold ${
                    isActive ? 'text-[#5a3a1a]' : 'text-[#0f0a08]'
                  }`}
                  style={{ fontFamily: SERIF_FONT }}
                >
                  {g.name}
                </div>
                <div className="mt-1 text-center text-[10px] tracking-wider text-[#0f0a08]">
                  {g.hours}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-[#c89146]/55 bg-[#fbf3e2]/94 backdrop-blur-sm p-6 md:p-8 shadow-[0_20px_50px_-25px_rgba(90,58,26,0.3)]">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div
                className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#fbf3e2] to-[#e9d4b6] border border-[#c89146]/55 flex items-center justify-center text-4xl shrink-0"
                style={{ filter: 'drop-shadow(0 2px 3px rgba(90,58,26,0.2))' }}
              >
                {z.glyph}
              </div>
              <div>
                <div
                  className="text-2xl font-serif text-[#0f0a08]"
                  style={{ fontFamily: SERIF_FONT }}
                >
                  Tuổi <span className="text-[#5a3a1a]">{z.name}</span>
                </div>
                <div className="text-xs text-[#0f0a08] tracking-wider mt-1">
                  {z.years}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-center">
              {cats.map((c, i) => (
                <div key={c}>
                  <div className="text-[10px] tracking-[0.25em] uppercase text-[#0f0a08] font-semibold">
                    {c}
                  </div>
                  <div className="mt-1.5 text-base">
                    <Stars n={z.ratings[i] ?? 4} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-5 pt-5 border-t border-[#b58a4a]/25 text-[#0f0a08] leading-relaxed text-[15px]">
            Hôm nay tuổi{' '}
            <span className="font-semibold text-[#5a3a1a]">{z.name}</span>{' '}
            {z.fortune}
            <span className="text-[#0f0a08]">
              {' '}
              · Màu may mắn:{' '}
              <span className="text-[#5a3a1a] font-medium">{z.lucky}</span> · Số
              cát:{' '}
              <span className="text-[#5a3a1a] font-medium">{z.num}</span>
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

function Horoscope() {
  const [today, setToday] = useState('');
  const [todaySignEn, setTodaySignEn] = useState<string | null>(null);
  const daily = useDailyHoroscope();

  useEffect(() => {
    const now = new Date();
    setToday(
      now.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    );
    setTodaySignEn(getSignToday(now)?.en ?? null);
  }, []);

  return (
    <section id="cung" className="relative py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="text-[11px] tracking-[0.4em] text-[#4a6c7a] font-semibold uppercase">
              十 二 星 座 · Tinh Tọa
            </div>
            <h2
              className="mt-3 text-5xl font-serif text-[#0f0a08]"
              style={{ fontFamily: SERIF_FONT }}
            >
              12 Cung Hoàng Đạo <em className="text-[#4a6c7a]">Hôm Nay</em>
            </h2>
            <p className="mt-2 text-[#0f0a08]">
              Luận giải vận trình hôm nay cho từng cung — miễn phí, cập nhật mỗi
              ngày
            </p>
          </div>
          <Link href="/hoang-dao" className="text-[#5a3a1a] hover:text-[#4a6c7a] text-sm">
            Xem tất cả →
          </Link>
        </div>

        {/* Banner: cung của hôm nay (lib horoscope tính từ ngày hiện tại) */}
        {todaySignEn && (() => {
          const sign = HOROSCOPE.find((h) => h.en === todaySignEn);
          if (!sign) return null;
          return (
            <div
              className="mb-8 inline-flex items-center gap-3 rounded-full border border-[#c89146]/55 bg-[#fbf3e2]/85 px-5 py-2 text-[13.5px] text-[#0f0a08]"
              suppressHydrationWarning
            >
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#4a6c7a] font-bold">
                Hôm nay
              </span>
              <span className="w-px h-3.5 bg-[#c89146]/55" />
              <span>
                Mặt Trời đang chiếu cung{' '}
                <strong className="text-[#5a3a1a]">
                  {sign.name} {sign.sym}
                </strong>
              </span>
            </div>
          );
        })()}

        <div className="grid md:grid-cols-2 gap-5">
          {HOROSCOPE.map((h) => (
            <div
              key={h.name}
              className="rounded-2xl border border-[#c89146]/55 bg-[#fbf3e2]/94 backdrop-blur-sm p-6 hover:border-[#4a6c7a]/60 transition"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fbf3e2] to-[#e9d4b6] border border-[#c89146]/55 flex items-center justify-center text-[#5a3a1a] text-xl">
                    {h.sym}
                  </div>
                  <div>
                    <div
                      className="text-lg font-serif text-[#5a3a1a]"
                      style={{ fontFamily: SERIF_FONT }}
                    >
                      {h.name}
                    </div>
                    <div className="text-[10px] tracking-widest uppercase text-[#0f0a08]">
                      {h.range}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] tracking-[0.3em] uppercase text-[#0f0a08] font-semibold">
                  {h.el}
                </span>
              </div>
              {daily?.readings[h.en] ? (
                <p className="text-[14px] text-[#0f0a08] leading-relaxed">
                  <span className="text-[#0f0a08]" suppressHydrationWarning>
                    {today ? `Ngày ${today}, ` : ''}
                  </span>
                  {daily.readings[h.en]}
                </p>
              ) : (
                <div className="inline-flex items-center gap-2 text-[13px] text-[#4a6c7a] italic">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c89146] animate-pulse" />
                  Hệ thống đang luận giải vận trình hôm nay…
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LucDieuSection() {
  const [today, setToday] = useState('');
  const [idxNow, setIdxNow] = useState<number | null>(null);
  useEffect(() => {
    const now = new Date();
    setToday(
      now.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    );
    const h = now.getHours();
    if (h === 23 || h === 0) {
      setIdxNow(0);
    } else {
      setIdxNow(Math.floor((h + 1) / 2));
    }
  }, []);
  return (
    <section id="lucdieu" className="relative py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="text-[11px] tracking-[0.4em] text-[#4a6c7a] font-semibold uppercase">
              六 曜 · Cát Hung
            </div>
            <h2
              className="mt-3 text-5xl font-serif text-[#0f0a08]"
              style={{ fontFamily: SERIF_FONT }}
            >
              Lục Diệu <em className="text-[#4a6c7a]">Theo Giờ</em>
            </h2>
            <p className="mt-2 text-[#0f0a08]">
              Chọn giờ xuất hành, hành động theo diệu tốt trong ngày
            </p>
          </div>
          <div className="px-4 py-2 rounded-full border border-[#c89146]/55 bg-[#fbf3e2]/94 text-sm text-[#0f0a08]">
            <span className="text-[#0f0a08] mr-2">Hôm nay:</span>
            <span className="font-medium" suppressHydrationWarning>
              {today}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {LUC_DIEU.map((l, i) => {
            const tone = LUC_DIEU_TONE[l.name] ?? { fg: '#5a3a1a', bg: '#fff' };
            const isNow = i === idxNow;
            return (
              <div
                key={i}
                className={`relative rounded-xl border bg-[#fbf3e2]/94 backdrop-blur-sm p-4 text-center transition ${
                  isNow
                    ? 'border-[#4a6c7a] shadow-[0_0_0_1px_#4a6c7a,0_8px_24px_-8px_rgba(90,58,26,0.4)]'
                    : 'border-[#c89146]/50'
                }`}
                style={{
                  background: isNow
                    ? 'linear-gradient(180deg,#fbf3e2,#f0d9b5)'
                    : undefined,
                }}
              >
                {isNow && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#5a3a1a] text-[#fbf3e2] text-[10px] tracking-wider whitespace-nowrap">
                    Giờ này
                  </span>
                )}
                <div className="text-2xl mb-1.5" style={{ color: tone.fg }}>
                  {l.icon}
                </div>
                <div className="text-[11px] text-[#0f0a08] tracking-wider">
                  {l.hour}
                </div>
                <div
                  className="mt-1 text-[15px] font-serif text-[#0f0a08]"
                  style={{ fontFamily: SERIF_FONT }}
                >
                  {l.chi}
                </div>
                <div
                  className="mt-0.5 text-sm font-semibold"
                  style={{ color: tone.fg }}
                >
                  {l.name}
                </div>
                <div className="mt-1 text-[11px] text-[#0f0a08] leading-snug">
                  {l.short}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 text-center text-xs text-[#0f0a08]">
          Tính theo ngày âm lịch · Cập nhật mỗi ngày lúc 00:00
        </div>
      </div>
    </section>
  );
}

function Articles() {
  return (
    <section id="articles" className="relative py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <div className="text-[11px] tracking-[0.4em] text-[#4a6c7a] font-semibold uppercase">
              古 學 · Cổ Học
            </div>
            <h2
              className="mt-3 text-5xl font-serif text-[#0f0a08]"
              style={{ fontFamily: SERIF_FONT }}
            >
              Bài viết <em className="text-[#4a6c7a]">tuyển chọn</em>
            </h2>
          </div>
          <a href="#" className="text-[#5a3a1a] hover:text-[#4a6c7a] text-sm">
            Tất cả bài viết →
          </a>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ARTICLES.map((a, i) => (
            <a
              key={i}
              href="#"
              className="group rounded-2xl border border-[#c89146]/55 bg-[#fbf3e2]/92 p-6 hover:border-[#4a6c7a]/60 hover:-translate-y-1 transition-all"
            >
              <div className="flex items-center gap-3 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-[#5a3a1a]/10 text-[#5a3a1a] tracking-wider">
                  {a.tag}
                </span>
                <span className="text-[#4a3a30]">·</span>
                <span className="text-[#0f0a08]">{a.read}</span>
              </div>
              <h3
                className="mt-4 text-xl font-serif text-[#0f0a08] leading-snug group-hover:text-[#4a6c7a]"
                style={{ fontFamily: SERIF_FONT }}
              >
                {a.title}
              </h3>
              <div className="mt-5 inline-flex items-center gap-2 text-[#5a3a1a] text-sm">
                Đọc tiếp{' '}
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomeClient() {
  return (
    <div className="relative text-[#0f0a08]">
      <Hero />
      <ServiceGrid />
      <ZodiacRing />
      <LucDieuSection />
      <Horoscope />
      <Articles />
    </div>
  );
}
