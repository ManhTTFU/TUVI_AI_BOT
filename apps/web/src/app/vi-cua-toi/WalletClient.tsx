'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatVnd } from '@/lib/money';
import { toast } from '@/components/ui/toast';
import { subscribeWallet } from '@/lib/wallet-sse';
import Pagination from '@/components/Pagination';
import type { BankConfig } from '@tuvi/db';

const SERIF_FONT = "'Cormorant Garamond',serif";

type Tx = {
  id: string;
  type: string;
  status: string;
  amountVnd: number;
  bankRef: string | null;
  metadata?: any;
  note?: string | null;
  createdAt: string;
};

const QUICK_AMOUNTS = [20_000, 50_000, 100_000, 200_000, 500_000, 1_000_000];

export default function WalletClient({
  initialBalance,
  bank,
  userName,
  userEmail,
  minTopup,
  readingPrice,
}: {
  initialBalance: number;
  bank: BankConfig | null;
  userName: string;
  userEmail: string;
  minTopup: number;
  readingPrice: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [balance, setBalance] = useState<number>(initialBalance);
  const [amountInput, setAmountInput] = useState<string>(String(minTopup));
  const [pending, setPending] = useState<Tx | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Tx[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);

  // Pagination từ URL — page/size search params. Default page=1, size=10.
  const page = Math.max(1, parseInt(params.get('page') ?? '1') || 1);
  const size = clamp(parseInt(params.get('size') ?? '10') || 10, 10, 100);

  const ckContent = (ref: string | null) =>
    [ref, userEmail].filter(Boolean).join(' ').trim();

  const amountVnd = useMemo(() => {
    const n = Number(amountInput.replace(/\D/g, ''));
    return Number.isFinite(n) ? n : 0;
  }, [amountInput]);

  const amountValid = amountVnd >= minTopup;
  const readingsCovered = Math.floor(amountVnd / readingPrice);
  const balanceReadings = Math.floor(balance / readingPrice);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/wallet/transactions?page=${page}&size=${size}`);
      const data = await res.json();
      if (data.ok) {
        setHistory(data.transactions);
        setHistoryTotal(data.total ?? 0);
      }
    } catch {}
  }, [page, size]);

  // Fresh balance trên mount + khi tab trở lại foreground — chống Next.js router
  // cache serve RSC payload cũ + chống case Supabase WS dropped khi tab nền.
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      fetch('/api/wallet/balance')
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled && typeof d?.balanceVnd === 'number') setBalance(d.balanceVnd);
        })
        .catch(() => {});
    };
    refresh();
    const onVis = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeWallet((event, data) => {
      if (event === 'balance') {
        setBalance(data.balanceVnd);
        if (data.reason === 'topup' && data.delta > 0) {
          toast.success(`Đã nạp ${formatVnd(data.delta)} vào ví`);
        } else if (data.reason === 'admin_credit' && data.delta > 0) {
          toast.success(`Admin tặng ${formatVnd(data.delta)} vào ví`);
        } else if (data.reason === 'refund' && data.delta > 0) {
          toast.success(`Hoàn ${formatVnd(data.delta)} về ví`);
        }
        // Sự kiện mới (charge/topup/credit) → nhảy về trang 1 để user thấy ngay.
        if (page !== 1) {
          const np = new URLSearchParams(params);
          np.set('page', '1');
          router.push(`${pathname}?${np.toString()}`);
        } else {
          loadHistory();
        }
      } else {
        loadHistory();
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, loadHistory]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const requestTopup = async () => {
    if (!amountValid) {
      setError(`Số tiền tối thiểu ${formatVnd(minTopup)}`);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/wallet/topup-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountVnd }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setPending(data.transaction);
      loadHistory();
      toast.success('Đã tạo lệnh nạp — chuyển khoản theo thông tin bên dưới');
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      toast.error(`Tạo lệnh nạp thất bại: ${msg}`);
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
          Nạp tối thiểu {formatVnd(minTopup)} · Mỗi lần luận giải{' '}
          <strong>{formatVnd(readingPrice)}</strong>
        </p>

        {/* Balance card */}
        <div className="mt-6 rounded-3xl p-6 md:p-8 shadow-[0_24px_60px_-30px_rgba(90,58,26,0.35)] border border-[#c89146]/55 bg-gradient-to-br from-[#f5e3c0] to-[#e9c98a]">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <div className="text-[10px] tracking-[0.3em] uppercase text-[#4a3a30] font-semibold">
                Số dư ví
              </div>
              <div
                className="mt-1 text-5xl md:text-6xl font-serif italic text-[#5a3a1a]"
                style={{ fontFamily: SERIF_FONT }}
              >
                {formatVnd(balance)}
              </div>
              <div className="mt-2 text-[14px] text-[#0f0a08]">{userName}</div>
              <div className="mt-1 text-[13px] text-[#4a3a30]">
                Tương đương <strong className="text-[#5a3a1a]">{balanceReadings}</strong>{' '}
                lần luận giải
                {balance > 0 && balance % readingPrice > 0
                  ? ` (dư ${formatVnd(balance % readingPrice)})`
                  : ''}
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3a8a5e]/15 border border-[#3a8a5e]/40">
              <span className="w-2 h-2 rounded-full bg-[#3a8a5e] animate-pulse" />
              <span className="text-[11px] tracking-[0.2em] font-bold uppercase text-[#2a6e48]">
                Realtime
              </span>
            </div>
          </div>

          {balance < readingPrice && (
            <div className="mt-4 rounded-xl border border-[#c8361d]/40 bg-[#c8361d]/10 px-4 py-2.5 text-[#c8361d] text-[13.5px]">
              ⚠ Số dư không đủ cho 1 lần luận giải. Nạp ngay để dùng.
            </div>
          )}
        </div>

        {/* Topup form */}
        {!pending && (
          <div className="mt-6 rounded-3xl border border-[#4a6c7a]/45 bg-[#fbf3e2]/96 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">✦</span>
              <h2
                className="text-2xl font-serif text-[#0f0a08]"
                style={{ fontFamily: SERIF_FONT }}
              >
                Nạp tiền vào ví
              </h2>
            </div>

            <p className="text-[13.5px] text-[#4a3a30] leading-relaxed mb-5">
              Nhập số tiền muốn nạp (tối thiểu{' '}
              <strong>{formatVnd(minTopup)}</strong>). Mỗi lần luận giải{' '}
              <strong>{formatVnd(readingPrice)}</strong>, trừ ngay khi xem. Không
              có giới hạn thời gian, tiêu hết thì nạp tiếp.
            </p>

            <label className="block text-[11px] tracking-[0.2em] uppercase text-[#4a3a30] font-semibold mb-2">
              Số tiền (VND)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
              {QUICK_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmountInput(String(a))}
                  className={`px-2 py-2 rounded-xl text-[12.5px] font-semibold border-2 transition ${
                    amountVnd === a
                      ? 'border-[#5a3a1a] bg-gradient-to-br from-[#f5e3c0] to-[#e9c98a] text-[#5a3a1a]'
                      : 'border-[#4a6c7a]/30 bg-[#fbf3e2]/85 hover:border-[#4a6c7a]/55 text-[#0f0a08]'
                  }`}
                >
                  {formatVnd(a)}
                </button>
              ))}
            </div>
            <input
              type="text"
              inputMode="numeric"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value.replace(/\D/g, ''))}
              placeholder={`Tối thiểu ${minTopup}`}
              className="w-full h-12 px-4 rounded-2xl border border-[#4a6c7a]/35 bg-[#fbf3e2] text-[#0f0a08] text-lg font-mono focus:outline-none focus:border-[#4a6c7a] focus:ring-2 focus:ring-[#4a6c7a]/15 transition"
            />

            {amountVnd > 0 && (
              <div className="mt-2 text-[12.5px] text-[#4a3a30]">
                {amountValid ? (
                  <>
                    Sau khi nạp:{' '}
                    <strong className="text-[#3a8a5e]">
                      {formatVnd(balance + amountVnd)}
                    </strong>{' '}
                    · đủ cho{' '}
                    <strong className="text-[#5a3a1a]">
                      {Math.floor((balance + amountVnd) / readingPrice)} lần
                    </strong>{' '}
                    luận giải (riêng đợt nạp này {readingsCovered} lần).
                  </>
                ) : (
                  <span className="text-[#c8361d]">
                    Tối thiểu {formatVnd(minTopup)}.
                  </span>
                )}
              </div>
            )}

            {error && (
              <div className="mt-3 rounded-xl border border-[#c8361d]/40 bg-[#c8361d]/10 px-4 py-2.5 text-[#c8361d] text-[13.5px]">
                ⚠ {error}
              </div>
            )}

            <button
              type="button"
              onClick={requestTopup}
              disabled={!amountValid || submitting}
              className="mt-4 w-full h-12 rounded-full bg-gradient-to-r from-[#5a3a1a] via-[#7a4a1f] to-[#c89146] text-[#fbf3e2] font-semibold tracking-wide hover:from-[#4a6c7a] hover:via-[#8a5520] hover:to-[#d4a05a] transition shadow-[0_10px_30px_-10px_rgba(90,58,26,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'Đang tạo lệnh nạp…'
                : `Tạo lệnh nạp ${amountValid ? formatVnd(amountVnd) : ''}`}
            </button>

            <p className="mt-3 text-[12px] text-[#4a3a30] leading-relaxed">
              Sau khi bấm, hệ thống sinh mã chuyển khoản. Bạn chuyển khoản với
              nội dung CK đúng mã → admin xác nhận → số dư cộng vào ví{' '}
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
                onClick={() => setPending(null)}
                className="text-[12px] text-[#4a6c7a] hover:text-[#5a3a1a] underline"
              >
                Tạo lệnh khác
              </button>
            </div>

            <div className="rounded-xl border border-[#c89146]/45 bg-[#f5e3c0]/40 px-4 py-3 mb-5 text-[#5a3a1a] text-[13.5px]">
              Đang chờ nạp: <strong>{formatVnd(pending.amountVnd)}</strong> ·
              tương đương{' '}
              <strong>{Math.floor(pending.amountVnd / readingPrice)} lần luận giải</strong>
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
                  value={formatVnd(pending.amountVnd)}
                  copy
                  bold
                />
                <Row
                  label="Nội dung CK"
                  value={ckContent(pending.bankRef)}
                  copy
                  bold
                  highlight
                />
                <p className="mt-3 text-[12.5px] leading-relaxed text-[#4a3a30] border-l-2 border-[#c89146] pl-3">
                  <strong>QUAN TRỌNG:</strong> Ghi đúng nội dung CK{' '}
                  <code className="font-mono text-[#c8361d]">
                    {ckContent(pending.bankRef)}
                  </code>
                  . Sau khi admin xác nhận, số dư sẽ cộng tức thời vào ví của bạn.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        <div className="mt-6 rounded-3xl border border-[#4a6c7a]/45 bg-[#fbf3e2]/96 p-6 md:p-8">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📜</span>
              <h2
                className="text-2xl font-serif text-[#0f0a08]"
                style={{ fontFamily: SERIF_FONT }}
              >
                Lịch sử giao dịch
              </h2>
            </div>
            {historyTotal > 0 && (
              <span className="text-[12px] text-[#4a3a30]">
                Tổng <strong className="text-[#5a3a1a] tabular-nums">{historyTotal}</strong> giao dịch
              </span>
            )}
          </div>
          {historyTotal === 0 ? (
            <p className="text-[14px] text-[#4a3a30] italic">
              Chưa có giao dịch nào.{' '}
              <Link
                href="/xem-tu-vi"
                className="text-[#4a6c7a] hover:text-[#5a3a1a] underline"
              >
                Bắt đầu xem Tử Vi
              </Link>
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {history.map((tx) => (
                  <TxRow key={tx.id} tx={tx} />
                ))}
              </div>
              <Pagination page={page} pageSize={size} total={historyTotal} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
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

const SERVICE_VN: Record<string, string> = {
  'tu-vi': 'Tử Vi',
  'tu-tru': 'Tứ Trụ',
  tarot: 'Tarot',
  'hoang-dao': 'Hoàng Đạo',
};

function chargeLabel(meta: any): string {
  const service = meta?.service;
  if (typeof service === 'string' && SERVICE_VN[service]) {
    return `Luận giải ${SERVICE_VN[service]}`;
  }
  return 'Luận giải';
}

function TxRow({ tx }: { tx: Tx }) {
  const isCharge = tx.type === 'charge';
  const isCredit = tx.amountVnd > 0;

  const typeLabel: Record<string, string> = {
    topup: 'Nạp tiền',
    charge: chargeLabel(tx.metadata),
    refund: 'Hoàn tiền',
    admin_credit: isCredit ? 'Admin cộng tiền' : 'Admin trừ tiền',
    // Legacy (model PRO cũ — sẽ không tạo mới nữa):
    subscription: 'Mua gói PRO (cũ)',
    admin_extend: 'Admin gia hạn (cũ)',
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

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#4a6c7a]/25 bg-[#fbf3e2]/70 px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14px] font-semibold text-[#0f0a08]">
            {typeLabel[tx.type] ?? tx.type}
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
        <span
          className={`text-[15px] font-bold ${
            isCharge || tx.amountVnd < 0 ? 'text-[#c8361d]' : 'text-[#3a8a5e]'
          }`}
        >
          {isCharge || tx.amountVnd < 0 ? '' : '+'}
          {formatVnd(tx.amountVnd)}
        </span>
      </div>
    </div>
  );
}
