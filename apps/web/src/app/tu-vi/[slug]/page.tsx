import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchChartBySlug } from '@/lib/api';
import { API_BASE_URL, SITE_URL, TELEGRAM_USERNAME } from '@/lib/env';
import { RenderTuviContent } from '@/lib/markdown';
import { ANALYSIS_TITLES } from '@tuvi/core';
import type { AnalysisSections, PalaceData } from '@tuvi/core';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const result = await fetchChartBySlug(params.slug);
  if (!result) {
    return { title: 'Không tìm thấy lá số', robots: { index: false, follow: false } };
  }
  const name = result.info.name;
  const title = `Lá số Tử Vi Đẩu Số của ${name}`;
  const description = `Luận giải lá số tử vi đẩu số chi tiết cho ${name} (sinh ${result.info.birthDate}, giờ ${result.info.timeName}). Bao gồm 12 cung, chính tinh, phụ tinh và 6 phần phân tích.`;
  return {
    title,
    description,
    alternates: { canonical: `/tu-vi/${params.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/tu-vi/${params.slug}`,
      type: 'article',
    },
  };
}

const ANALYSIS_ORDER: Array<keyof AnalysisSections> = [
  'overview',
  'career',
  'love',
  'health',
  'decade',
  'advice',
];

export default async function Page({ params }: PageProps) {
  const result = await fetchChartBySlug(params.slug);
  if (!result) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `Lá số Tử Vi Đẩu Số của ${result.info.name}`,
    datePublished: result.createdAt,
    author: { '@type': 'Organization', name: 'Tử Vi AI' },
    mainEntityOfPage: `${SITE_URL}/tu-vi/${params.slug}`,
    inLanguage: 'vi-VN',
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HeroHeader result={result} />
      <PalaceGrid palaces={result.chart.palaces} />
      <Analyses analysis={result.analysis} />
      <CrossCTA slug={params.slug} />
    </>
  );
}

function HeroHeader({ result }: { result: NonNullable<Awaited<ReturnType<typeof fetchChartBySlug>>> }) {
  const c = result.chart;
  const info = result.info;
  return (
    <section className="relative bg-gradient-to-br from-brand-purpleDark via-brand-purple to-brand-purpleDark text-brand-cream">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="chip bg-brand-gold/20 text-brand-gold">LÁ SỐ TỬ VI ĐẨU SỐ</span>
            <h1 className="mt-3 font-serif text-4xl font-bold md:text-5xl">
              {info.name.toUpperCase()}
            </h1>
            <p className="mt-2 text-brand-goldLight/90">
              {info.gender === 'male' ? 'Nam' : 'Nữ'} &nbsp;•&nbsp; Tuổi {c.zodiac}
              &nbsp;•&nbsp; Ngũ hành cục: <strong className="text-brand-gold">{c.fiveElementsClass}</strong>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={`${API_BASE_URL}/api/tuvi/pdf/${result.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold"
            >
              📄 Tải bản PDF
            </a>
            <a
              href={`https://t.me/${TELEGRAM_USERNAME}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-purple"
            >
              👉 Nhận PDF qua Telegram
            </a>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          <InfoCard label="Ngày sinh (DL)" value={c.solarDate} />
          <InfoCard label="Ngày sinh (AL)" value={c.lunarDate || '—'} />
          <InfoCard label="Giờ sinh" value={`${c.time} (${c.timeRange})`} />
          <InfoCard label="Can chi" value={c.chineseDate || '—'} />
          <InfoCard label="Mệnh chủ" value={c.soul || '—'} highlight />
          <InfoCard label="Thân chủ" value={c.body || '—'} highlight />
          <InfoCard label="Cung Mệnh" value={c.earthlyBranchOfSoulPalace || '—'} />
          <InfoCard label="Cung Thân" value={c.earthlyBranchOfBodyPalace || '—'} />
        </div>
      </div>
    </section>
  );
}

function InfoCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={[
        'rounded-xl border px-4 py-3',
        highlight
          ? 'border-brand-gold/60 bg-brand-gold/10 text-brand-gold'
          : 'border-brand-gold/30 bg-white/5 text-brand-cream',
      ].join(' ')}
    >
      <div className="text-[10px] uppercase tracking-wider text-brand-goldLight/80">{label}</div>
      <div className="mt-1 truncate text-base font-semibold">{value}</div>
    </div>
  );
}

