'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCardByIdOrThrow, getImageUrl, type DrawnCard, type TarotCard } from '@tuvi/tarot';
import { toast } from '@/components/ui/toast';

const SERIF_FONT = "'Cormorant Garamond',serif";

type Field = 'love' | 'career' | 'finance' | 'health' | 'general';

const FIELD_LABEL: Record<Field, string> = {
  love: 'Tình duyên',
  career: 'Sự nghiệp',
  finance: 'Tài chính',
  health: 'Sức khỏe',
  general: 'Tổng quát',
};

interface PerCardReading {
  cardId: string;
  reversed: boolean;
  position: string;
  paragraph: string;
}

interface TarotApiResponse {
  ok: true;
  chartId: string;
  cards: DrawnCard[];
  field: Field;
  numCards: 1 | 3 | 5 | 7 | 10;
  question: string | null;
  name: string;
  gender: 'male' | 'female';
  reading: {
    intro: string;
    perCard: PerCardReading[];
    overall: string;
    answer: string | null;
  };
}

export default function TarotResultPage({ chartId }: { chartId: string }) {
  const router = useRouter();
  const [data, setData] = useState<TarotApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    setLoading(true);
    setError(null);
    fetch(`/api/tarot/${encodeURIComponent(chartId)}`)
      .then(async (res) => {
        const body = await res.json();
        if (aborted) return;
        if (res.status === 401) {
          router.push(`/dang-nhap?callbackUrl=${encodeURIComponent(`/xem-tarot/${chartId}`)}`);
          return;
        }
        if (res.status === 404) {
          setError('Không tìm thấy trải bài (hoặc không thuộc tài khoản của bạn).');
          return;
        }
        if (!res.ok || !body?.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
        setData(body as TarotApiResponse);
      })
      .catch((e: Error) => {
        if (aborted) return;
        setError(e.message);
        toast.error(`Lỗi: ${e.message}`);
      })
      .finally(() => {
        if (!aborted) setLoading(false);
      });
    return () => {
      aborted = true;
    };
  }, [chartId, router]);

  return (
    <div className="min-h-screen px-6 py-12 text-[#0f0a08]">
      <div className="max-w-4xl mx-auto">
        <div className="text-[12px] text-[#4a3a30] mb-4">
          <Link href="/" className="hover:text-[#5a3a1a]">
            Trang chủ
          </Link>
          <span className="mx-2 text-[#c89146]">›</span>
          <Link href="/lich-su" className="hover:text-[#5a3a1a]">
            Lịch sử
          </Link>
          <span className="mx-2 text-[#c89146]">›</span>
          <span className="text-[#5a3a1a] font-medium">Tarot</span>
        </div>

        {loading && (
          <div className="rounded-3xl border border-[#c89146]/55 bg-[#fbf3e2]/95 p-10 text-center text-[#4a3a30]">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#c89146] animate-pulse" />
              Đang tải trải bài…
            </span>
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-[#c8361d]/40 bg-[#c8361d]/10 p-6 text-[#c8361d]">
            ⚠ {error}
            <div className="mt-4">
              <Link
                href="/xem-tarot"
                className="inline-block px-5 py-2 rounded-full bg-[#5a3a1a] text-[#fbf3e2] text-[13px] font-semibold"
              >
                Rút trải bài mới →
              </Link>
            </div>
          </div>
        )}

        {data && <ResultDisplay data={data} />}
      </div>
    </div>
  );
}

