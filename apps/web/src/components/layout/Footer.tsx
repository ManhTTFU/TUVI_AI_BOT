'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const SERIF_FONT = "'Cormorant Garamond',serif";

export default function Footer() {
  const [year, setYear] = useState('');
  useEffect(() => {
    setYear(String(new Date().getFullYear()));
  }, []);
  return (
    <footer className="relative mt-10 border-t border-[#c89146]/45 bg-[#0f0a08]/95 text-[#e8d8b8]">
      <div className="max-w-7xl mx-auto px-6 py-14 grid md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full bg-[#5a3a1a] text-[#d4af6a] flex items-center justify-center font-serif italic text-xl"
              style={{ fontFamily: SERIF_FONT }}
            >
              命
            </div>
            <div>
              <div className="text-[11px] tracking-[0.35em] text-[#d4af6a] uppercase">
                Mệnh Lý
              </div>
              <div
                className="text-xl font-serif italic"
                style={{ fontFamily: SERIF_FONT }}
              >
                Vận Mệnh
              </div>
            </div>
          </div>
          <p className="mt-5 text-[#e8d8b8]/70 max-w-md leading-relaxed text-sm">
            Một quyển sách số mệnh cổ truyền, được dịch và mở rộng cho người
            hiện đại. Tử vi · Tứ trụ · Bói bài · Phong thủy · Gieo quẻ.
          </p>
        </div>
        <div>
          <div className="text-[11px] tracking-[0.3em] uppercase text-[#d4af6a] mb-4">
            Khám phá
          </div>
          <ul className="space-y-2 text-sm text-[#e8d8b8]/80">
            <li>
              <Link href="/#tarot" className="hover:text-[#d4af6a]">
                Bói Bài Tarot
              </Link>
            </li>
            <li>
              <Link href="/ngay-tot" className="hover:text-[#d4af6a]">
                Xem Ngày Tốt
              </Link>
            </li>
            <li>
              <Link href="/#zodiac" className="hover:text-[#d4af6a]">
                12 Con Giáp
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="text-[11px] tracking-[0.3em] uppercase text-[#d4af6a] mb-4">
            Liên hệ
          </div>
          <ul className="space-y-2 text-sm text-[#e8d8b8]/80">
            <li>Email · tuanmanh97x@gmail.com</li>
            <li>Hotline · 0963 590 255</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#e8d8b8]/10 px-6 py-5 text-center text-xs text-[#e8d8b8]/50">
        © <span suppressHydrationWarning>{year}</span> Vận Mệnh · Khoa
        Chiêm Tinh & Huyền Học Á Đông
      </div>
    </footer>
  );
}
