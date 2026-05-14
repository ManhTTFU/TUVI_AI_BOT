'use client';

import { useEffect, useState } from 'react';
import type { BatTuChart, PillarInfo, WuxingPhase } from '@/lib/bat-tu';
import { RenderTuviContent } from '@/lib/markdown';
import { toast } from '@/components/ui/toast';

const SERIF_FONT = "'Cormorant Garamond',serif";

const PHASE_COLOR: Record<
  WuxingPhase,
  { bg: string; border: string; text: string; ring: string }
> = {
  Kim: {
    bg: 'bg-[#fbf3e2]',
    border: 'border-[#c89146]/55',
    text: 'text-[#a08050]',
    ring: 'from-[#e9d4b6] to-[#c89146]',
  },
  Mộc: {
    bg: 'bg-[#eef3e9]',
    border: 'border-[#6b8a52]/40',
    text: 'text-[#4d6a3a]',
    ring: 'from-[#c5d4b0] to-[#6b8a52]',
  },
  Thủy: {
    bg: 'bg-[#e8eef2]',
    border: 'border-[#4a6c7a]/40',
    text: 'text-[#2a3a4a]',
    ring: 'from-[#b8c4d0] to-[#2a3a4a]',
  },
  Hỏa: {
    bg: 'bg-[#f5e3d8]',
    border: 'border-[#c8361d]/40',
    text: 'text-[#c8361d]',
    ring: 'from-[#e9b48a] to-[#c8361d]',
  },
  Thổ: {
    bg: 'bg-[#f1e8d4]',
    border: 'border-[#a07a3a]/45',
    text: 'text-[#7a5520]',
    ring: 'from-[#e9d4b6] to-[#a07a3a]',
  },
};