function ResultDisplay({ data }: { data: TarotApiResponse }) {
  const { reading, cards, field, question, numCards } = data;
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[#c89146]/55 bg-[#fbf3e2]/95 p-6 md:p-8 text-center">
        <div className="text-[11px] tracking-[0.4em] uppercase text-[#4a6c7a] font-semibold">
          Trải bài {numCards} lá · {FIELD_LABEL[field]}
        </div>
        {question && (
          <p
            className="mt-3 text-[15px] italic text-[#5a3a1a]"
            style={{ fontFamily: SERIF_FONT }}
          >
            "{question}"
          </p>
        )}
      </div>

      <div className="rounded-3xl border border-[#c89146]/55 bg-[#fbf3e2]/95 p-5 md:p-8">
        <div
          className={`grid gap-3 md:gap-5 justify-items-center ${
            numCards === 1
              ? 'grid-cols-1'
              : numCards === 3
              ? 'grid-cols-3'
              : numCards === 5
              ? 'grid-cols-2 md:grid-cols-5'
              : numCards === 7
              ? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-7'
              : 'grid-cols-2 sm:grid-cols-5'
          }`}
        >
          {cards.map((drawn, i) => {
            const card = getCardByIdOrThrow(drawn.cardId);
            const position = reading.perCard[i]?.position ?? `Vị trí ${i + 1}`;
            return (
              <StaticCard
                key={`${drawn.cardId}-${i}`}
                card={card}
                reversed={drawn.reversed}
                position={position}
                idx={i}
              />
            );
          })}
        </div>
      </div>

      <article className="rounded-3xl border border-[#c89146]/55 bg-[#fbf3e2]/95 p-6 md:p-8">
        <p
          className="text-[16.5px] md:text-[17.5px] italic leading-[1.7] text-[#5a3a1a]"
          style={{ fontFamily: SERIF_FONT }}
        >
          {reading.intro}
        </p>
      </article>

      <div className="space-y-4">
        {reading.perCard.map((p, i) => {
          const card = getCardByIdOrThrow(p.cardId);
          return (
            <article
              key={`${p.cardId}-${i}`}
              className="rounded-3xl border border-[#c89146]/45 bg-[#fbf3e2]/95 p-5 md:p-7 grid md:grid-cols-[100px_1fr] gap-5 items-start"
            >
              <div className="flex flex-col items-center">
                <div className="w-[88px] h-[150px] rounded-lg overflow-hidden border-2 border-[#c89146]/60 shadow-md">
                  <img
                    src={getImageUrl(card)}
                    alt={card.nameVi}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    style={p.reversed ? { transform: 'rotate(180deg)' } : undefined}
                  />
                </div>
                <div className="mt-2 text-center">
                  <div
                    className="text-[14px] font-bold text-[#5a3a1a]"
                    style={{ fontFamily: SERIF_FONT }}
                  >
                    {card.nameVi}
                  </div>
                  <div className="text-[10px] tracking-wider uppercase text-[#7a6a52]">
                    {p.reversed ? (
                      <span className="text-[#c8361d]">Ngược</span>
                    ) : (
                      <span>Xuôi</span>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[11px] tracking-[0.25em] uppercase font-bold text-[#4a6c7a] mb-2">
                  {p.position}
                </div>
                <p className="text-[14.5px] leading-[1.75] text-[#2a1c14] whitespace-pre-wrap">
                  {p.paragraph}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      <article className="rounded-3xl border border-[#5a3a1a]/45 bg-gradient-to-br from-[#fbf3e2] to-[#e9d4b6] p-6 md:p-8">
        <h3
          className="text-[18px] md:text-[20px] font-serif italic text-[#5a3a1a] border-b border-[#c89146]/40 pb-2 mb-3"
          style={{ fontFamily: SERIF_FONT }}
        >
          Tổng kết trải bài
        </h3>
        <p className="text-[14.5px] leading-[1.8] text-[#2a1c14] whitespace-pre-wrap">
          {reading.overall}
        </p>
      </article>

      {reading.answer && (
        <article className="rounded-3xl border border-[#c8361d]/40 bg-[#fbf3e2]/95 p-6 md:p-8">
          <h3
            className="text-[18px] md:text-[20px] font-serif italic text-[#c8361d] border-b border-[#c8361d]/30 pb-2 mb-3"
            style={{ fontFamily: SERIF_FONT }}
          >
            Trả lời câu hỏi của bạn
          </h3>
          <p className="text-[14.5px] leading-[1.8] text-[#2a1c14] whitespace-pre-wrap">
            {reading.answer}
          </p>
        </article>
      )}

      <div className="text-center flex items-center justify-center gap-3 flex-wrap pt-2">
        <Link
          href="/xem-tarot"
          className="px-6 py-3 rounded-full bg-gradient-to-r from-[#5a3a1a] to-[#c89146] text-[#fbf3e2] font-bold text-[13px] tracking-wider uppercase shadow"
        >
          ↻ Rút trải bài mới
        </Link>
        <Link
          href="/lich-su"
          className="px-6 py-3 rounded-full border border-[#4a6c7a]/55 bg-[#fbf3e2] text-[#4a6c7a] font-semibold text-[13px]"
        >
          ← Lịch sử
        </Link>
      </div>
    </div>
  );
}

function StaticCard({
  card,
  reversed,
  position,
  idx,
}: {
  card: TarotCard;
  reversed: boolean;
  position: string;
  idx: number;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-[110px] h-[180px] md:w-[130px] md:h-[210px] rounded-lg overflow-hidden border-2 border-[#c89146] shadow-md bg-[#fbf3e2]">
        <img
          src={getImageUrl(card)}
          alt={card.nameVi}
          loading="lazy"
          className="w-full h-full object-cover"
          style={reversed ? { transform: 'rotate(180deg)' } : undefined}
        />
      </div>
      <div className="mt-2 text-center min-h-[44px]">
        <div className="text-[10px] tracking-[0.18em] uppercase text-[#4a6c7a] font-bold">
          {idx + 1}. {position}
        </div>
        <div
          className="text-[12.5px] font-bold text-[#5a3a1a] leading-tight mt-0.5"
          style={{ fontFamily: SERIF_FONT }}
        >
          {card.nameVi}
        </div>
        {reversed && (
          <div className="text-[10px] uppercase tracking-wider text-[#c8361d] font-bold">
            Ngược
          </div>
        )}
      </div>
    </div>
  );
}
