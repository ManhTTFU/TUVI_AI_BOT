"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { BatTuChart } from "@/lib/bat-tu";
import TuTruResultView from "./TuTruResultView";
import { toast } from "@/components/ui/toast";
import { formatVnd } from "@/lib/money";
import { emitOptimisticBalance } from "@/lib/wallet-sse";

const SERIF_FONT = "'Cormorant Garamond',serif";

type Gender = "male" | "female";

interface FormState {
  name: string;
  gender: Gender;
  year: string;
  month: string;
  day: string;
  /** Canh giờ index 0..11 (Tý=0..Hợi=11) — đồng bộ với form Tử Vi. */
  hour: number;
  birthPlace: string;
}

const CHI_TV = [
  "Tý",
  "Sửu",
  "Dần",
  "Mão",
  "Thìn",
  "Tỵ",
  "Ngọ",
  "Mùi",
  "Thân",
  "Dậu",
  "Tuất",
  "Hợi",
];

function FieldLabel({
  icon,
  children,
}: {
  icon: string;
  children: React.ReactNode;
}) {
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
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`h-[64px] rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-0.5 ${
              active
                ? "border-[#4a6c7a] bg-gradient-to-br from-[#f5e3c0] to-[#e9c98a]"
                : "border-[#4a6c7a]/30 bg-[#fbf3e2]/85 hover:border-[#4a6c7a]/55"
            }`}
          >
            <div
              className={`text-xl leading-none ${active ? "text-[#5a3a1a]" : "text-[#4a6c7a]"}`}
            >
              {o.icon}
            </div>
            <div className="text-[13px] font-semibold text-[#0f0a08]">
              {o.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function TruIntroCards() {
  const ROWS = [
    {
      name: "Năm Trụ",
      kanji: "年柱",
      desc: "Tổ tiên, ông bà, năm sinh và gốc rễ vận mệnh.",
    },
    {
      name: "Tháng Trụ",
      kanji: "月柱",
      desc: "Cha mẹ, thời niên thiếu, môi trường lớn lên.",
    },
    {
      name: "Ngày Trụ",
      kanji: "日柱",
      desc: "Bản thân (Nhật chủ) + người bạn đời (Chi ngày).",
    },
    {
      name: "Giờ Trụ",
      kanji: "時柱",
      desc: "Con cái, hậu vận, sự nghiệp cuối đời.",
    },
  ];
  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {ROWS.map((r) => (
        <div
          key={r.name}
          className="rounded-2xl border border-[#c89146]/45 bg-[#fbf3e2]/85 p-4"
        >
          <div
            className="text-[14px] font-serif text-[#5a3a1a]"
            style={{ fontFamily: SERIF_FONT }}
          >
            {r.name}
          </div>
          <div className="text-[11px] tracking-[0.2em] text-[#4a6c7a] mt-0.5">
            {r.kanji}
          </div>
          <p className="mt-3 text-[12.5px] text-[#0f0a08] leading-relaxed">
            {r.desc}
          </p>
        </div>
      ))}
    </section>
  );
}

