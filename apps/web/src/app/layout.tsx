import './globals.css';
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/env';
import { BodyBackground, Header, Footer } from '@/components/layout';
import { AuthProvider } from '@/components/providers/AuthProvider';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Diễn Cầm Tam Thế — Tử Vi, Tứ Trụ, Tarot, Phong Thủy',
    template: '%s | Diễn Cầm Tam Thế',
  },
  description:
    'Nơi hội tụ tinh hoa của khoa Chiêm Tinh và Huyền Học Á Đông — Tử Vi Trọn Đời, Tứ Trụ Bát Tự, Bói Bài Tarot, Xem Ngày Vạn Sự, Phong Thủy Bát Trạch.',
  keywords: [
    'tử vi đẩu số',
    'xem tử vi',
    'lá số tử vi',
    'tarot',
    'phong thủy',
    'xem ngày tốt',
    'lục diệu',
    'con giáp',
    'cung hoàng đạo',
  ],
  openGraph: {
    title: 'Diễn Cầm Tam Thế',
    description:
      'Khoa Chiêm Tinh & Huyền Học Á Đông — Tử Vi, Tứ Trụ, Tarot, Phong Thủy.',
    url: SITE_URL,
    siteName: 'Diễn Cầm Tam Thế',
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Diễn Cầm Tam Thế',
    description: 'Khoa Chiêm Tinh & Huyền Học Á Đông.',
  },
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen text-[#0f0a08]">
        <AuthProvider>
          <BodyBackground />
          <Header />
          <main>{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
