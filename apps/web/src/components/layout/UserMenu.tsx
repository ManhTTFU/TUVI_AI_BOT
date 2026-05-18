'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { subscribeWallet } from '@/lib/wallet-sse';
import { formatVnd } from '@/lib/money';

const SERIF_FONT = "'Cormorant Garamond',serif";

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const ref = useRef<HTMLDivElement | null>(null);

  // Init balance từ session (snapshot lúc login). Sau đó updates đến qua
  // subscribeWallet (local emit + Supabase Realtime push).
  useEffect(() => {
    if (session?.user) setBalance(session.user.balanceVnd ?? 0);
  }, [session?.user?.balanceVnd]);
  useEffect(() => {
    if (!session?.user) return;
    const unsubscribe = subscribeWallet((event, data) => {
      if (event === 'balance' && typeof data.balanceVnd === 'number') {
        setBalance(data.balanceVnd);
      }
    });
    return unsubscribe;
  }, [session?.user?.id]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (status === 'loading') {
    return <div className="w-9 h-9 rounded-full bg-[#4a6c7a]/15 animate-pulse" />;
  }

  if (!session?.user) {
    return (
      <Link
        href="/dang-nhap"
        className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full bg-gradient-to-r from-[#5a3a1a] via-[#7a4a1f] to-[#c89146] text-[#fbf3e2] text-[13px] font-semibold hover:from-[#4a6c7a] hover:via-[#8a5520] hover:to-[#d4a05a] transition shadow-[0_6px_18px_-6px_rgba(90,58,26,0.55)]"
      >
        <span className="text-base leading-none">✦</span>
        <span>Đăng nhập</span>
      </Link>
    );
  }

  const u = session.user;
  const initial = (u.name ?? u.email ?? 'U').trim().charAt(0).toUpperCase();
  const isAdmin = u.role === 'admin';
  const lowBalance = balance < 5000;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full border border-[#4a6c7a]/40 bg-[#fbf3e2] hover:border-[#4a6c7a] transition"
      >
        {u.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={u.image}
            alt=""
            referrerPolicy="no-referrer"
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <span className="w-7 h-7 rounded-full bg-[#5a3a1a] text-[#fbf3e2] flex items-center justify-center text-[12px] font-semibold">
            {initial}
          </span>
        )}
        <span
          className={`text-[12px] tracking-[0.05em] font-bold tabular-nums ${
            lowBalance ? 'text-[#c8361d]' : 'text-[#5a3a1a]'
          }`}
          title="Số dư ví"
        >
          {formatVnd(balance)}
        </span>
        <span
          className={`text-[#4a3a30] text-xs transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        >
          ▾
        </span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#4a6c7a]/45 bg-[#fbf3e2] shadow-[0_24px_60px_-20px_rgba(90,58,26,0.4)] py-2 z-50">
          <div className="px-4 py-3 border-b border-[#4a6c7a]/25">
            <div className="text-[13px] font-semibold text-[#0f0a08] truncate">
              {u.name ?? u.email}
            </div>
            <div className="text-[11px] text-[#4a3a30] truncate">{u.email}</div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] tracking-[0.25em] uppercase text-[#4a3a30]">
                Số dư
              </span>
              <span
                className={`text-2xl font-serif italic tabular-nums ${
                  lowBalance ? 'text-[#c8361d]' : 'text-[#5a3a1a]'
                }`}
                style={{ fontFamily: SERIF_FONT }}
              >
                {formatVnd(balance)}
              </span>
            </div>
            {lowBalance && (
              <Link
                href="/vi-cua-toi"
                onClick={() => setOpen(false)}
                className="mt-2 inline-block w-full text-center px-3 py-1.5 rounded-full bg-[#c8361d] text-[#fbf3e2] text-[11px] font-semibold tracking-wider uppercase hover:bg-[#a52a16]"
              >
                Nạp ngay
              </Link>
            )}
            {isAdmin && (
              <span className="mt-2 inline-block px-2 py-0.5 rounded-full bg-[#c8361d] text-[#fbf3e2] text-[9px] tracking-wider font-bold">
                ADMIN
              </span>
            )}
          </div>
          <Link
            href="/vi-cua-toi"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#0f0a08] hover:bg-[#fbf3e2]/60"
          >
            <span>💰</span> Ví của tôi
          </Link>
          <Link
            href="/lich-su"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#0f0a08] hover:bg-[#fbf3e2]/60"
          >
            <span>📜</span> Lịch sử của tôi
          </Link>
          {isAdmin && (
            <>
              <div className="my-1 border-t border-[#4a6c7a]/20" />
              <Link
                href="/admin/users"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#c8361d] hover:bg-[#fbf3e2]/60 font-medium"
              >
                <span>⚙</span> Quản lý người dùng
              </Link>
              <Link
                href="/admin/transactions"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#c8361d] hover:bg-[#fbf3e2]/60 font-medium"
              >
                <span>💳</span> Duyệt giao dịch
              </Link>
              <Link
                href="/admin/thong-ke"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#c8361d] hover:bg-[#fbf3e2]/60 font-medium"
              >
                <span>📊</span> Thống kê
              </Link>
            </>
          )}
          <div className="my-1 border-t border-[#4a6c7a]/20" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              signOut({ callbackUrl: '/' });
            }}
            className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#4a3a30] hover:bg-[#fbf3e2]/60"
          >
            <span>↩</span> Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
