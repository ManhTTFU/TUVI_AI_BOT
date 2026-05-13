'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatVnd } from '@/lib/money';
import { formatProExpiry, daysRemaining, isLifetime, tierFromProUntil } from '@/lib/tier';
import { toast } from '@/components/ui/toast';
import { subscribeWallet } from '@/lib/wallet-sse';
import type { BankConfig, Plan } from '@tuvi/db';

const SERIF_FONT = "'Cormorant Garamond',serif";

type PlanInfo = {
  plan: Plan;
  amountVnd: number;
  durationDays: number | null;
  label: string;
  description: string | null;
  sortOrder: number;
};

type Tx = {
  id: string;
  type: string;
  status: string;
  amountVnd: number;
  bankRef: string | null;
  metadata?: any;
  createdAt: string;
};

const PLAN_BADGES: Record<Plan, { tag: string | null; color: string }> = {
  monthly: { tag: null, color: '#4a6c7a' },
  semi_annual: { tag: 'Tiết kiệm 17%', color: '#3a8a5e' },
  annual: { tag: 'Bán chạy', color: '#c89146' },
  lifetime: { tag: 'Trọn đời', color: '#c8361d' },
};

export default function WalletClient({
  initialProUntil,
  bank,
  plans,
  userName,
  userEmail,
}: {
  initialProUntil: string | null;
  bank: BankConfig | null;
  plans: PlanInfo[];
  userName: string;
  userEmail: string;
}) {
  const ckContent = (ref: string | null) =>
    [ref, userEmail].filter(Boolean).join(' ').trim();
  const [proUntil, setProUntil] = useState<string | null>(initialProUntil);
  const [pickedPlan, setPickedPlan] = useState<Plan | null>(null);
  const [pending, setPending] = useState<{ tx: Tx; plan: PlanInfo } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Tx[]>([]);

  const tier = tierFromProUntil(proUntil);
  const isPro = tier === 'PRO';
  const lifetime = isLifetime(proUntil);
  const days = daysRemaining(proUntil);

  useEffect(() => {
    const unsubscribe = subscribeWallet((event, data) => {
      if (event === 'subscription') {
        let wasPro = false;
        if (data && typeof data.proUntil === 'string') {
          setProUntil((prev) => {
            wasPro = tierFromProUntil(prev) === 'PRO';
            return data.proUntil;
          });
        }
        // setState updater chạy đồng bộ → wasPro đã có giá trị đúng tại đây.
        toast.success(
          wasPro
            ? 'Gói PRO của bạn đã được gia hạn!'
            : 'Tài khoản của bạn đã được nâng cấp lên gói PRO!',
        );
      }
      loadHistory();
    });
    return unsubscribe;
  }, []);

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/wallet/transactions');
      const data = await res.json();
      if (data.ok) setHistory(data.transactions);
    } catch {}
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const requestSubscription = async () => {
    if (!pickedPlan) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/wallet/topup-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: pickedPlan }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setPending({ tx: data.transaction, plan: data.plan });
      loadHistory();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-12 text-[#0f0a08]">
      <div className="max-w-4xl mx-auto">
        <h1
          className="text-4xl md:text-5xl font-serif italic"
          style={{ fontFamily: SERIF_FONT }}
        >
          Ví của tôi
        </h1>
        <p className="mt-2 text-[14px] text-[#4a3a30]">
          Đăng ký gói PRO để lập lá số tử vi không giới hạn
        </p>

        {/* Status card */}
        <div
          className={`mt-6 rounded-3xl p-6 md:p-8 shadow-[0_24px_60px_-30px_rgba(90,58,26,0.35)] ${
            isPro
              ? 'border border-[#c89146]/55 bg-gradient-to-br from-[#f5e3c0] to-[#e9c98a]'
              : 'border border-[#4a6c7a]/45 bg-[#fbf3e2]/96'
          }`}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <div className="text-[10px] tracking-[0.3em] uppercase text-[#4a3a30] font-semibold">
                Trạng thái tài khoản
              </div>
              <div
                className="mt-1 text-5xl font-serif italic text-[#5a3a1a] flex items-baseline gap-3 flex-wrap"
                style={{ fontFamily: SERIF_FONT }}
              >
                <span>{tier}</span>
                {isPro && lifetime && (
                  <span className="text-base not-italic text-[#c8361d] font-semibold">
                    · Trọn đời
                  </span>
                )}
              </div>
              <div className="mt-2 text-[14px] text-[#0f0a08]">{userName}</div>
              {isPro ? (
                lifetime ? (
                  <div className="mt-2 text-[14px] text-[#0f0a08]">
                    Truy cập <strong>vĩnh viễn</strong> các tính năng PRO.
                  </div>
                ) : (
                  <div className="mt-2 text-[14px] text-[#0f0a08]">
                    Hết hạn:{' '}
                    <strong className="text-[#5a3a1a]">{formatProExpiry(proUntil)}</strong>{' '}
                    · còn <strong className="text-[#c8361d]">{days}</strong> ngày
                  </div>
                )
              ) : (
                <div className="mt-2 text-[14px] text-[#4a3a30]">
                  Tài khoản NORMAL — cần đăng ký gói để dùng tính năng PRO.
                </div>
              )}
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3a8a5e]/15 border border-[#3a8a5e]/40">
              <span className="w-2 h-2 rounded-full bg-[#3a8a5e] animate-pulse" />
              <span className="text-[11px] tracking-[0.2em] font-bold uppercase text-[#2a6e48]">
                Realtime
              </span>
            </div>
          </div>
        </div>

        {/* Plan picker */}
        {!pending && !lifetime && (
          <div className="mt-6 rounded-3xl border border-[#4a6c7a]/45 bg-[#fbf3e2]/96 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">✦</span>
              <h2
                className="text-2xl font-serif text-[#0f0a08]"
                style={{ fontFamily: SERIF_FONT }}
              >
                {isPro ? 'Gia hạn / nâng cấp gói' : 'Chọn gói PRO'}
              </h2>
            </div>

            <p className="text-[13.5px] text-[#4a3a30] leading-relaxed mb-5">
              {isPro
                ? 'Bạn đang PRO. Mua thêm gói sẽ cộng dồn thời hạn vào gói hiện tại. Mua gói "Trọn đời" sẽ ghi đè và không bao giờ hết hạn.'
                : 'Tài khoản PRO mở khoá lập lá số tử vi không giới hạn (chart + 6 phần luận giải AI + đại hạn 12 vận + tiểu hạn 6 năm + luận giải 12 cung + luận năm hiện tại cá nhân hóa). Cứ mua gói là dùng đến khi hết hạn — KHÔNG mất phí thêm cho mỗi lá số.'}
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {plans.map((p) => {
                const active = pickedPlan === p.plan;
                const badge = PLAN_BADGES[p.plan];
                const perMonth =
                  p.durationDays && p.durationDays > 0
                    ? Math.round((p.amountVnd / (p.durationDays / 30)) / 1000) * 1000
                    : null;
                return (
                  <button
                    key={p.plan}
                    type="button"
                    onClick={() => setPickedPlan(p.plan)}
                    className={`relative text-left p-4 rounded-2xl border-2 transition ${
                      active
                        ? 'border-[#4a6c7a] bg-gradient-to-br from-[#f5e3c0] to-[#e9c98a] shadow-[0_8px_22px_-8px_rgba(74,108,122,0.5)]'
                        : 'border-[#4a6c7a]/30 bg-[#fbf3e2]/85 hover:border-[#4a6c7a]/55'
                    }`}
                  >
                    {badge.tag && (
                      <span
                        className="absolute -top-2 right-3 px-2 py-0.5 rounded-full text-[9px] tracking-wider font-bold uppercase"
                        style={{
                          background: badge.color,
                          color: '#fbf3e2',
                        }}
                      >
                        {badge.tag}
                      </span>
                    )}
                    <div className="text-[11px] tracking-[0.2em] uppercase text-[#4a3a30] font-semibold">
                      {p.label}
                    </div>
                    <div
                      className="mt-1 text-3xl font-serif italic text-[#5a3a1a]"
                      style={{ fontFamily: SERIF_FONT }}
                    >
                      {formatVnd(p.amountVnd)}
                    </div>
                    <div className="mt-1 text-[12px] text-[#0f0a08]">
                      {p.durationDays
                        ? `${p.durationDays} ngày`
                        : 'Vĩnh viễn — không hết hạn'}
                    </div>
                    {perMonth && (
                      <div className="mt-1 text-[11px] text-[#4a3a30]">
                        ≈ {formatVnd(perMonth)}/tháng
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="mb-3 rounded-xl border border-[#c8361d]/40 bg-[#c8361d]/10 px-4 py-2.5 text-[#c8361d] text-[13.5px]">
                ⚠ {error}
              </div>
            )}

            <button
              type="button"
              onClick={requestSubscription}
              disabled={!pickedPlan || submitting}
              className="w-full h-12 rounded-full bg-gradient-to-r from-[#5a3a1a] via-[#7a4a1f] to-[#c89146] text-[#fbf3e2] font-semibold tracking-wide hover:from-[#4a6c7a] hover:via-[#8a5520] hover:to-[#d4a05a] transition shadow-[0_10px_30px_-10px_rgba(90,58,26,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'Đang tạo lệnh thanh toán…'
                : pickedPlan
                  ? `Đăng ký ${plans.find((p) => p.plan === pickedPlan)?.label}`
                  : 'Chọn gói để tiếp tục'}
            </button>

            <p className="mt-3 text-[12px] text-[#4a3a30] leading-relaxed">
              Sau khi bấm, hệ thống sẽ sinh mã chuyển khoản. Bạn chuyển khoản theo
              thông tin hiển thị → admin xác nhận → tài khoản PRO được kích hoạt{' '}
              <strong>tức thời</strong> (realtime).
            </p>
          </div>
        )}

        {/* Pending instructions */}
        {pending && (
          <div className="mt-6 rounded-3xl border border-[#4a6c7a]/45 bg-[#fbf3e2]/96 p-6 md:p-8">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏦</span>
                <h2
                  className="text-2xl font-serif text-[#0f0a08]"
                  style={{ fontFamily: SERIF_FONT }}
                >
                  Chuyển khoản theo thông tin
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPending(null);
                  setPickedPlan(null);
                }}
                className="text-[12px] text-[#4a6c7a] hover:text-[#5a3a1a] underline"
              >
                Huỷ và chọn gói khác
              </button>
            </div>

            <div className="rounded-xl border border-[#c89146]/45 bg-[#f5e3c0]/40 px-4 py-3 mb-5 text-[#5a3a1a] text-[13.5px]">
              Bạn đang mua: <strong>{pending.plan.label}</strong> ·{' '}
              <strong>{formatVnd(pending.plan.amountVnd)}</strong> ·{' '}
              {pending.plan.durationDays
                ? `${pending.plan.durationDays} ngày`
                : 'Vĩnh viễn'}
            </div>

            <div className="grid md:grid-cols-[200px_1fr] gap-6 items-start">
              <div className="flex flex-col items-center gap-2">
                {bank?.qrImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={bank.qrImageUrl}
                    alt="QR chuyển khoản"
                    className="w-48 h-48 rounded-xl border border-[#4a6c7a]/30 bg-white p-2 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 rounded-xl border-2 border-dashed border-[#c89146]/55 flex items-center justify-center text-center text-[12px] text-[#4a3a30] p-3">
                    Admin chưa cấu hình QR
                  </div>
                )}
                <div className="text-[11px] tracking-[0.2em] uppercase text-[#4a3a30]">
                  Quét QR
                </div>
              </div>

              <div className="space-y-3 text-[14px]">
                <Row label="Ngân hàng" value={bank?.bankName || '—'} />
                <Row label="Số tài khoản" value={bank?.accountNumber || '—'} copy />
                <Row label="Chủ TK" value={bank?.accountHolder || '—'} />
                <Row
                  label="Số tiền"
                  value={formatVnd(pending.tx.amountVnd)}
                  copy
                  bold
                />
                <Row
                  label="Nội dung CK"
                  value={ckContent(pending.tx.bankRef)}
                  copy
                  bold
                  highlight
                />
                <p className="mt-3 text-[12.5px] leading-relaxed text-[#4a3a30] border-l-2 border-[#c89146] pl-3">
                  <strong>QUAN TRỌNG:</strong> Ghi đúng nội dung CK là{' '}
                  <code className="font-mono text-[#c8361d]">
                    {ckContent(pending.tx.bankRef)}
                  </code>
                  . Sau khi admin xác nhận, gói PRO sẽ kích hoạt và cộng vào hạn
                  hiện tại của bạn (cộng dồn).
                </p>
              </div>
            </div>
          </div>
        )}

        {lifetime && (
          <div className="mt-6 rounded-3xl border border-[#c8361d]/45 bg-gradient-to-br from-[#f5e3c0] to-[#fbf3e2]/95 p-6 md:p-8 text-center">
            <div className="text-4xl mb-2">♛</div>
            <h2
              className="text-2xl font-serif text-[#0f0a08]"
              style={{ fontFamily: SERIF_FONT }}
            >
              Bạn đang ở gói Trọn Đời
            </h2>
            <p className="mt-2 text-[14px] text-[#4a3a30]">
              Không cần gia hạn — truy cập vĩnh viễn các tính năng PRO. Cảm ơn
              bạn đã tin tưởng Diễn Cầm Tam Thế.
            </p>
            <Link
              href="/xem-tu-vi"
              className="mt-4 inline-block px-6 py-2.5 rounded-full bg-[#5a3a1a] text-[#fbf3e2] font-semibold text-[13px] hover:bg-[#4a6c7a]"
            >
              Lập lá số ngay →
            </Link>
          </div>
        )}

        {/* History */}
        <div className="mt-6 rounded-3xl border border-[#4a6c7a]/45 bg-[#fbf3e2]/96 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📜</span>
            <h2
              className="text-2xl font-serif text-[#0f0a08]"
              style={{ fontFamily: SERIF_FONT }}
            >
              Lịch sử giao dịch
            </h2>
          </div>
          {history.length === 0 ? (
            <p className="text-[14px] text-[#4a3a30] italic">
              Chưa có giao dịch nào.
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((tx) => (
                <TxRow key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  copy,
  bold,
  highlight,
}: {
  label: string;
  value: string;
  copy?: boolean;
  bold?: boolean;
  highlight?: boolean;
}) {
  const onCopy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
  };
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${
        highlight
          ? 'bg-[#c89146]/15 border border-[#c89146]/45'
          : 'bg-[#fbf3e2]/60 border border-[#4a6c7a]/20'
      }`}
    >
      <div className="text-[11px] tracking-[0.2em] uppercase text-[#4a3a30] font-semibold">
        {label}
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`truncate font-mono ${bold ? 'text-[15px] font-bold text-[#5a3a1a]' : 'text-[13.5px] text-[#0f0a08]'}`}
        >
          {value}
        </span>
        {copy && (
          <button
            type="button"
            onClick={onCopy}
            title="Copy"
            className="px-2 py-0.5 rounded text-[11px] tracking-wider uppercase font-semibold text-[#4a6c7a] hover:bg-[#fbf3e2] border border-[#4a6c7a]/30"
          >
            Copy
          </button>
        )}
      </div>
    </div>
  );
}

function TxRow({ tx }: { tx: Tx }) {
  const typeLabel: Record<string, string> = {
    topup: 'Nạp tiền (legacy)',
    charge: 'Sử dụng dịch vụ',
    refund: 'Hoàn tiền',
    admin_credit: 'Admin cộng tiền',
    subscription: 'Mua gói PRO',
    admin_extend: 'Admin gia hạn',
  };
  const statusLabel: Record<string, string> = {
    pending: 'Chờ duyệt',
    completed: 'Hoàn tất',
    rejected: 'Bị từ chối',
    cancelled: 'Đã huỷ',
  };
  const statusColor: Record<string, string> = {
    pending: '#c89146',
    completed: '#3a8a5e',
    rejected: '#c8361d',
    cancelled: '#4a3a30',
  };
  const c = statusColor[tx.status] ?? '#4a3a30';
  const planLabel =
    tx.metadata && typeof tx.metadata === 'object' && tx.metadata.label
      ? ` · ${tx.metadata.label}`
      : '';
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#4a6c7a]/25 bg-[#fbf3e2]/70 px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14px] font-semibold text-[#0f0a08]">
            {typeLabel[tx.type] ?? tx.type}
            {planLabel}
          </span>
          {tx.bankRef && (
            <code className="text-[11px] text-[#4a3a30] font-mono">
              {tx.bankRef}
            </code>
          )}
        </div>
        <div className="text-[12px] text-[#4a3a30]">
          {new Date(tx.createdAt).toLocaleString('vi-VN')}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="px-2.5 py-1 rounded-full text-[10px] tracking-[0.2em] uppercase font-bold"
          style={{
            background: c + '18',
            color: c,
            border: `1px solid ${c}55`,
          }}
        >
          {statusLabel[tx.status] ?? tx.status}
        </span>
        <span className="text-[15px] font-bold text-[#c8361d]">
          {formatVnd(tx.amountVnd)}
        </span>
      </div>
    </div>
  );
}
