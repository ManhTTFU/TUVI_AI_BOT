import type { Metadata } from 'next';
import TarotClient from './TarotClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { serviceSchema, breadcrumbSchema } from '@/lib/seo-schemas';

export const metadata: Metadata = {
  title: 'Xem Tarot · Trải bài 78 lá Rider-Waite — Vận Mệnh',
  description:
    'Trải bài Tarot Rider-Waite-Smith 78 lá, vuốt chọn lá theo trực giác, luận giải cá nhân hóa cho tình duyên, sự nghiệp, tài chính, sức khỏe.',
  alternates: { canonical: '/xem-tarot' },
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={serviceSchema({
          name: 'Bói bài Tarot',
          description:
            'Trải bài Tarot Rider-Waite-Smith 78 lá, luận giải cá nhân hóa cho tình duyên, sự nghiệp, tài chính, sức khỏe.',
          path: '/xem-tarot',
          serviceType: 'Tarot Reading',
          priceVnd: 5000,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Trang chủ', path: '/' },
          { name: 'Xem Tarot', path: '/xem-tarot' },
        ])}
      />
      <TarotClient />
    </>
  );
}
