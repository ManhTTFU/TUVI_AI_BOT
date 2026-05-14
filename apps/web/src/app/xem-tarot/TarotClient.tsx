'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  TAROT_DECK,
  getImageUrl,
  getCardByIdOrThrow,
  type DrawnCard,
  type TarotCard,
} from '@tuvi/tarot';
import { toast } from '@/components/ui/toast';
import { formatVnd } from '@/lib/money';
import { subscribeWallet, emitOptimisticBalance } from '@/lib/wallet-sse';

const SERIF_FONT = "'Cormorant Garamond',serif";

const NUM_CARDS_OPTIONS = [1, 3, 5, 7, 10] as const;
type NumCards = (typeof NUM_CARDS_OPTIONS)[number];
type Field = 'love' | 'career' | 'finance' | 'health' | 'general';
type Gender = 'male' | 'female';

const FIELD_LABEL: Record<Field, string> = {
  love: 'Tình duyên',
  career: 'Sự nghiệp',
  finance: 'Tài chính',
  health: 'Sức khỏe',
  general: 'Tổng quát',
};

const NUM_DESCRIPTION: Record<NumCards, string> = {
  1: 'Năng lượng dẫn dắt — 1 lá cho thông điệp trong ngày',
  3: 'Quá khứ · Hiện tại · Tương lai — phổ biến nhất',
  5: 'Cross — Hiện tại, Thách thức, Nền tảng, Cơ hội, Kết quả',
  7: 'Horseshoe — vận trình mở rộng theo 7 vị trí',
  10: 'Celtic Cross — trải bài chi tiết, phân tích sâu',
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
  numCards: NumCards;
  question: string | null;
  name: string;
  gender: Gender;
  /** Có khi server vừa charge thành công (trải bài mới); null khi load lại từ history. */
  chargedVnd?: number;
  balanceVnd?: number;
  reading: {
    intro: string;
    perCard: PerCardReading[];
    overall: string;
    answer: string | null;
  };
}

type Step = 'form' | 'pick' | 'submitting' | 'result';

