import './globals.css';
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/env';
import { BodyBackground, Header, Footer } from '@/components/layout';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { Toaster } from '@/components/ui/toast';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Vận Mệnh — Tử Vi, Tứ Trụ, Tarot, Phong Thủy',
    template: '%s | Vận Mệnh',
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
    title: 'Vận Mệnh',
    description:
      'Khoa Chiêm Tinh & Huyền Học Á Đông — Tử Vi, Tứ Trụ, Tarot, Phong Thủy.',
    url: SITE_URL,
    siteName: 'Vận Mệnh',
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vận Mệnh',
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
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
