'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ALL_SIGNS_VI, type SignVi } from '@/lib/horoscope-lib';
import { toast } from '@/components/ui/toast';

interface PersonalizedReading {
  personality: { strengths: string[]; weaknesses: string[]; thinkingStyle: string };
  love: { style: string; challenges: string; advice: string };
  career: { suitable: string[]; workStyle: string; opportunity: string };
  advice: { actions: string[] };
}

const SERIF_FONT = "'Cormorant Garamond',serif";

const ELEMENT_TONE: Record<string, { ring: string; chip: string }> = {
  Lửa: { ring: 'from-[#e9b48a] to-[#c8361d]', chip: 'text-[#c8361d] border-[#c8361d]/40 bg-[#c8361d]/8' },
  Đất: { ring: 'from-[#e9d4b6] to-[#c89146]', chip: 'text-[#5a3a1a] border-[#c89146]/45 bg-[#c89146]/10' },
  Khí: { ring: 'from-[#c9d8df] to-[#4a6c7a]', chip: 'text-[#4a6c7a] border-[#4a6c7a]/40 bg-[#4a6c7a]/8' },
  Nước: { ring: 'from-[#b8c4d0] to-[#2a3a4a]', chip: 'text-[#2a3a4a] border-[#2a3a4a]/40 bg-[#2a3a4a]/8' },
};

type Gender = 'male' | 'female';
type Status = 'single' | 'dating' | 'married' | 'divorced';
type Goal = 'career' | 'love' | 'wealth' | 'health' | 'study' | 'family';

const STATUS_LABEL: Record<Status, string> = {
  single: 'Độc thân',
  dating: 'Đang yêu',
  married: 'Đã kết hôn',
  divorced: 'Ly hôn / Goá',
};
const GOAL_LABEL: Record<Goal, string> = {
  career: 'Sự nghiệp',
  love: 'Tình cảm',
  wealth: 'Tài chính',
  health: 'Sức khỏe',
  study: 'Học hành',
  family: 'Gia đình',
};

const VALID_GENDER: Gender[] = ['male', 'female'];
const VALID_STATUS: Status[] = ['single', 'dating', 'married', 'divorced'];
const VALID_GOAL: Goal[] = ['career', 'love', 'wealth', 'health', 'study', 'family'];