// Fisher-Yates trên copy
function shuffleDeck(deck: TarotCard[]): TarotCard[] {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main client

export default function TarotClient() {
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession();

  const [step, setStep] = useState<Step>('form');

  // Form
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [field, setField] = useState<Field>('general');
  const [question, setQuestion] = useState('');
  const [numCards, setNumCards] = useState<NumCards>(3);

  // Pick
  const [shuffleKey, setShuffleKey] = useState(0);
  const shuffledDeck = useMemo(() => shuffleDeck(TAROT_DECK), [shuffleKey]);
  const [chosen, setChosen] = useState<DrawnCard[]>([]);

  // Submit / result
  const [result, setResult] = useState<TarotApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [insufficient, setInsufficient] = useState<{ balance: number; required: number } | null>(null);
  // Realtime charge feedback — SSE 'balance' event fire ngay khi server `chargeReading`
  // chạy (~100ms sau submit), trước cả khi AI gen xong 13s. Hiển thị trong SubmittingView
  // để user biết tiền đã trừ.
  const [liveCharge, setLiveCharge] = useState<{ delta: number; balanceVnd: number } | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeWallet((event, data) => {
      if (event === 'balance' && data.reason === 'charge' && data.service === 'tarot') {
        setLiveCharge({ delta: data.delta, balanceVnd: data.balanceVnd });
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    setChosen([]);
  }, [shuffleKey]);

  // Auto-submit khi đủ lá
  useEffect(() => {
    if (step === 'pick' && chosen.length === numCards) {
      // delay 1.2s để user kịp thấy lá cuối lật vào tray
      const timer = setTimeout(() => void submitReading(chosen), 1200);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen, numCards, step]);

  const validForm = name.trim().length > 0;

  function goToPick() {
    if (!validForm) {
      toast.error('Vui lòng nhập họ tên trước khi bắt đầu rút bài');
      return;
    }
    if (status !== 'authenticated') {
      router.push('/dang-nhap?callbackUrl=/xem-tarot');
      return;
    }
    setShuffleKey((k) => k + 1);
    setChosen([]);
    setError(null);
    setInsufficient(null);
    setStep('pick');
  }

  function handleReshuffle() {
    setShuffleKey((k) => k + 1);
    toast.info('Đã tráo lại bộ bài');
  }

  const handlePick = useCallback(
    (card: TarotCard) => {
      setChosen((prev) => {
        if (prev.length >= numCards) return prev;
        if (prev.some((c) => c.cardId === card.id)) return prev;
        const reversed = Math.random() < 0.5;
        return [...prev, { cardId: card.id, reversed }];
      });
    },
    [numCards],
  );

  function handleUndoLast() {
    setChosen((prev) => prev.slice(0, -1));
  }

  async function submitReading(cards: DrawnCard[]) {
    setStep('submitting');
    setError(null);

    // Optimistic balance drop — fire ngay trước fetch để header + SubmittingView
    // hiển thị "Đã trừ 5,000đ" trong vài ms thay vì 200-500ms (Neon DB roundtrip).
    // Server SSE thực sẽ đến sau xác nhận lại cùng số → idempotent, không flicker.
    const PRICE = 5000;
    const currentBalance = session?.user?.balanceVnd ?? 0;
    const estimatedBalance = Math.max(0, currentBalance - PRICE);
    emitOptimisticBalance({
      balanceVnd: estimatedBalance,
      delta: -PRICE,
      reason: 'charge',
      service: 'tarot',
    });

    try {
      const res = await fetch('/api/tarot/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          gender,
          field,
          question: question.trim() || null,
          numCards,
          cards,
        }),
      });
      const body = (await res.json()) as Record<string, unknown>;
      if (res.status === 401) {
        router.push('/dang-nhap?callbackUrl=/xem-tarot');
        return;
      }
      if (res.status === 402 && body?.code === 'INSUFFICIENT_BALANCE') {
        // Server từ chối charge — revert optimistic bằng cách refresh session
        // từ DB. useEffect [session.user.balanceVnd] trong UserMenu sẽ reset.
        await updateSession();
        setLiveCharge(null);
        setInsufficient({
          balance: Number(body.balanceVnd ?? 0),
          required: Number(body.requiredVnd ?? 5000),
        });
        setStep('form');
        toast.error('Số dư không đủ — nạp thêm để xem Tarot');
        return;
      }
      if (!res.ok || !body?.ok) {
        // Lỗi server khác — server có thể đã hoặc chưa charge. Refresh để đồng bộ.
        await updateSession();
        setLiveCharge(null);
        throw new Error((body?.error as string) ?? `HTTP ${res.status}`);
      }
      setResult(body as unknown as TarotApiResponse);
      setStep('result');
      toast.success(
        typeof body.chargedVnd === 'number'
          ? `Luận giải xong — trừ ${formatVnd(body.chargedVnd)}, còn lại ${formatVnd(Number(body.balanceVnd ?? 0))}`
          : 'Luận giải Tarot xong',
      );
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      setStep('pick');
      toast.error(`Lỗi luận giải: ${msg}`);
    }
  }

  function startOver() {
    setResult(null);
    setError(null);
    setChosen([]);
    setShuffleKey((k) => k + 1);
    setStep('form');
    setLiveCharge(null);
  }

  return (
    <div className="min-h-screen text-[#0f0a08]">
      <Hero />
      <div className="px-6 pb-20 max-w-5xl mx-auto relative z-10">
        {step === 'form' && (
          <FormView
            name={name}
            setName={setName}
            gender={gender}
            setGender={setGender}
            field={field}
            setField={setField}
            question={question}
            setQuestion={setQuestion}
            numCards={numCards}
            setNumCards={setNumCards}
            onStart={goToPick}
            authStatus={status}
            insufficient={insufficient}
          />
        )}

        {step === 'pick' && (
          <PickView
            deck={shuffledDeck}
            chosen={chosen}
            numCards={numCards}
            onPick={handlePick}
            onReshuffle={handleReshuffle}
            onUndoLast={handleUndoLast}
            error={error}
            shuffleKey={shuffleKey}
          />
        )}

        {step === 'submitting' && <SubmittingView chosen={chosen} liveCharge={liveCharge} />}

        {step === 'result' && result && (
          <ResultView result={result} onStartOver={startOver} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero

function Hero() {
  return (
    <section className="pt-12 pb-8 px-6 text-center">
      <Link
        href="/"
        className="inline-block text-[11px] tracking-[0.3em] text-[#4a6c7a] hover:text-[#5a3a1a] uppercase"
      >
        ← Trang chủ
      </Link>
      <div className="mt-4 inline-flex items-center gap-3 text-[11px] tracking-[0.4em] uppercase text-[#4a6c7a]">
        <span className="w-8 h-px bg-[#4a6c7a]/60" />
        78 Lá · Rider-Waite-Smith
        <span className="w-8 h-px bg-[#4a6c7a]/60" />
      </div>
      <h1
        className="mt-4 font-serif text-[#0f0a08] leading-[0.95] text-[clamp(48px,7vw,96px)]"
        style={{ fontFamily: SERIF_FONT }}
      >
        Xem <em className="text-[#5a3a1a]">Tarot</em>
      </h1>
      <p className="mt-4 max-w-xl mx-auto text-[#4a3a30]">
        Chọn lá theo trực giác. Khi đủ, hệ thống sẽ luận giải theo bối
        cảnh của bạn.
      </p>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Form

function FieldLabel({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2 text-[#0f0a08]">
      <span className="text-[#4a6c7a] text-[15px]">{icon}</span>
      <span className="text-[14px] font-medium">{children}</span>
    </div>
  );
}

function FormView(props: {
  name: string;
  setName: (v: string) => void;
  gender: Gender;
  setGender: (v: Gender) => void;
  field: Field;
  setField: (v: Field) => void;
  question: string;
  setQuestion: (v: string) => void;
  numCards: NumCards;
  setNumCards: (v: NumCards) => void;
  onStart: () => void;
  authStatus: 'authenticated' | 'unauthenticated' | 'loading';
  insufficient: { balance: number; required: number } | null;
}) {
  const {
    name,
    setName,
    gender,
    setGender,
    field,
    setField,
    question,
    setQuestion,
    numCards,
    setNumCards,
    onStart,
    authStatus,
    insufficient,
  } = props;

  return (
    <div className="rounded-3xl border border-[#c89146]/55 bg-[#fbf3e2]/95 backdrop-blur-sm p-6 md:p-10 shadow-[0_24px_60px_-30px_rgba(90,58,26,0.4)]">
      <h2
        className="text-3xl md:text-4xl font-serif italic text-[#5a3a1a] text-center"
        style={{ fontFamily: SERIF_FONT }}
      >
        Bước 1 · Đặt câu hỏi cho bộ bài
      </h2>
      <p className="mt-2 text-center text-[13px] text-[#4a3a30]">
        Càng cụ thể, luận giải càng sát với bạn.
      </p>

      {insufficient && (
        <div className="mt-6 rounded-2xl border border-[#c89146]/55 bg-[#f5e3c0]/60 p-5 text-[#5a3a1a] text-[13.5px] space-y-2">
          <div>
            ⚠ <strong>Số dư không đủ.</strong> Cần{' '}
            <strong>{formatVnd(insufficient.required)}</strong> cho 1 lần xem Tarot,
            bạn còn <strong>{formatVnd(insufficient.balance)}</strong>.
          </div>
          <Link
            href="/vi-cua-toi"
            className="inline-block px-4 py-1.5 rounded-full bg-[#5a3a1a] text-[#fbf3e2] text-[12px] font-semibold hover:bg-[#4a6c7a]"
          >
            Nạp tiền vào ví →
          </Link>
        </div>
      )}

      <div className="mt-6 max-w-xl mx-auto rounded-xl border border-[#c89146]/55 bg-gradient-to-br from-[#f5e3c0]/40 to-[#fbf3e2]/60 px-4 py-3 text-[12.5px] text-[#4a3a30]">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold">
              Phí dịch vụ
            </span>
            <div className="text-[#0f0a08]">
              Trừ <strong>{formatVnd(5_000)}</strong> mỗi lần xem Tarot. Tối thiểu nạp{' '}
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

      <div className="mt-7 space-y-5 max-w-xl mx-auto">
        <div>
          <FieldLabel icon="👤">
            Họ và tên <span className="text-[#c8361d] ml-0.5">*</span>
          </FieldLabel>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="Nhập tên của bạn"
            className="w-full h-12 px-4 rounded-2xl border border-[#4a6c7a]/35 bg-[#fbf3e2] text-[#0f0a08] placeholder:text-[#7a6a52] focus:outline-none focus:border-[#4a6c7a] focus:ring-2 focus:ring-[#4a6c7a]/15 transition"
          />
        </div>

        <div>
          <FieldLabel icon="⚥">Giới tính</FieldLabel>
          <div className="grid grid-cols-2 gap-3">
            {(['male', 'female'] as const).map((g) => {
              const active = gender === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`group relative h-[78px] rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                    active
                      ? 'border-[#4a6c7a] bg-gradient-to-br from-[#f5e3c0] to-[#e9c98a] shadow-[0_4px_14px_-4px_rgba(110,69,32,0.45)]'
                      : 'border-[#4a6c7a]/30 bg-[#fbf3e2]/85 hover:border-[#4a6c7a]/55 hover:bg-[#fbf3e2]'
                  }`}
                >
                  <div className={`text-2xl leading-none ${active ? 'text-[#5a3a1a]' : 'text-[#4a6c7a]'}`}>
                    {g === 'male' ? '♂' : '♀'}
                  </div>
                  <div className="text-[14px] font-semibold text-[#0f0a08]">
                    {g === 'male' ? 'Nam' : 'Nữ'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <FieldLabel icon="✦">Lĩnh vực muốn xem</FieldLabel>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {(Object.keys(FIELD_LABEL) as Field[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setField(f)}
                className={`px-3 py-2.5 rounded-xl border-2 text-[13px] font-semibold transition ${
                  field === f
                    ? 'border-[#4a6c7a] bg-gradient-to-br from-[#f5e3c0] to-[#e9c98a] text-[#5a3a1a]'
                    : 'border-[#4a6c7a]/30 bg-[#fbf3e2]/85 text-[#0f0a08] hover:border-[#4a6c7a]/55'
                }`}
              >
                {FIELD_LABEL[f]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel icon="💭">
            Câu hỏi cụ thể <span className="text-[#7a6a52] font-normal ml-0.5">(không bắt buộc)</span>
          </FieldLabel>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder='VD: "Liệu công việc hiện tại có nên tiếp tục đến cuối năm?"'
            className="w-full px-4 py-3 rounded-2xl border border-[#4a6c7a]/35 bg-[#fbf3e2] text-[#0f0a08] placeholder:text-[#7a6a52] focus:outline-none focus:border-[#4a6c7a] focus:ring-2 focus:ring-[#4a6c7a]/15 transition resize-none"
          />
          <div className="mt-1 text-[11px] text-[#7a6a52] text-right">{question.length}/500</div>
        </div>

        <div>
          <FieldLabel icon="🃏">Số lá rút</FieldLabel>
          <div className="grid grid-cols-5 gap-2">
            {NUM_CARDS_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNumCards(n)}
                className={`py-3 rounded-xl border-2 text-[15px] font-bold transition ${
                  numCards === n
                    ? 'border-[#4a6c7a] bg-gradient-to-br from-[#f5e3c0] to-[#e9c98a] text-[#5a3a1a]'
                    : 'border-[#4a6c7a]/30 bg-[#fbf3e2]/85 text-[#0f0a08] hover:border-[#4a6c7a]/55'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[12.5px] text-[#4a3a30] italic">{NUM_DESCRIPTION[numCards]}</p>
        </div>

        <button
          type="button"
          onClick={onStart}
          disabled={!name.trim()}
          className="w-full mt-2 py-4 rounded-2xl bg-gradient-to-r from-[#5a3a1a] to-[#c89146] text-[#fbf3e2] font-bold text-[15px] tracking-wider uppercase shadow-[0_12px_24px_-12px_rgba(90,58,26,0.6)] hover:from-[#4a6c7a] hover:to-[#d4a05a] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ✦ Bắt đầu rút bài →
        </button>
        {authStatus === 'unauthenticated' && (
          <p className="text-center text-[12px] text-[#7a6a52]">
            Bạn cần đăng nhập để xem Tarot.{' '}
            <Link href="/dang-nhap?callbackUrl=/xem-tarot" className="text-[#4a6c7a] underline">
              Đăng nhập →
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pick view — casino dealing animation + click-to-pick

// Tổng thời gian dealing animation = (78 * stagger) + duration mỗi lá.
// Tính chính xác để timer "dealing done" trùng với khi lá cuối landed.
const DEAL_STAGGER_MS = 28;
const DEAL_DURATION_MS = 550;
const DEAL_TOTAL_MS = TAROT_DECK.length * DEAL_STAGGER_MS + DEAL_DURATION_MS;

function PickView(props: {
  deck: TarotCard[];
  chosen: DrawnCard[];
  numCards: NumCards;
  onPick: (card: TarotCard) => void;
  onReshuffle: () => void;
  onUndoLast: () => void;
  error: string | null;
  shuffleKey: number;
}) {
  const { deck, chosen, numCards, onPick, onReshuffle, onUndoLast, error, shuffleKey } = props;
  const chosenIds = useMemo(() => new Set(chosen.map((c) => c.cardId)), [chosen]);
  const full = chosen.length >= numCards;

  // Block click trong khi đang chia bài. Reset mỗi lần reshuffle.
  const [dealing, setDealing] = useState(true);
  useEffect(() => {
    setDealing(true);
    const t = setTimeout(() => setDealing(false), DEAL_TOTAL_MS);
    return () => clearTimeout(t);
  }, [shuffleKey]);

  return (
    <div className="rounded-3xl border border-[#c89146]/55 bg-[#fbf3e2]/95 backdrop-blur-sm p-5 md:p-8 shadow-[0_24px_60px_-30px_rgba(90,58,26,0.4)]">
      <h2
        className="text-2xl md:text-3xl font-serif italic text-[#5a3a1a] text-center"
        style={{ fontFamily: SERIF_FONT }}
      >
        Bước 2 · Chạm chọn {numCards} lá
      </h2>
      <p className="mt-2 text-center text-[13px] text-[#4a3a30]">
        {dealing ? (
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#c89146] animate-pulse" />
            Đang chia bài… hít một hơi sâu, để trực giác dẫn ngón tay.
          </span>
        ) : (
          <>Hít một hơi sâu, để trực giác dẫn ngón tay. Lá đã chọn sẽ bay lên trên.</>
        )}
      </p>

      {/* Chosen tray */}
      <div className="mt-5 rounded-2xl bg-gradient-to-br from-[#2a1c14]/95 to-[#0f0a08]/95 border border-[#c89146]/40 p-4 md:p-5">
        <div className="text-[10px] tracking-[0.3em] uppercase text-[#c89146] font-bold text-center mb-2">
          Lá đã chọn · {chosen.length} / {numCards}
        </div>
        <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap min-h-[150px]">
          {Array.from({ length: numCards }).map((_, slotIdx) => {
            const drawn = chosen[slotIdx];
            if (!drawn) {
              return <EmptyTraySlot key={slotIdx} idx={slotIdx} />;
            }
            const card = getCardByIdOrThrow(drawn.cardId);
            return (
              <TrayCard
                key={`${drawn.cardId}-${slotIdx}`}
                card={card}
                reversed={drawn.reversed}
                idx={slotIdx}
              />
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-[#c8361d]/40 bg-[#c8361d]/10 p-3 text-[#c8361d] text-[13px] text-center">
          ⚠ {error}
        </div>
      )}

      {/* 78-card grid với dealing animation */}
      <div
        key={shuffleKey} // force remount để animation chạy lại khi tráo
        className="mt-6 grid gap-1 sm:gap-1.5 md:gap-2 justify-center"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(46px, 1fr))',
          maxWidth: '900px',
          margin: '24px auto 0',
        }}
      >
        {deck.map((card, i) => {
          const isChosen = chosenIds.has(card.id);
          return (
            <DeckCard
              key={`${shuffleKey}-${card.id}`}
              card={card}
              idx={i}
              chosen={isChosen}
              disabled={dealing || full || isChosen}
              onPick={onPick}
            />
          );
        })}
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={onReshuffle}
          className="px-5 py-2.5 rounded-full border border-[#4a6c7a]/55 bg-[#fbf3e2] text-[#4a6c7a] text-[13px] font-semibold hover:bg-[#e8eef2] transition"
        >
          ⟲ Tráo bài lại
        </button>
        {chosen.length > 0 && !full && (
          <button
            type="button"
            onClick={onUndoLast}
            className="px-5 py-2.5 rounded-full border border-[#c8361d]/40 bg-[#fbf3e2] text-[#c8361d] text-[13px] font-semibold hover:bg-[#fde8e5] transition"
          >
            ← Bỏ lá cuối
          </button>
        )}
      </div>

      {/* CSS animations */}
      <style jsx global>{`
        @keyframes deck-deal-in {
          0% {
            opacity: 0;
            transform: translate(-140px, -220px) rotate(-32deg) scale(0.55);
          }
          55% {
            opacity: 1;
            transform: translate(8px, -10px) rotate(4deg) scale(1.08);
          }
          80% {
            transform: translate(-2px, 2px) rotate(-1.5deg) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translate(0, 0) rotate(0) scale(1);
          }
        }
        @keyframes deck-fly-up {
          0% {
            transform: translateY(0) scale(1) rotateY(0);
            opacity: 1;
          }
          60% {
            opacity: 1;
          }
          100% {
            transform: translateY(-160px) scale(0.85) rotateY(180deg);
            opacity: 0;
          }
        }
        @keyframes tray-flip-in {
          0% {
            transform: rotateY(180deg) scale(0.7) translateY(-40px);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: rotateY(0deg) scale(1) translateY(0);
            opacity: 1;
          }
        }
        .deck-card {
          animation: deck-deal-in ${DEAL_DURATION_MS}ms cubic-bezier(0.25, 0.95, 0.35, 1.05) backwards;
          will-change: transform, opacity;
          transform-origin: center;
        }
        .deck-card.flying {
          animation: deck-fly-up 0.55s ease-out forwards;
          pointer-events: none;
        }
        .deck-card.gone {
          visibility: hidden;
        }
        .tray-card-anim {
          animation: tray-flip-in 0.7s ease-out backwards;
        }
      `}</style>
    </div>
  );
}

// 1 lá trong grid 78 — back-side, click để pick
function DeckCard({
  card,
  idx,
  chosen,
  disabled,
  onPick,
}: {
  card: TarotCard;
  idx: number;
  chosen: boolean;
  disabled: boolean;
  onPick: (card: TarotCard) => void;
}) {
  // 3 trạng thái:
  //  - idle: hiển thị back, click-able
  //  - flying: vừa được click → animation bay lên + lật (0.55s)
  //  - gone: chosen=true (đã thêm vào tray), ẩn visibility để giữ chỗ trong grid
  const [flying, setFlying] = useState(false);

  // Khi prop chosen flip từ false→true (do parent xử lý), trigger flying animation.
  // Local state chỉ để giữ animation chạy 1 lần.
  useEffect(() => {
    if (chosen && !flying) {
      setFlying(true);
    }
    if (!chosen && flying) {
      setFlying(false); // reset khi user undo
    }
  }, [chosen, flying]);

  function handleClick() {
    if (disabled) return;
    onPick(card);
  }

  const stage = chosen ? (flying ? 'flying' : 'gone') : 'idle';
  const className = `deck-card ${stage === 'flying' ? 'flying' : ''} ${stage === 'gone' ? 'gone' : ''}`;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={`Lá thứ ${idx + 1} (úp)`}
      className={`${className} block aspect-[2/3] rounded-md overflow-hidden ${
        disabled ? '' : 'hover:scale-110 hover:-translate-y-1 hover:z-10 transition-transform cursor-pointer'
      }`}
      style={{
        animationDelay: stage === 'idle' || stage === 'gone' ? `${idx * DEAL_STAGGER_MS}ms` : undefined,
      }}
    >
      <MiniCardBack />
    </button>
  );
}

// Mặt sau lá bài rút gọn cho grid (~50×75px)
function MiniCardBack() {
  return (
    <div className="w-full h-full rounded-md bg-gradient-to-br from-[#0f0a08] via-[#2a1c14] to-[#5a3a1a] border border-[#c89146]/80 relative overflow-hidden flex items-center justify-center">
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 50%, #c89146 0px, transparent 1.2px)',
          backgroundSize: '14px 14px',
        }}
      />
      <div
        className="relative text-[#c89146] text-base leading-none"
        style={{ fontFamily: SERIF_FONT }}
      >
        ✦
      </div>
      <div className="absolute inset-1 rounded-sm border border-[#c89146]/30 pointer-events-none" />
    </div>
  );
}

// Slot trống trong tray
function EmptyTraySlot({ idx }: { idx: number }) {
  return (
    <div className="flex flex-col items-center w-[70px] md:w-[88px]">
      <div className="w-[70px] h-[110px] md:w-[88px] md:h-[138px] rounded-lg border-2 border-dashed border-[#c89146]/35 bg-transparent flex items-center justify-center">
        <span className="text-[#c89146]/40 text-[10px] tracking-widest">#{idx + 1}</span>
      </div>
    </div>
  );
}

// Lá trong tray — đã lật, hiện front
function TrayCard({
  card,
  reversed,
  idx,
}: {
  card: TarotCard;
  reversed: boolean;
  idx: number;
}) {
  void idx;
  return (
    <div className="tray-card-anim flex flex-col items-center w-[70px] md:w-[88px]">
      <div className="w-[70px] h-[110px] md:w-[88px] md:h-[138px] rounded-lg overflow-hidden border-2 border-[#c89146] shadow-lg bg-[#fbf3e2]">
        <img
          src={getImageUrl(card)}
          alt={card.nameVi}
          loading="lazy"
          className="w-full h-full object-cover"
          style={reversed ? { transform: 'rotate(180deg)' } : undefined}
        />
      </div>
      <div
        className="mt-1 text-[10px] md:text-[11px] font-bold text-[#fbf3e2] text-center leading-tight max-w-full truncate"
        style={{ fontFamily: SERIF_FONT }}
        title={card.nameVi}
      >
        {card.nameVi}
      </div>
      {reversed && (
        <div className="text-[9px] uppercase tracking-wider text-[#e9b48a] font-bold">
          Ngược
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Submitting view

function SubmittingView({
  chosen,
  liveCharge,
}: {
  chosen: DrawnCard[];
  liveCharge: { delta: number; balanceVnd: number } | null;
}) {
  return (
    <div className="rounded-3xl border border-[#c89146]/55 bg-[#fbf3e2]/95 backdrop-blur-sm p-8 md:p-10 text-center">
      <div className="inline-flex items-center gap-3 text-[#5a3a1a]">
        <span className="inline-block w-3 h-3 rounded-full bg-[#c89146] animate-pulse" />
        <span className="text-[16px]">Đang luận giải trải bài…</span>
      </div>
      <p className="mt-3 text-[12.5px] text-[#7a6a52]">
        Hệ thống đang đọc {chosen.length} lá theo bối cảnh của bạn. Mất khoảng 15–30 giây.
      </p>
      {liveCharge && (
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#3a8a5e]/12 border border-[#3a8a5e]/35 text-[12.5px] animate-[fadeIn_0.3s_ease-out]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3a8a5e] animate-pulse" />
          <span className="text-[#2a6e48] font-semibold tabular-nums">
            Đã trừ {formatVnd(Math.abs(liveCharge.delta))}
          </span>
          <span className="text-[#4a3a30] tabular-nums">
            · Số dư còn {formatVnd(liveCharge.balanceVnd)}
          </span>
        </div>
      )}
      <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
        {chosen.map((c, i) => {
          const card = getCardByIdOrThrow(c.cardId);
          return (
            <div
              key={`${c.cardId}-${i}`}
              className="w-[56px] h-[88px] md:w-[64px] md:h-[100px] rounded-md overflow-hidden border border-[#c89146]/60 opacity-80"
            >
              <img
                src={getImageUrl(card)}
                alt={card.nameVi}
                loading="lazy"
                className="w-full h-full object-cover"
                style={c.reversed ? { transform: 'rotate(180deg)' } : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Result view (giữ flip animation cũ)

function ResultView(props: { result: TarotApiResponse; onStartOver: () => void }) {
  const { result, onStartOver } = props;
  const { reading, cards, field, question, numCards, chargedVnd, balanceVnd } = result;

  const [flippedCount, setFlippedCount] = useState(0);
  const allFlipped = flippedCount >= numCards;

  useEffect(() => {
    if (flippedCount >= numCards) return;
    const timer = setTimeout(() => setFlippedCount((c) => c + 1), 450);
    return () => clearTimeout(timer);
  }, [flippedCount, numCards]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[#c89146]/55 bg-[#fbf3e2]/95 backdrop-blur-sm p-6 md:p-8 text-center">
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
        {typeof chargedVnd === 'number' && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#3a8a5e]/12 border border-[#3a8a5e]/35 text-[12px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3a8a5e]" />
            <span className="text-[#2a6e48] font-semibold tabular-nums">
              Đã thanh toán {formatVnd(chargedVnd)}
            </span>
            {typeof balanceVnd === 'number' && (
              <span className="text-[#4a3a30] tabular-nums">
                · Còn lại {formatVnd(balanceVnd)}
              </span>
            )}
          </div>
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
            const flipped = i < flippedCount;
            const position = reading.perCard[i]?.position ?? `Vị trí ${i + 1}`;
            return (
              <FlippableCard
                key={`${drawn.cardId}-${i}`}
                card={card}
                reversed={drawn.reversed}
                position={position}
                flipped={flipped}
                idx={i}
              />
            );
          })}
        </div>
      </div>

      <div
        className={`transition-opacity duration-700 ${
          allFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <article className="rounded-3xl border border-[#c89146]/55 bg-[#fbf3e2]/95 p-6 md:p-8">
          <p
            className="text-[16.5px] md:text-[17.5px] italic leading-[1.7] text-[#5a3a1a]"
            style={{ fontFamily: SERIF_FONT }}
          >
            {reading.intro}
          </p>
        </article>

        <div className="mt-5 space-y-4">
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

        <article className="mt-5 rounded-3xl border border-[#5a3a1a]/45 bg-gradient-to-br from-[#fbf3e2] to-[#e9d4b6] p-6 md:p-8">
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
          <article className="mt-5 rounded-3xl border border-[#c8361d]/40 bg-[#fbf3e2]/95 p-6 md:p-8">
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

        <div className="mt-7 text-center flex items-center justify-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={onStartOver}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-[#5a3a1a] to-[#c89146] text-[#fbf3e2] font-bold text-[13px] tracking-wider uppercase shadow"
          >
            ↻ Rút trải bài mới
          </button>
          <Link
            href="/lich-su"
            className="px-6 py-3 rounded-full border border-[#4a6c7a]/55 bg-[#fbf3e2] text-[#4a6c7a] font-semibold text-[13px]"
          >
            Lịch sử Tarot →
          </Link>
        </div>
      </div>
    </div>
  );
}

function FlippableCard(props: {
  card: TarotCard;
  reversed: boolean;
  position: string;
  flipped: boolean;
  idx: number;
}) {
  const { card, reversed, position, flipped, idx } = props;
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-[110px] h-[180px] md:w-[130px] md:h-[210px]"
        style={{ perspective: '1000px' }}
      >
        <div
          className="absolute inset-0 transition-transform duration-700 ease-out"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          <div
            className="absolute inset-0 rounded-lg overflow-hidden border-2 border-[#c89146]"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <MiniCardBack />
          </div>
          <div
            className="absolute inset-0 rounded-lg overflow-hidden border-2 border-[#c89146] shadow-md bg-[#fbf3e2]"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <img
              src={getImageUrl(card)}
              alt={card.nameVi}
              loading="lazy"
              className="w-full h-full object-cover"
              style={reversed ? { transform: 'rotate(180deg)' } : undefined}
            />
          </div>
        </div>
      </div>
      <div className="mt-2 text-center min-h-[44px]">
        <div className="text-[10px] tracking-[0.18em] uppercase text-[#4a6c7a] font-bold">
          {idx + 1}. {position}
        </div>
        <div
          className="text-[12.5px] font-bold text-[#5a3a1a] leading-tight mt-0.5"
          style={{ fontFamily: SERIF_FONT }}
        >
          {flipped ? card.nameVi : '—'}
        </div>
        {flipped && reversed && (
          <div className="text-[10px] uppercase tracking-wider text-[#c8361d] font-bold">
            Ngược
          </div>
        )}
      </div>
    </div>
  );
}
