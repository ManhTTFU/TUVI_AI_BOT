import './globals.css';
import type { Metadata } from 'next';
import { GoogleAnalytics } from '@next/third-parties/google';
import { SITE_URL } from '@/lib/env';
import { sfProDisplay } from '@/lib/fonts';
import { auth } from '@/auth';
import { BodyBackground, Header, Footer } from '@/components/layout';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { Toaster } from '@/components/ui/toast';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

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

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Luận Giải Vận Mệnh',
  alternateName: 'Vận Mệnh',
  url: SITE_URL,
  inLanguage: 'vi-VN',
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Luận Giải Vận Mệnh',
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  description:
    'Nền tảng luận giải Tử Vi, Tứ Trụ, Tarot, Phong Thủy bằng AI — kết tinh từ khoa Chiêm Tinh và Huyền Học Á Đông.',
  sameAs: [],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Lấy session ở server → pass vào SessionProvider, tránh /api/auth/session
  // fetch lại ở client lúc mount. JWT cookie decode local, không hit DB.
  const session = await auth();
  return (
    <html lang="vi" className={sfProDisplay.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="min-h-screen text-[#0f0a08]">
        <AuthProvider session={session}>
          <BodyBackground />
          <Header />
          <main>{children}</main>
          <Footer />
          <Toaster />
        </AuthProvider>
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      </body>
    </html>
  );
}
