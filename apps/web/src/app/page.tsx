import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/env';
import HomeClient from '@/components/home/HomeClient';

export const metadata: Metadata = {
  title: 'Vận Mệnh — Tử Vi, Tứ Trụ, Tarot, Phong Thủy',
  description:
    'Nơi hội tụ tinh hoa của khoa Chiêm Tinh và Huyền Học Á Đông — Tử Vi Trọn Đời, Tứ Trụ Bát Tự, Bói Bài Tarot, Xem Ngày Vạn Sự, Phong Thủy Bát Trạch.',
  alternates: { canonical: '/' },
};

export default function Page() {
  const jsonLdWebsite = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Vận Mệnh',
    url: SITE_URL,
    inLanguage: 'vi-VN',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/xem-tu-vi?name={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebsite) }}
      />
      <HomeClient />
    </>
  );
}
