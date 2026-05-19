import type { Metadata } from 'next';
import TuviClient from '@/components/tu-vi/TuviClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { serviceSchema, breadcrumbSchema } from '@/lib/seo-schemas';

export const metadata: Metadata = {
  title: 'Xem Tử Vi — Lập lá số 14 chính tinh',
  description:
    'Lập lá số tử vi 14 chính tinh — luận giải 12 cung, sự nghiệp, tình duyên, tài lộc theo Can Chi và mệnh nạp âm.',
  alternates: { canonical: '/xem-tu-vi' },
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={serviceSchema({
          name: 'Luận giải Tử Vi Đẩu Số',
          description:
            'Lập lá số tử vi 14 chính tinh, luận giải 12 cung mệnh thân, sự nghiệp, tình duyên, tài lộc bằng AI.',
          path: '/xem-tu-vi',
          serviceType: 'Astrology Reading',
          priceVnd: 40000,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Trang chủ', path: '/' },
          { name: 'Xem Tử Vi', path: '/xem-tu-vi' },
        ])}
      />
      <TuviClient />
    </>
  );
}
