'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { daysRemaining, isLifetime, isProActive } from '@/lib/tier';
import type { Plan } from '@tuvi/db';

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: 'user' | 'admin';
  proUntil: string | null;
  createdAt: string;
};

const PLAN_LABELS: Record<Plan, string> = {
  monthly: 'Tháng (20k)',
  semi_annual: 'Nửa năm (50k)',
  annual: 'Năm (100k)',
  lifetime: 'Trọn đời (500k)',
};

export default function UsersClient({ initialUsers }: { initialUsers: AdminUser[] }) {
  const { data: session } = useSession();
  const meId = session?.user?.id ?? '';
  const [users, setUsers] = useState(initialUsers);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busyRole, setBusyRole] = useState<string | null>(null);
  const [extendFor, setExtendFor] = useState<AdminUser | null>(null);
  const [extendPlan, setExtendPlan] = useState<Plan>('monthly');
  const [extendNote, setExtendNote] = useState('');
  const [extendBusy, setExtendBusy] = useState(false);
  const [revokeBusy, setRevokeBusy] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return (
      u.email.toLowerCase().includes(q) ||
      (u.name ?? '').toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q)
    );
  });

  const submitExtend = async () => {
    if (!extendFor) return;
    setExtendBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: extendFor.id,
          plan: extendPlan,
          note: extendNote || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === extendFor.id ? { ...u, proUntil: data.proUntil } : u)),
      );
      setExtendFor(null);
      setExtendPlan('monthly');
      setExtendNote('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExtendBusy(false);
    }
  };

  const revokePro = async (u: AdminUser) => {
    if (!confirm(`Hủy gói PRO của ${u.email}? Sau khi hủy, user về NORMAL ngay lập tức.`)) return;
    setRevokeBusy(u.id);
    try {
      const res = await fetch('/api/admin/users/revoke-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: u.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, proUntil: null } : x)));
    } catch (e) {
      alert('Lỗi: ' + (e as Error).message);
    } finally {
      setRevokeBusy(null);
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
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: data.role } : x)));
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
          Người dùng ({filtered.length}/{users.length})
        </h2>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Tìm theo email / tên / id"
          className="h-10 px-4 rounded-full border border-[#4a6c7a]/35 bg-[#fbf3e2] text-[13px] w-72 max-w-full focus:outline-none focus:border-[#4a6c7a]"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="border-b border-[#4a6c7a]/30 text-left text-[#4a3a30] uppercase tracking-[0.15em] text-[10px]">
              <th className="py-2 pr-3">User</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Role</th>
              <th className="py-2 pr-3">Gói PRO</th>
              <th className="py-2 pr-3">Tạo lúc</th>
              <th className="py-2 pr-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
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
                <td className="py-2.5 pr-3">
                  {isProActive(u.proUntil) ? (
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-full bg-[#c8361d]/15 text-[#c8361d] text-[10px] tracking-wider font-bold uppercase border border-[#c8361d]/40">
                        PRO
                      </span>
                      <div className="text-[11px] text-[#4a3a30] mt-0.5">
                        {isLifetime(u.proUntil)
                          ? 'Trọn đời'
                          : `Còn ${daysRemaining(u.proUntil)} ngày`}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#4a3a30]">NORMAL</span>
                  )}
                </td>
                <td className="py-2.5 pr-3 text-[#4a3a30] text-[12px]">
                  {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td className="py-2.5 pr-3 text-right whitespace-nowrap">
                  <div className="inline-flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setExtendFor(u);
                        setExtendPlan('monthly');
                        setExtendNote('');
                        setError(null);
                      }}
                      className="px-3 py-1.5 rounded-full bg-[#c8361d] text-[#fbf3e2] text-[12px] hover:bg-[#a52a16] transition"
                    >
                      Tặng gói
                    </button>
                    {isProActive(u.proUntil) && u.id !== meId && (
                      <button
                        type="button"
                        onClick={() => revokePro(u)}
                        disabled={revokeBusy === u.id}
                        title="Hủy gói PRO của user này, đặt về NORMAL"
                        className="px-3 py-1.5 rounded-full border border-[#c8361d]/45 text-[#c8361d] text-[12px] font-semibold hover:bg-[#c8361d]/10 transition disabled:opacity-50"
                      >
                        {revokeBusy === u.id ? '…' : 'Hủy PRO'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#4a3a30] italic">
                  Không có user nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {extendFor && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => !extendBusy && setExtendFor(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-[#4a6c7a]/55 bg-[#fbf3e2] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-1">Tặng gói PRO</h3>
            <p className="text-[12.5px] text-[#4a3a30] mb-4">
              User: <strong>{extendFor.email}</strong>
              {isProActive(extendFor.proUntil) && (
                <>
                  {' '}
                  · Gói hiện tại{' '}
                  <strong className="text-[#c8361d]">PRO</strong>{' '}
                  {isLifetime(extendFor.proUntil)
                    ? '(Trọn đời)'
                    : `(còn ${daysRemaining(extendFor.proUntil)} ngày)`}
                </>
              )}
            </p>
            <label className="block text-[11px] tracking-[0.2em] uppercase text-[#4a3a30] font-semibold mb-1">
              Chọn gói
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {(Object.keys(PLAN_LABELS) as Plan[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setExtendPlan(p)}
                  className={`p-2 rounded-xl border-2 text-[12px] font-semibold transition ${
                    extendPlan === p
                      ? 'border-[#c8361d] bg-[#c8361d]/10 text-[#c8361d]'
                      : 'border-[#4a6c7a]/30 bg-[#fbf3e2]/85 text-[#0f0a08] hover:border-[#4a6c7a]/55'
                  }`}
                >
                  {PLAN_LABELS[p]}
                </button>
              ))}
            </div>
            <label className="block text-[11px] tracking-[0.2em] uppercase text-[#4a3a30] font-semibold mb-1">
              Ghi chú (tuỳ chọn)
            </label>
            <input
              value={extendNote}
              onChange={(e) => setExtendNote(e.target.value)}
              placeholder="VD: Tặng khách VIP / bù lỗi sai admin..."
              className="w-full h-11 px-4 rounded-2xl border border-[#4a6c7a]/35 bg-[#fbf3e2] focus:outline-none focus:border-[#4a6c7a]"
            />
            {error && (
              <div className="mt-3 rounded-xl border border-[#c8361d]/40 bg-[#c8361d]/10 px-3 py-2 text-[#c8361d] text-[13px]">
                ⚠ {error}
              </div>
            )}
            <p className="mt-3 text-[12px] text-[#4a3a30]">
              Thời hạn sẽ cộng dồn vào gói hiện tại của user (nếu còn). Trọn đời
              sẽ ghi đè. Realtime SSE.
            </p>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setExtendFor(null)}
                disabled={extendBusy}
                className="px-4 py-2 rounded-full border border-[#4a6c7a]/40 hover:bg-[#fbf3e2]/60 text-[13px]"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={submitExtend}
                disabled={extendBusy}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-[#c8361d] to-[#5a3a1a] text-[#fbf3e2] text-[13px] font-semibold disabled:opacity-50"
              >
                {extendBusy ? 'Đang xử lý…' : 'Xác nhận tặng'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
