import type { Metadata } from 'next';
import TuTruClient from '@/components/tu-tru/TuTruClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { serviceSchema, breadcrumbSchema } from '@/lib/seo-schemas';

export const metadata: Metadata = {
  title: 'Tứ Trụ Bát Tự — Luận giải bản mệnh, sự nghiệp, tài lộc, hôn nhân',
  description:
    'Lập Tứ Trụ Bát Tự theo năm/tháng/ngày/giờ sinh — luận giải Nhật chủ, dụng thần, kỵ thần, ngũ hành nạp âm, sự nghiệp, tài lộc, tình duyên, hôn nhân cá nhân hóa.',
  alternates: { canonical: '/tu-tru-bat-tu' },
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={serviceSchema({
          name: 'Luận giải Tứ Trụ Bát Tự',
          description:
            'Lập Tứ Trụ Bát Tự theo năm/tháng/ngày/giờ sinh — luận giải Nhật chủ, dụng thần, ngũ hành, sự nghiệp, tài lộc, hôn nhân.',
          path: '/tu-tru-bat-tu',
          serviceType: 'BaZi Reading',
          priceVnd: 5000,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Trang chủ', path: '/' },
          { name: 'Tứ Trụ Bát Tự', path: '/tu-tru-bat-tu' },
        ])}
      />
      <TuTruClient />
    </>
  );
}