export default function LuanGiaiClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [reading, setReading] = useState<PersonalizedReading | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proRequired, setProRequired] = useState(false);

  const input = useMemo(() => {
    const signEn = params.get('sign') ?? '';
    const gender = params.get('gender') as Gender | null;
    const status = params.get('status') as Status | null;
    const goal = params.get('goal') as Goal | null;
    const sign = ALL_SIGNS_VI.find((s) => s.en === signEn) ?? null;
    if (
      !sign ||
      !gender || !VALID_GENDER.includes(gender) ||
      !status || !VALID_STATUS.includes(status) ||
      !goal || !VALID_GOAL.includes(goal)
    ) {
      return null;
    }
    return { sign, gender, status, goal } as {
      sign: SignVi; gender: Gender; status: Status; goal: Goal;
    };
  }, [params]);

  useEffect(() => {
    if (!input) {
      setLoading(false);
      setError('Tham số không hợp lệ. Quay lại trang Hoàng Đạo để nhập lại.');
      return;
    }
    let aborted = false;
    setLoading(true);
    setReading(null);
    setError(null);
    setProRequired(false);
    fetch('/api/horoscope/personalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signEn: input.sign.en,
        gender: input.gender,
        status: input.status,
        goal: input.goal,
      }),
    })
      .then(async (res) => {
        const body = await res.json();
        if (aborted) return;
        if (res.status === 402 && body?.code === 'PRO_REQUIRED') {
          setProRequired(true);
          return;
        }
        if (res.status === 401) {
          router.push(`/dang-nhap?callbackUrl=${encodeURIComponent('/hoang-dao')}`);
          return;
        }
        if (!res.ok || !body?.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
        setReading(body.reading as PersonalizedReading);
        toast.success('Đã luận giải xong');
      })
      .catch((e: Error) => {
        if (aborted) return;
        setError(e.message);
        toast.error(`Lỗi luận giải: ${e.message}`);
      })
      .finally(() => {
        if (!aborted) setLoading(false);
      });
    return () => {
      aborted = true;
    };
  }, [input, router]);

  if (!input) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center text-[#0f0a08]">
        <h1 className="text-2xl font-serif" style={{ fontFamily: SERIF_FONT }}>
          Tham số không hợp lệ
        </h1>
        <p className="mt-3 text-[14px] text-[#4a3a30]">
          {error ?? 'Vui lòng quay lại trang Hoàng Đạo để điền form.'}
        </p>
        <Link
          href="/hoang-dao"
          className="inline-block mt-6 px-6 py-2.5 rounded-full bg-[#5a3a1a] text-[#fbf3e2] hover:bg-[#4a6c7a] text-[13px] font-semibold"
        >
          ← Về trang Hoàng Đạo
        </Link>
      </div>
    );
  }

  const tone = ELEMENT_TONE[input.sign.el] ?? ELEMENT_TONE.Đất;

  return (
    <div className="text-[#0f0a08]">
      {/* Breadcrumb */}
      <section className="px-6 pt-10">
        <div className="max-w-3xl mx-auto text-[12px] text-[#4a3a30]">
          <Link href="/" className="hover:text-[#5a3a1a] transition">
            Trang chủ
          </Link>
          <span className="mx-2 text-[#c89146]">›</span>
          <Link href="/hoang-dao" className="hover:text-[#5a3a1a] transition">
            12 Cung Hoàng Đạo
          </Link>
          <span className="mx-2 text-[#c89146]">›</span>
          <span className="text-[#5a3a1a] font-medium">Luận giải cá nhân</span>
        </div>
      </section>

      <section className="px-6 pt-8 pb-20">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Sign header */}
          <div className="rounded-3xl border border-[#c89146]/55 bg-[#fbf3e2]/95 backdrop-blur-sm p-6 md:p-8 text-center shadow-[0_24px_60px_-30px_rgba(90,58,26,0.35)]">
            <div className="text-[11px] tracking-[0.4em] uppercase text-[#4a6c7a] font-semibold">
              Cung của bạn
            </div>
            <div
              className={`mx-auto mt-3 w-20 h-20 rounded-2xl bg-gradient-to-br ${tone.ring} border border-[#c89146]/60 flex items-center justify-center text-[#fbf3e2] text-4xl shadow-inner`}
            >
              {input.sign.sym}
            </div>
            <h1
              className="mt-4 text-4xl md:text-5xl font-serif italic text-[#0f0a08]"
              style={{ fontFamily: SERIF_FONT }}
            >
              {input.sign.name}
            </h1>
            <div className="mt-1 text-[12px] tracking-[0.3em] uppercase text-[#4a3a30]">
              {input.sign.en} · {input.sign.range}
            </div>
            <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-[11px] tracking-[0.2em] uppercase font-bold border ${tone.chip}`}
              >
                {input.sign.el}
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] tracking-[0.2em] uppercase font-semibold border border-[#4a6c7a]/40 bg-[#4a6c7a]/8 text-[#4a6c7a]">
                {input.gender === 'male' ? 'Nam' : 'Nữ'}
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] tracking-[0.2em] uppercase font-semibold border border-[#c89146]/55 bg-[#c89146]/10 text-[#5a3a1a]">
                {STATUS_LABEL[input.status]}
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] tracking-[0.2em] uppercase font-semibold border border-[#c8361d]/40 bg-[#c8361d]/8 text-[#c8361d]">
                Mục tiêu: {GOAL_LABEL[input.goal]}
              </span>
            </div>
          </div>

          {/* States */}
          {loading && (
            <div className="rounded-2xl border border-[#c89146]/45 bg-[#fbf3e2]/85 p-6 md:p-8 text-center text-[#4a3a30]">
              <div className="inline-flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#c89146] animate-pulse" />
                Hệ thống đang luận giải cá nhân hóa theo bối cảnh của bạn…
              </div>
              <div className="mt-1 text-[12px] text-[#7a6a52]">
                Mất khoảng 15–30 giây.
              </div>
            </div>
          )}

          {proRequired && (
            <div className="rounded-2xl border border-[#c89146]/55 bg-[#f5e3c0]/50 p-5 text-[#5a3a1a] text-[13.5px] space-y-2">
              <div>
                ⚠ <strong>Cần tài khoản PRO.</strong> Đăng ký gói (từ 20.000đ/tháng)
                để xem luận giải cá nhân không giới hạn.
              </div>
              <Link
                href="/vi-cua-toi"
                className="inline-block px-4 py-1.5 rounded-full bg-[#5a3a1a] text-[#fbf3e2] text-[12px] font-semibold hover:bg-[#4a6c7a]"
              >
                Đăng ký gói PRO →
              </Link>
            </div>
          )}

          {error && !proRequired && (
            <div className="rounded-2xl border border-[#c8361d]/40 bg-[#c8361d]/10 p-4 text-[#c8361d] text-[13.5px]">
              ⚠ {error}
            </div>
          )}

          {reading && (
            <article className="rounded-2xl border border-[#c89146]/55 bg-[#fbf3e2]/95 p-6 md:p-10 shadow-[0_20px_60px_-30px_rgba(90,58,26,0.3)] space-y-8">
              <PersonalizedView data={reading} statusLabel={STATUS_LABEL[input.status]} goalLabel={GOAL_LABEL[input.goal]} />
            </article>
          )}

          <div className="text-center">
            <Link
              href="/hoang-dao"
              className="inline-flex items-center gap-2 text-[13px] text-[#4a6c7a] hover:text-[#5a3a1a]"
            >
              ← Luận giải cho bối cảnh khác
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function PersonalizedView({
  data,
  statusLabel,
  goalLabel,
}: {
  data: PersonalizedReading;
  statusLabel: string;
  goalLabel: string;
}) {
  return (
    <div className="space-y-8 text-[#0f0a08]">
      <Section title="1. Tính cách cốt lõi">
        <BulletGroup label="Điểm mạnh nổi bật" items={data.personality.strengths} tone="strong" />
        <BulletGroup label="Điểm yếu cần cải thiện" items={data.personality.weaknesses} tone="weak" />
        <Paragraph label="Lối suy nghĩ & ra quyết định" text={data.personality.thinkingStyle} />
      </Section>

      <Section title="2. Tình yêu & mối quan hệ">
        <Paragraph label="Phong cách yêu" text={data.love.style} />
        <Paragraph label="Điểm dễ gặp vấn đề" text={data.love.challenges} />
        <Paragraph label={`Lời khuyên cho người ${statusLabel}`} text={data.love.advice} />
      </Section>

      <Section title="3. Sự nghiệp & tài chính">
        <BulletGroup label="Công việc / ngành nghề phù hợp" items={data.career.suitable} tone="strong" />
        <Paragraph label="Phong cách làm việc" text={data.career.workStyle} />
        <Paragraph label="Cơ hội 6-12 tháng tới" text={data.career.opportunity} />
      </Section>

      <Section title={`4. Lời khuyên cho mục tiêu: ${goalLabel}`}>
        <BulletGroup label="Hành động cụ thể trong 1-3 tháng tới" items={data.advice.actions} tone="strong" />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2
        className="text-[20px] md:text-[22px] font-serif italic text-[#5a3a1a] border-b border-[#c89146]/40 pb-2"
        style={{ fontFamily: SERIF_FONT }}
      >
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Paragraph({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <div>
      <div className="text-[11px] tracking-[0.25em] uppercase font-bold text-[#4a6c7a] mb-1.5">
        {label}
      </div>
      <p className="text-[14.5px] leading-[1.75] text-[#2a1c14]">{text}</p>
    </div>
  );
}

function BulletGroup({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: 'strong' | 'weak';
}) {
  if (!items.length) return null;
  const dotColor = tone === 'strong' ? '#c89146' : '#c8361d';
  return (
    <div>
      <div className="text-[11px] tracking-[0.25em] uppercase font-bold text-[#4a6c7a] mb-1.5">
        {label}
      </div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2.5 text-[14.5px] leading-[1.7] text-[#2a1c14]">
            <span className="font-bold mt-[2px]" style={{ color: dotColor }}>•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
