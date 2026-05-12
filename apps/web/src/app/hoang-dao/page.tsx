import type { Metadata } from 'next';
import HoangDaoClient from '@/components/hoang-dao/HoangDaoClient';

export const metadata: Metadata = {
  title: '12 Cung Hoàng Đạo — Luận giải vận trình từng cung',
  description:
    '12 cung hoàng đạo Tây Phương — Bạch Dương, Kim Ngưu, Song Tử, Cự Giải, Sư Tử, Xử Nữ, Thiên Bình, Bọ Cạp, Nhân Mã, Ma Kết, Bảo Bình, Song Ngư. Vận trình tình duyên, sự nghiệp, tài lộc.',
  alternates: { canonical: '/hoang-dao' },
};

export default function Page() {
  return <HoangDaoClient />;
}