function PalaceGrid({ palaces }: { palaces: PalaceData[] }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="text-center">
        <span className="chip">12 CUNG TỬ VI</span>
        <h2 className="mt-3 font-serif text-3xl font-bold text-brand-purple">Tổng quan 12 cung</h2>
        <p className="mt-2 text-brand-mute">Liệt kê chính tinh, phụ tinh và đại hạn cho từng cung.</p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {palaces.map((p) => (
          <article key={p.index} className="card relative">
            {p.isBodyPalace && (
              <span className="absolute right-3 top-3 rounded-full bg-brand-purple px-2 py-0.5 text-[10px] font-bold text-brand-gold">
                THÂN CUNG
              </span>
            )}
            <header>
              <div className="font-serif text-lg font-bold text-brand-purple">{p.name}</div>
              <div className="text-xs text-brand-mute">
                {p.heavenlyStem}{p.earthlyBranch}
                {p.decadal ? ` • Đại hạn ${p.decadal.range[0]}–${p.decadal.range[1]}` : ''}
              </div>
            </header>
            {p.majorStars.length > 0 && (
              <PalaceStars label="Chính tinh" stars={p.majorStars} accent />
            )}
            {p.minorStars.length > 0 && <PalaceStars label="Phụ tinh" stars={p.minorStars} />}
            {p.adjectiveStars.length > 0 && (
              <PalaceStars label="Tạp diệu" stars={p.adjectiveStars} muted />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function PalaceStars({
  label,
  stars,
  accent,
  muted,
}: {
  label: string;
  stars: PalaceData['majorStars'];
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="mt-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-mute">{label}</div>
      <ul className="mt-1 flex flex-wrap gap-1">
        {stars.map((s, i) => (
          <li
            key={i}
            className={[
              'rounded-md px-2 py-0.5 text-xs',
              accent
                ? 'bg-brand-purple text-brand-gold'
                : muted
                  ? 'bg-brand-cream text-brand-mute'
                  : 'bg-brand-gold/20 text-brand-purple',
            ].join(' ')}
          >
            {s.name}
            {s.mutagen ? ` (${s.mutagen})` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Analyses({ analysis }: { analysis: AnalysisSections }) {
  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <div className="text-center">
        <span className="chip">6 PHẦN LUẬN GIẢI</span>
        <h2 className="mt-3 font-serif text-3xl font-bold text-brand-purple">Bản luận giải chi tiết</h2>
      </div>
      <div className="mt-8 space-y-6">
        {ANALYSIS_ORDER.map((key, i) => (
          <article key={key} className="card">
            <header className="mb-4 flex items-center gap-3 border-b border-brand-goldLight/60 pb-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-purple font-serif text-lg font-bold text-brand-gold">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="font-serif text-xl font-bold text-brand-purple">
                {ANALYSIS_TITLES[key]}
              </h3>
            </header>
            <RenderTuviContent content={analysis[key]} />
          </article>
        ))}
      </div>
    </section>
  );
}

function CrossCTA({ slug }: { slug: string }) {
  return (
    <section className="mx-auto max-w-4xl px-6 pb-16">
      <div className="rounded-3xl bg-brand-purple p-8 text-center text-brand-cream shadow-soft">
        <h2 className="font-serif text-2xl font-bold text-brand-gold">
          Muốn lưu giữ bản PDF sang trọng?
        </h2>
        <p className="mt-2 text-brand-goldLight/90">
          Nhận ngay file PDF tím – vàng qua Telegram, hoặc tải trực tiếp từ đây.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <a
            href={`${API_BASE_URL}/api/tuvi/pdf/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold"
          >
            📄 Tải PDF
          </a>
          <a
            href={`https://t.me/${TELEGRAM_USERNAME}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-purple"
          >
            👉 Nhận PDF qua Telegram
          </a>
          <Link
            href="/xem-tu-vi"
            className="btn-outline border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-purple"
          >
            ↻ Xem lá số khác
          </Link>
        </div>
      </div>
    </section>
  );
}
