'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { formatVnd } from '@/lib/money';
import { toast } from '@/components/ui/toast';
import Pagination from '@/components/Pagination';

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: 'user' | 'admin';
  balanceVnd: number;
  createdAt: string;
};

const QUICK_AMOUNTS = [20_000, 50_000, 100_000, 200_000, 500_000];

export default function UsersClient({
  initialUsers,
  page,
  pageSize,
  total,
  searchQuery,
}: {
  initialUsers: AdminUser[];
  page: number;
  pageSize: number;
  total: number;
  searchQuery: string;
}) {
  const { data: session } = useSession();
  const meId = session?.user?.id ?? '';
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Hiển thị `initialUsers` trực tiếp từ server (đã filter + paginate).
  // Mutation (credit/debit/role) update array tại chỗ — không cần reload toàn page.
  const [usersList, setUsersList] = useState(initialUsers);
  useEffect(() => setUsersList(initialUsers), [initialUsers]);

  // Search input — debounce 350ms rồi push URL, server re-fetch.
  const [query, setQuery] = useState(searchQuery);
  useEffect(() => {
    if (query === searchQuery) return;
    const t = setTimeout(() => {
      const np = new URLSearchParams(params);
      if (query.trim()) np.set('q', query.trim());
      else np.delete('q');
      np.set('page', '1');
      startTransition(() => router.push(`${pathname}?${np.toString()}`));
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const [error, setError] = useState<string | null>(null);
  const [busyRole, setBusyRole] = useState<string | null>(null);

  const [creditFor, setCreditFor] = useState<AdminUser | null>(null);
  const [creditAmount, setCreditAmount] = useState<string>('20000');
  const [creditNote, setCreditNote] = useState('');
  const [creditBusy, setCreditBusy] = useState(false);

  const [debitFor, setDebitFor] = useState<AdminUser | null>(null);
  const [debitAmount, setDebitAmount] = useState<string>('0');
  const [debitNote, setDebitNote] = useState('');
  const [debitBusy, setDebitBusy] = useState(false);

  const submitCredit = async () => {
    if (!creditFor) return;
    const amount = Number(creditAmount);
    if (!Number.isInteger(amount) || amount <= 0) {
      setError('Số tiền không hợp lệ');
      return;
    }
    // Optimistic: update row + đóng modal NGAY, không đợi server. API round-trip
    // Neon DB ~200-500ms → user cảm thấy "lâu" nếu chờ. Pattern này khớp với
    // optimistic UI ở client charge (xem TarotClient/TuviClient).
    const target = creditFor;
    const oldBalance = target.balanceVnd;
    const optimisticBalance = oldBalance + amount;
    const note = creditNote || null;

    setUsersList((prev) =>
      prev.map((u) => (u.id === target.id ? { ...u, balanceVnd: optimisticBalance } : u)),
    );
    setCreditFor(null);
    setCreditAmount('20000');
    setCreditNote('');
    setError(null);
    setCreditBusy(true);
    toast.success(`Đã cộng ${formatVnd(amount)} cho ${target.email}`);

    try {
      const res = await fetch('/api/admin/users/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: target.id, amountVnd: amount, note }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      // Sync số dư thật từ server (phòng trường hợp concurrent change từ tab khác).
      setUsersList((prev) =>
        prev.map((u) => (u.id === target.id ? { ...u, balanceVnd: data.balanceVnd } : u)),
      );
    } catch (e) {
      // Revert optimistic
      setUsersList((prev) =>
        prev.map((u) => (u.id === target.id ? { ...u, balanceVnd: oldBalance } : u)),
      );
      toast.error(`Cộng tiền thất bại: ${(e as Error).message}`);
    } finally {
      setCreditBusy(false);
    }
  };

  const submitDebit = async () => {
    if (!debitFor) return;
    const amount = Number(debitAmount);
    if (!Number.isInteger(amount) || amount <= 0) {
      setError('Số tiền không hợp lệ');
      return;
    }
    if (amount > debitFor.balanceVnd) {
      setError(`User chỉ còn ${formatVnd(debitFor.balanceVnd)} — không trừ quá số dư`);
      return;
    }
    const target = debitFor;
    const oldBalance = target.balanceVnd;
    const optimisticBalance = oldBalance - amount;
    const note = debitNote || null;

    setUsersList((prev) =>
      prev.map((u) => (u.id === target.id ? { ...u, balanceVnd: optimisticBalance } : u)),
    );
    setDebitFor(null);
    setDebitAmount('0');
    setDebitNote('');
    setError(null);
    setDebitBusy(true);
    toast.success(`Đã trừ ${formatVnd(amount)} của ${target.email}`);

    try {
      const res = await fetch('/api/admin/users/revoke-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: target.id, amountVnd: amount, note }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setUsersList((prev) =>
        prev.map((u) => (u.id === target.id ? { ...u, balanceVnd: data.balanceVnd } : u)),
      );
    } catch (e) {
      setUsersList((prev) =>
        prev.map((u) => (u.id === target.id ? { ...u, balanceVnd: oldBalance } : u)),
      );
      toast.error(`Trừ tiền thất bại: ${(e as Error).message}`);
    } finally {
      setDebitBusy(false);
    }
  };

  const toggleRole = async (u: AdminUser) => {
    if (u.id === meId) {
      alert('Không thể đổi role của chính mình.');
      return;
    }
    const next: 'user' | 'admin' = u.role === 'admin' ? 'user' : 'admin';
    const confirmMsg =
      next === 'admin'
        ? `Promote ${u.email} thành ADMIN?`
        : `Gỡ quyền admin của ${u.email}?`;
    if (!confirm(confirmMsg)) return;
    setBusyRole(u.id);
    try {
      const res = await fetch('/api/admin/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: u.id, role: next }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setUsersList((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: data.role } : x)));
    } catch (e) {
      alert('Lỗi: ' + (e as Error).message);
    } finally {
      setBusyRole(null);
    }
  };

  return (
    <div className="rounded-3xl border border-[#4a6c7a]/45 bg-[#fbf3e2]/95 p-5 md:p-7">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2 className="text-xl font-semibold text-[#0f0a08]">
          Người dùng <span className="text-[#4a3a30] font-normal text-[14px]">({total})</span>
        </h2>
        <div className="relative w-72 max-w-full">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo email / tên / id"
            className="h-10 w-full pl-4 pr-9 rounded-full border border-[#4a6c7a]/35 bg-[#fbf3e2] text-[13px] focus:outline-none focus:border-[#4a6c7a]"
          />
          {isPending && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#c89146] animate-pulse" />
          )}
        </div>
      </div>

      <div className={`overflow-x-auto transition-opacity ${isPending ? 'opacity-60' : ''}`}>
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="border-b border-[#4a6c7a]/30 text-left text-[#4a3a30] uppercase tracking-[0.15em] text-[10px]">
              <th className="py-2 pr-3">User</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Role</th>
              <th className="py-2 pr-3 text-right">Số dư</th>
              <th className="py-2 pr-3">Tạo lúc</th>
              <th className="py-2 pr-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {usersList.map((u) => (
              <tr key={u.id} className="border-b border-[#4a6c7a]/15 hover:bg-[#fbf3e2]/60">
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {u.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.image} alt="" referrerPolicy="no-referrer" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-[#5a3a1a] text-[#fbf3e2] flex items-center justify-center text-[11px] font-semibold">
                        {(u.name ?? u.email).charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span className="font-medium text-[#0f0a08] truncate">{u.name ?? '—'}</span>
                  </div>
                </td>
                <td className="py-2.5 pr-3 text-[#4a3a30]">{u.email}</td>
                <td className="py-2.5 pr-3">
                  <button
                    type="button"
                    onClick={() => toggleRole(u)}
                    disabled={busyRole === u.id || u.id === meId}
                    title={
                      u.id === meId
                        ? 'Không thể đổi role của chính mình'
                        : u.role === 'admin'
                          ? 'Bấm để gỡ quyền admin'
                          : 'Bấm để promote thành admin'
                    }
                    className={`px-2 py-0.5 rounded-full text-[10px] tracking-wider font-bold uppercase transition disabled:cursor-not-allowed ${
                      u.role === 'admin'
                        ? 'bg-[#c8361d] text-[#fbf3e2] hover:bg-[#a52a16]'
                        : 'bg-[#fbf3e2] text-[#4a3a30] border border-[#4a6c7a]/40 hover:bg-[#f5e3c0]'
                    } ${busyRole === u.id ? 'opacity-50' : ''}`}
                  >
                    {busyRole === u.id ? '…' : u.role}
                  </button>
                </td>
                <td className="py-2.5 pr-3 text-right">
                  <span
                    className={`font-bold tabular-nums ${
                      u.balanceVnd >= 5000 ? 'text-[#3a8a5e]' : 'text-[#c8361d]'
                    }`}
                  >
                    {formatVnd(u.balanceVnd)}
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-[#4a3a30] text-[12px]">
                  {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="py-2.5 pr-3 text-right whitespace-nowrap">
                  <div className="inline-flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCreditFor(u);
                        setCreditAmount('20000');
                        setCreditNote('');
                        setError(null);
                      }}
                      className="px-3 py-1.5 rounded-full bg-[#3a8a5e] text-[#fbf3e2] text-[12px] hover:bg-[#2a6e48] transition"
                    >
                      Cộng tiền
                    </button>
                    {u.balanceVnd > 0 && u.id !== meId && (
                      <button
                        type="button"
                        onClick={() => {
                          setDebitFor(u);
                          setDebitAmount(String(Math.min(u.balanceVnd, 5000)));
                          setDebitNote('');
                          setError(null);
                        }}
                        className="px-3 py-1.5 rounded-full border border-[#c8361d]/45 text-[#c8361d] text-[12px] font-semibold hover:bg-[#c8361d]/10 transition"
                      >
                        Trừ tiền
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {usersList.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#4a3a30] italic">
                  {searchQuery ? `Không có user nào khớp "${searchQuery}".` : 'Không có user nào.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={pageSize} total={total} />

      {creditFor && (
        <BalanceModal
          title="Cộng tiền vào ví user"
          user={creditFor}
          amount={creditAmount}
          setAmount={setCreditAmount}
          note={creditNote}
          setNote={setCreditNote}
          busy={creditBusy}
          error={error}
          onCancel={() => setCreditFor(null)}
          onSubmit={submitCredit}
          submitLabel="Cộng tiền"
          submitColor="from-[#3a8a5e] to-[#2a6e48]"
        />
      )}

      {debitFor && (
        <BalanceModal
          title="Trừ tiền khỏi ví user"
          user={debitFor}
          amount={debitAmount}
          setAmount={setDebitAmount}
          note={debitNote}
          setNote={setDebitNote}
          busy={debitBusy}
          error={error}
          onCancel={() => setDebitFor(null)}
          onSubmit={submitDebit}
          submitLabel="Trừ tiền"
          submitColor="from-[#c8361d] to-[#5a3a1a]"
        />
      )}
    </div>
  );
}

function BalanceModal({
  title,
  user,
  amount,
  setAmount,
  note,
  setNote,
  busy,
  error,
  onCancel,
  onSubmit,
  submitLabel,
  submitColor,
}: {
  title: string;
  user: { email: string; balanceVnd: number };
  amount: string;
  setAmount: (s: string) => void;
  note: string;
  setNote: (s: string) => void;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  submitColor: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={() => !busy && onCancel()}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-[#4a6c7a]/55 bg-[#fbf3e2] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-[12.5px] text-[#4a3a30] mb-4">
          User: <strong>{user.email}</strong> · Số dư hiện tại:{' '}
          <strong className="text-[#5a3a1a]">{formatVnd(user.balanceVnd)}</strong>
        </p>

        <label className="block text-[11px] tracking-[0.2em] uppercase text-[#4a3a30] font-semibold mb-1">
          Số tiền (VND)
        </label>
        <div className="grid grid-cols-5 gap-2 mb-2">
          {QUICK_AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAmount(String(a))}
              className={`py-1.5 rounded-lg text-[11px] font-semibold border ${
                Number(amount) === a
                  ? 'border-[#5a3a1a] bg-[#f5e3c0] text-[#5a3a1a]'
                  : 'border-[#4a6c7a]/30 bg-[#fbf3e2] text-[#0f0a08] hover:border-[#4a6c7a]/55'
              }`}
            >
              {a / 1000}k
            </button>
          ))}
        </div>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
          placeholder="Số tiền"
          className="w-full h-11 px-4 rounded-2xl border border-[#4a6c7a]/35 bg-[#fbf3e2] font-mono text-lg focus:outline-none focus:border-[#4a6c7a]"
        />
        <label className="block text-[11px] tracking-[0.2em] uppercase text-[#4a3a30] font-semibold mt-3 mb-1">
          Ghi chú (tuỳ chọn)
        </label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="VD: Tặng khách VIP / Hoàn lỗi sai admin..."
          className="w-full h-11 px-4 rounded-2xl border border-[#4a6c7a]/35 bg-[#fbf3e2] focus:outline-none focus:border-[#4a6c7a]"
        />
        {error && (
          <div className="mt-3 rounded-xl border border-[#c8361d]/40 bg-[#c8361d]/10 px-3 py-2 text-[#c8361d] text-[13px]">
            ⚠ {error}
          </div>
        )}
        <p className="mt-3 text-[12px] text-[#4a3a30]">
          Thay đổi áp dụng realtime qua SSE. Ghi vào ledger transactions.
        </p>
        <div className="mt-4 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 rounded-full border border-[#4a6c7a]/40 hover:bg-[#fbf3e2]/60 text-[13px]"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={busy}
            className={`px-5 py-2 rounded-full bg-gradient-to-r ${submitColor} text-[#fbf3e2] text-[13px] font-semibold disabled:opacity-50`}
          >
            {busy ? 'Đang xử lý…' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