function PillarCard({ pillar }: { pillar: PillarInfo }) {
  const canColor = PHASE_COLOR[pillar.canPhase];
  const chiColor = PHASE_COLOR[pillar.chiPhase];
  return (
    <article
      className={`relative rounded-2xl border ${canColor.border} ${canColor.bg} p-4 md:p-5 text-center`}
    >
      <div className="text-[10px] tracking-[0.3em] uppercase font-semibold text-[#4a3a30]">
        {pillar.label}
      </div>
      <div
        className={`mx-auto mt-3 w-14 h-14 rounded-xl bg-gradient-to-br ${canColor.ring} border border-[#c89146]/55 flex items-center justify-center text-[#fbf3e2] text-[26px] font-serif shadow-inner`}
        style={{ fontFamily: SERIF_FONT }}
      >
        {pillar.canChi.can[0]}
      </div>
      <div
        className="mt-3 text-2xl font-serif text-[#0f0a08]"
        style={{ fontFamily: SERIF_FONT }}
      >
        {pillar.text}
      </div>
      <div className="mt-2 flex justify-center gap-2 flex-wrap">
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold tracking-wide ${canColor.text} border ${canColor.border} bg-[#fbf3e2]`}
        >
          Can · {pillar.canPhase}
        </span>
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold tracking-wide ${chiColor.text} border ${chiColor.border} bg-[#fbf3e2]`}
        >
          Chi · {pillar.chiPhase}
        </span>
      </div>
      <div className="mt-2 text-[11px] text-[#4a3a30] tracking-wide">{pillar.canPolarity}</div>
    </article>
  );
}

export function PillarsGrid({ chart }: { chart: BatTuChart }) {
  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
      <PillarCard pillar={chart.pillars.year} />
      <PillarCard pillar={chart.pillars.month} />
      <PillarCard pillar={chart.pillars.day} />
      <PillarCard pillar={chart.pillars.hour} />
    </section>
  );
}

export function DayMasterPanel({ chart, name }: { chart: BatTuChart; name: string }) {
  const phase = chart.dayMaster.phase;
  const color = PHASE_COLOR[phase];
  return (
    <section className="rounded-2xl border border-[#c89146]/55 bg-[#fbf3e2]/95 p-6 md:p-8 text-center">
      <div className="text-[11px] tracking-[0.4em] uppercase text-[#4a6c7a] font-semibold">
        日 主 · Nhật chủ
      </div>
      <h3
        className="mt-2 text-3xl md:text-4xl font-serif text-[#0f0a08]"
        style={{ fontFamily: SERIF_FONT }}
      >
        {name} — <em className="text-[#5a3a1a]">{chart.dayMaster.can} {phase}</em>
      </h3>
      <p className="mt-2 text-[13px] text-[#4a3a30]">
        Can ngày <strong>{chart.dayMaster.can}</strong> · Ngũ hành{' '}
        <span className={`font-semibold ${color.text}`}>{phase}</span> ·{' '}
        {chart.dayMaster.polarity}
      </p>
      <div className="mt-4 inline-flex items-center gap-4 px-5 py-2 rounded-full border border-[#c89146]/55 bg-[#fbf3e2] text-[12px] text-[#4a3a30]">
        <span>
          Dương:{' '}
          <strong className="text-[#0f0a08]">
            {chart.birth.solar.day}/{chart.birth.solar.month}/{chart.birth.solar.year}{' '}
            {String(chart.birth.solar.hour).padStart(2, '0')}:
            {String(chart.birth.solar.minute).padStart(2, '0')}
          </strong>
        </span>
        <span className="w-px h-3.5 bg-[#c89146]/40" />
        <span>
          Âm:{' '}
          <strong className="text-[#0f0a08]">
            {chart.birth.lunar.day}/{chart.birth.lunar.month}
            {chart.birth.lunar.leap ? ' (nhuận)' : ''}/{chart.birth.lunar.year}
          </strong>
        </span>
      </div>
    </section>
  );
}

interface ResultViewProps {
  chartId: string;
  chart: BatTuChart;
  name: string;
  gender: 'male' | 'female';
  /** Nếu đã có markdown sẵn (SSR cache hit) → skip fetch lần đầu. */
  initialMarkdown?: string | null;
}

export default function TuTruResultView({
  chartId,
  chart,
  name,
  initialMarkdown = null,
}: ResultViewProps) {
  const [analysis, setAnalysis] = useState<string | null>(initialMarkdown);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [proRequired, setProRequired] = useState(false);

  const fetchAnalysis = () => {
    setAiLoading(true);
    setAnalysis(null);
    setAiError(null);
    setProRequired(false);
    fetch(`/api/tu-tru/${chartId}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(async (res) => {
        const body = await res.json();
        if (res.status === 402) {
          setProRequired(true);
          return;
        }
        if (!res.ok || !body?.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
        setAnalysis(body.markdown as string);
        toast.success('Luận giải Bát Tự xong');
      })
      .catch((err: Error) => {
        setAiError(err.message);
        toast.error(`Lỗi luận Bát Tự: ${err.message}`);
      })
      .finally(() => setAiLoading(false));
  };

  useEffect(() => {
    if (initialMarkdown) return;
    fetchAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartId]);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="text-center">
        <div className="text-[11px] tracking-[0.4em] uppercase text-[#4a6c7a] font-semibold">
          四 柱 · Tứ Trụ
        </div>
        <h2
          className="mt-2 text-4xl font-serif italic text-[#0f0a08]"
          style={{ fontFamily: SERIF_FONT }}
        >
          Bát Tự {name}
        </h2>
      </div>
      <DayMasterPanel chart={chart} name={name} />
      <PillarsGrid chart={chart} />

      {aiLoading && (
        <div className="rounded-2xl border border-[#c89146]/45 bg-[#fbf3e2]/85 p-6 text-center text-[#4a3a30]">
          <div className="inline-flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#c89146] animate-pulse" />
            Hệ thống đang luận giải Bát Tự — bám vào dụng thần, kỵ thần, xung hợp…
          </div>
          <div className="mt-1 text-[12px] text-[#7a6a52]">
            Mất khoảng 30–60 giây tùy độ tải.
          </div>
        </div>
      )}

      {proRequired && (
        <div className="rounded-xl border border-[#c89146]/55 bg-[#f5e3c0]/50 px-4 py-3 text-[#5a3a1a] text-[13px]">
          ⚠ Tài khoản PRO đã hết hạn — vào{' '}
          <a href="/vi-cua-toi" className="underline font-semibold">
            Ví của tôi
          </a>{' '}
          để gia hạn rồi tải lại trang.
        </div>
      )}

      {aiError && (
        <div className="rounded-xl border border-[#c8361d]/40 bg-[#c8361d]/10 px-4 py-3 text-[#c8361d] text-[13.5px] flex items-center justify-between gap-3 flex-wrap">
          <span>⚠ {aiError}</span>
          <button
            type="button"
            onClick={fetchAnalysis}
            className="px-3 py-1.5 rounded-full bg-[#5a3a1a] text-[#fbf3e2] text-[12px] hover:bg-[#4a6c7a]"
          >
            Thử lại
          </button>
        </div>
      )}

      {analysis && (
        <article className="rounded-2xl border border-[#c89146]/55 bg-[#fbf3e2]/95 p-6 md:p-10 shadow-[0_20px_60px_-30px_rgba(90,58,26,0.3)]">
          <RenderTuviContent content={analysis} />
        </article>
      )}
    </div>
  );
}
