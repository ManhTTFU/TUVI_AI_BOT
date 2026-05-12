'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import UserMenu from './UserMenu';

const SERIF_FONT = "'Cormorant Garamond',serif";

type NavLink = { label: string; href: string };

const NAV_LINKS: NavLink[] = [
  { label: 'Trang Chủ', href: '/#top' },
  { label: 'Xem Tử Vi', href: '/xem-tu-vi' },
  { label: 'Tứ Trụ', href: '/tu-tru-bat-tu' },
  { label: 'Xem Ngày Tốt', href: '/ngay-tot' },
  { label: 'Hoàng Đạo', href: '/hoang-dao' },
  { label: 'Lục Diệu', href: '/#lucdieu' },
];

function isActive(href: string, pathname: string): boolean {
  const base = href.split('#')[0] || '/';
  if (base === '/') return false;
  return pathname === base || pathname.startsWith(`${base}/`);
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? '/';
  const { data: session } = useSession();
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-[#fbf3e2]/92 border-b border-[#c89146]/45">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full bg-[#5a3a1a] text-[#d4af6a] flex items-center justify-center font-serif italic text-xl shadow-md"
            style={{ fontFamily: SERIF_FONT }}
          >
            D
          </div>
          <div>
            <div className="text-[11px] tracking-[0.35em] text-[#4a6c7a] font-semibold uppercase leading-none">
              Diễn Cầm
            </div>
            <div
              className="text-base font-serif italic text-[#0f0a08] leading-tight"
              style={{ fontFamily: SERIF_FONT }}
            >
              Tam Thế
            </div>
          </div>
        </Link>
        <nav className="hidden lg:flex items-center gap-7 text-[13px] text-[#0f0a08] tracking-wide">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href, pathname);
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`hover:text-[#4a6c7a] transition relative ${
                  active ? 'text-[#4a6c7a] font-medium' : ''
                } after:content-[''] after:absolute after:left-0 after:bottom-[-6px] after:h-px after:bg-[#4a6c7a] after:transition-all ${
                  active ? 'after:w-full' : 'after:w-0 hover:after:w-full'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <UserMenu />
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="lg:hidden text-[#5a3a1a] text-2xl leading-none"
            aria-label="Mở menu"
            aria-expanded={open}
          >
            ≡
          </button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-[#c89146]/45 bg-[#fbf3e2]/95 px-6 py-4 flex flex-col gap-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-[#0f0a08] hover:text-[#4a6c7a]"
            >
              {link.label}
            </Link>
          ))}
          <div className="my-1 border-t border-[#4a6c7a]/20" />
          {session?.user ? (
            <>
              <Link
                href="/vi-cua-toi"
                onClick={() => setOpen(false)}
                className="text-[#0f0a08] hover:text-[#4a6c7a]"
              >
                💰 Ví của tôi
              </Link>
              <Link
                href="/lich-su"
                onClick={() => setOpen(false)}
                className="text-[#0f0a08] hover:text-[#4a6c7a]"
              >
                📜 Lịch sử của tôi
              </Link>
              {session.user.role === 'admin' && (
                <>
                  <Link
                    href="/admin/users"
                    onClick={() => setOpen(false)}
                    className="text-[#c8361d] hover:text-[#5a3a1a] font-medium"
                  >
                    ⚙ Admin · Người dùng
                  </Link>
                  <Link
                    href="/admin/transactions"
                    onClick={() => setOpen(false)}
                    className="text-[#c8361d] hover:text-[#5a3a1a] font-medium"
                  >
                    💳 Admin · Giao dịch
                  </Link>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  signOut({ callbackUrl: '/' });
                }}
                className="text-left text-[#4a3a30] hover:text-[#5a3a1a]"
              >
                ↩ Đăng xuất
              </button>
            </>
          ) : (
            <Link
              href="/dang-nhap"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#5a3a1a] to-[#c89146] text-[#fbf3e2] font-semibold text-[13px] w-fit"
            >
              ✦ Đăng nhập
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
