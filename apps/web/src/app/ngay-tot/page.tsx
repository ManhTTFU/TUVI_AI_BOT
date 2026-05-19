import type { Metadata } from 'next';
import NgayTotClient from '@/components/ngay-tot/NgayTotClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { serviceSchema, breadcrumbSchema } from '@/lib/seo-schemas';

export const metadata: Metadata = {
  title: 'Xem Ngày Tốt — Lịch Vạn Niên',
  description:
    'Lịch vạn niên — Đối chiếu hoàng đạo, hắc đạo, can chi tứ trụ và giờ tốt cho mọi việc trọng đại: cưới hỏi, khai trương, xuất hành, động thổ, nhập trạch.',
  alternates: { canonical: '/ngay-tot' },
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={serviceSchema({
          name: 'Xem Ngày Tốt — Lịch Vạn Niên',
          description:
            'Tra cứu ngày hoàng đạo, giờ tốt theo can chi tứ trụ cho cưới hỏi, khai trương, xuất hành, động thổ, nhập trạch.',
          path: '/ngay-tot',
          serviceType: 'Astrological Calendar',
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Trang chủ', path: '/' },
          { name: 'Xem Ngày Tốt', path: '/ngay-tot' },
        ])}
      />
      <NgayTotClient />
    </>
  );
}
