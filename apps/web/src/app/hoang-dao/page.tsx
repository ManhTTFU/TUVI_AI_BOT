import type { Metadata } from 'next';
import HoangDaoClient from '@/components/hoang-dao/HoangDaoClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { collectionPageSchema, breadcrumbSchema } from '@/lib/seo-schemas';
import { ZODIAC_DETAILS } from '@/lib/zodiac-detail';

export const metadata: Metadata = {
  title: '12 Cung Hoàng Đạo — Luận giải vận trình từng cung',
  description:
    '12 cung hoàng đạo Tây Phương — Bạch Dương, Kim Ngưu, Song Tử, Cự Giải, Sư Tử, Xử Nữ, Thiên Bình, Bọ Cạp, Nhân Mã, Ma Kết, Bảo Bình, Song Ngư. Vận trình tình duyên, sự nghiệp, tài lộc.',
  alternates: { canonical: '/hoang-dao' },
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={collectionPageSchema({
          name: '12 Cung Hoàng Đạo',
          description:
            'Tổng quan 12 cung hoàng đạo Tây Phương — tính cách, vận trình, tình duyên, sự nghiệp.',
          path: '/hoang-dao',
          items: ZODIAC_DETAILS.map((z) => ({
            name: z.name,
            path: `/hoang-dao/${z.slug}`,
          })),
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Trang chủ', path: '/' },
          { name: '12 Cung Hoàng Đạo', path: '/hoang-dao' },
        ])}
      />
      <HoangDaoClient />
    </>
  );
}