export default function TuTruClient() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const [form, setForm] = useState<FormState>({
    name: "",
    gender: "male",
    year: "",
    month: "",
    day: "",
    hour: 6, // Ngọ (12-13h) làm mặc định
    birthPlace: "",
  });
  const [chart, setChart] = useState<BatTuChart | null>(null);
  const [chartId, setChartId] = useState<string | null>(null);
  const [chartMeta, setChartMeta] = useState<{
    name: string;
    gender: Gender;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insufficient, setInsufficient] = useState<{ balance: number; required: number } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInsufficient(null);

    if (!session?.user) {
      router.push("/dang-nhap?callbackUrl=/tu-tru-bat-tu");
      return;
    }

    const name = form.name.trim();
    if (!name) {
      setError("Vui lòng nhập họ và tên.");
      return;
    }
    const y = +form.year,
      m = +form.month,
      d = +form.day;
    if (!y || !m || !d) {
      setError("Vui lòng nhập đầy đủ Ngày / Tháng / Năm sinh.");
      return;
    }
    // Canh giờ index → giờ dân dụng (đại diện chính giữa canh): Tý=0, Sửu=2, ..., Hợi=22
    const civilHour = form.hour * 2;

    setLoading(true);
    setChart(null);
    setChartId(null);

    // Optimistic balance drop — đồng bộ với SSE thực ~200-500ms sau.
    const PRICE = 5000;
    const currentBalance = session?.user?.balanceVnd ?? 0;
    emitOptimisticBalance({
      balanceVnd: Math.max(0, currentBalance - PRICE),
      delta: -PRICE,
      reason: 'charge',
      service: 'tu-tru',
    });

    try {
      const res = await fetch("/api/tu-tru/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          gender: form.gender,
          year: y,
          month: m,
          day: d,
          hour: civilHour,
          minute: 0,
          birthPlace: form.birthPlace.trim(),
        }),
      });
      const body = await res.json();
      if (res.status === 402 && body?.code === "INSUFFICIENT_BALANCE") {
        await updateSession();
        setInsufficient({
          balance: Number(body.balanceVnd ?? 0),
          required: Number(body.requiredVnd ?? 5000),
        });
        toast.error("Số dư không đủ — nạp thêm để xem Tứ Trụ");
        return;
      }
      if (!res.ok || !body?.ok) {
        await updateSession();
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const c = body.chart as BatTuChart;
      setChart(c);
      setChartId(body.chartId);
      setChartMeta({ name: body.name, gender: body.gender });
      toast.success(
        typeof body.chargedVnd === "number"
          ? `Đã lập Tứ Trụ — trừ ${formatVnd(body.chargedVnd)}, còn lại ${formatVnd(body.balanceVnd ?? 0)}`
          : "Đã lập Tứ Trụ Bát Tự — đang chờ hệ thống luận giải",
      );
    } catch (err) {
      const msg = (err as Error).message;
      setError(`Không lập được Tứ Trụ: ${msg}`);
      toast.error(`Lập Tứ Trụ thất bại: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative text-[#0f0a08]">
      {/* HERO */}
      <section className="pt-12 pb-8 px-6 text-center">
        <Link
          href="/"
          className="inline-block text-[11px] tracking-[0.3em] text-[#4a6c7a] hover:text-[#5a3a1a] uppercase"
        >
          ← Trang chủ
        </Link>
        <div className="mt-4 inline-flex items-center gap-3 text-[11px] tracking-[0.4em] uppercase text-[#4a6c7a]">
          <span className="w-8 h-px bg-[#4a6c7a]/60" />
          四 柱 八 字 · Bát Tự
          <span className="w-8 h-px bg-[#4a6c7a]/60" />
        </div>
        <h1
          className="mt-4 font-serif text-[#0f0a08] leading-[0.95] text-[clamp(48px,7vw,96px)]"
          style={{ fontFamily: SERIF_FONT }}
        >
          Tứ Trụ <em className="text-[#5a3a1a]">Bát Tự</em>
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-[#4a3a30]">
          Lập 4 trụ Năm – Tháng – Ngày – Giờ theo Can Chi. Luận giải Nhật chủ,
          dụng thần, kỵ thần, ngũ hành nạp âm, sự nghiệp, tài lộc, tình duyên
          cá nhân hóa.
        </p>
      </section>

      {/* FORM */}
      <section className="px-6">
        <div className="max-w-2xl mx-auto rounded-3xl border border-[#4a6c7a]/45 bg-[#fbf3e2]/95 p-6 md:p-9 shadow-[0_30px_80px_-30px_rgba(90,58,26,0.3)]">
          <div className="text-center mb-6">
            <div className="text-[11px] tracking-[0.35em] uppercase text-[#4a6c7a] font-semibold">
              Nhập thông tin ngày giờ sinh
            </div>
            <div className="mt-1 text-[12.5px] text-[#4a3a30]">
              Giờ sinh càng chính xác (kèm phút) → Tứ Trụ càng đúng
            </div>
          </div>
          <form onSubmit={submit} className="space-y-5">
            <div>
              <FieldLabel icon="👤">Họ và tên</FieldLabel>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nhập tên của bạn"
                className="w-full h-11 px-4 rounded-xl border border-[#4a6c7a]/35 bg-[#fbf3e2] text-[#0f0a08] placeholder:text-[#7a6a52] focus:outline-none focus:border-[#4a6c7a] focus:ring-2 focus:ring-[#4a6c7a]/15 transition"
              />
            </div>

            <div>
              <FieldLabel icon="📍">Nơi sinh (không bắt buộc)</FieldLabel>
              <input
                value={form.birthPlace}
                onChange={(e) =>
                  setForm({ ...form, birthPlace: e.target.value })
                }
                placeholder="VD: TP. Hồ Chí Minh"
                className="w-full h-11 px-4 rounded-xl border border-[#4a6c7a]/35 bg-[#fbf3e2] text-[#0f0a08] placeholder:text-[#7a6a52] focus:outline-none focus:border-[#4a6c7a] focus:ring-2 focus:ring-[#4a6c7a]/15 transition"
              />
            </div>

            <div>
              <FieldLabel icon="⚥">Giới tính</FieldLabel>
              <SegmentChoice<Gender>
                value={form.gender}
                onChange={(v) => setForm({ ...form, gender: v })}
                options={[
                  { value: "male", label: "Nam", icon: "♂" },
                  { value: "female", label: "Nữ", icon: "♀" },
                ]}
              />
            </div>

            <div>
              <FieldLabel icon="📅">
                Ngày / Tháng / Năm sinh & Giờ sinh (dương lịch)
              </FieldLabel>
              <div className="grid grid-cols-3 sm:grid-cols-[1fr_1fr_1fr_1.6fr] gap-3">
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
                <select
                  value={form.hour}
                  onChange={(e) => setForm({ ...form, hour: +e.target.value })}
                  className="col-span-3 sm:col-span-1 h-11 px-3 rounded-xl border border-[#4a6c7a]/35 bg-[#fbf3e2] text-[#0f0a08] focus:outline-none focus:border-[#4a6c7a] focus:ring-2 focus:ring-[#4a6c7a]/15 transition appearance-none bg-no-repeat"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path fill='none' stroke='%236e4520' stroke-width='1.5' d='M1 1.5l5 5 5-5'/></svg>\")",
                    backgroundPosition: "right 14px center",
                    paddingRight: "36px",
                  }}
                >
                  {CHI_TV.map((c, i) => {
                    const start = String((23 + i * 2) % 24).padStart(2, "0");
                    const end = String((1 + i * 2) % 24).padStart(2, "0");
                    return (
                      <option key={i} value={i}>
                        Giờ {c} ({start}:00 – {end}:00)
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="mt-2 text-[11.5px] text-[#4a3a30]">
                Giờ Việt Nam (UTC+7). Không điều chỉnh giờ mặt trời.
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-[#c8361d]/40 bg-[#c8361d]/10 px-4 py-3 text-[#c8361d] text-[13px]">
                ⚠ {error}
              </div>
            )}

            {insufficient && (
              <div className="rounded-xl border border-[#c89146]/55 bg-[#f5e3c0]/50 px-4 py-3 text-[#5a3a1a] text-[13px] space-y-2">
                <div>
                  ⚠ <strong>Số dư không đủ.</strong> Cần{" "}
                  <strong>{formatVnd(insufficient.required)}</strong> cho 1 lần xem Tứ Trụ,
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

            <div className="rounded-xl border border-[#c89146]/55 bg-gradient-to-br from-[#f5e3c0]/40 to-[#fbf3e2]/60 px-4 py-3 text-[12.5px] text-[#4a3a30]">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <span className="text-[10px] tracking-[0.25em] uppercase font-bold">
                    Phí dịch vụ
                  </span>
                  <div className="text-[#0f0a08]">
                    Trừ <strong>{formatVnd(5_000)}</strong> mỗi lần xem Tứ Trụ Bát Tự
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
                  ? "Đang lập Tứ Trụ…"
                  : session?.user
                    ? "Xem Tứ Trụ Bát Tự"
                    : "Đăng nhập để xem Tứ Trụ"}
              </span>
            </button>
          </form>
        </div>
      </section>

      {/* 4 trụ intro cards — chỉ hiển thị khi chưa có kết quả */}
      {!chart && (
        <section className="mt-12 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-6">
              <div className="text-[11px] tracking-[0.4em] uppercase text-[#4a6c7a] font-semibold">
                Tổng quan
              </div>
              <h2
                className="mt-2 text-3xl font-serif text-[#0f0a08]"
                style={{ fontFamily: SERIF_FONT }}
              >
                4 Trụ trong <em className="text-[#5a3a1a]">Tứ Trụ Bát Tự</em>
              </h2>
            </div>
            <TruIntroCards />
          </div>
        </section>
      )}

      {/* RESULT */}
      {chart && chartId && chartMeta && (
        <section className="mt-12 px-6 pb-20">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6 flex items-center justify-end">
              <Link
                href="/lich-su"
                className="inline-flex items-center gap-1.5 text-[12px] text-[#4a6c7a] hover:text-[#5a3a1a]"
              >
                📜 Đã lưu vào lịch sử — xem tất cả lá số
              </Link>
            </div>
            <TuTruResultView
              chartId={chartId}
              chart={chart}
              name={chartMeta.name}
              gender={chartMeta.gender}
            />
          </div>
        </section>
      )}
    </div>
  );
}
