import './globals.css';
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/env';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Tử Vi Đẩu Số AI — Luận giải lá số chi tiết',
    template: '%s | Tử Vi AI',
  },
  description:
    'Lập lá số Tử Vi Đẩu Số chuẩn xác, phân tích 6 phần chi tiết (tổng quan, sự nghiệp, tình duyên, sức khỏe, vận hạn 10 năm, lời khuyên) với AI. Miễn phí.',
  keywords: [
    'tử vi đẩu số',
    'xem tử vi',
    'lá số tử vi',
    'luận giải tử vi',
    'tử vi AI',
    'tử vi miễn phí',
  ],
  openGraph: {
    title: 'Tử Vi Đẩu Số AI — Luận giải lá số chi tiết',
    description:
      'Lập lá số Tử Vi Đẩu Số chuẩn xác, phân tích 6 phần chi tiết với AI.',
    url: SITE_URL,
    siteName: 'Tử Vi AI',
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tử Vi Đẩu Số AI',
    description: 'Luận giải lá số chi tiết với AI.',
  },
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-brand-cream text-brand-ink">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="border-b border-brand-goldLight/50 bg-brand-cream/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-purple text-brand-gold">
            ✦
          </span>
          <span className="font-serif text-xl font-bold text-brand-purple">Tử Vi AI</span>
        </a>
        <nav className="hidden gap-6 text-sm font-medium text-brand-ink/80 md:flex">
          <a href="/" className="hover:text-brand-purple">Trang chủ</a>
          <a href="/xem-tu-vi" className="hover:text-brand-purple">Xem tử vi</a>
          <a href="/#faq" className="hover:text-brand-purple">FAQ</a>
        </nav>
        <a href="/xem-tu-vi" className="btn-primary hidden text-sm md:inline-flex">
          Xem ngay
        </a>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-brand-goldLight/40 bg-brand-purpleDark py-10 text-brand-cream">
      <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-3">
        <div>
          <div className="font-serif text-xl font-bold text-brand-gold">Tử Vi AI</div>
          <p className="mt-2 text-sm text-brand-goldLight/90">
            Lá số Tử Vi Đẩu Số và luận giải chi tiết với AI. Công cụ tham khảo
            văn hóa – tinh thần.
          </p>
        </div>
        <div>
          <div className="font-semibold">Sản phẩm</div>
          <ul className="mt-2 space-y-1 text-sm text-brand-goldLight/90">
            <li><a href="/xem-tu-vi" className="hover:text-brand-gold">Form xem tử vi</a></li>
            <li><a href="/sitemap.xml" className="hover:text-brand-gold">Sitemap</a></li>
            <li><a href="/robots.txt" className="hover:text-brand-gold">Robots</a></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold">Liên hệ</div>
          <ul className="mt-2 space-y-1 text-sm text-brand-goldLight/90">
            <li>Telegram Bot: @your_bot_username</li>
            <li>Lưu ý: nội dung tham khảo, không thay thế tư vấn chuyên môn.</li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-6xl px-6 text-center text-xs text-brand-goldLight/70">
        © {new Date().getFullYear()} Tử Vi AI
      </div>
    </footer>
  );
}
