import type { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';

export const metadata: Metadata = {
  title: 'Vận Mệnh — Tử Vi, Tứ Trụ, Tarot, Phong Thủy',
  description:
    'Nơi hội tụ tinh hoa của khoa Chiêm Tinh và Huyền Học Á Đông — Tử Vi Trọn Đời, Tứ Trụ Bát Tự, Bói Bài Tarot, Xem Ngày Vạn Sự, Phong Thủy Bát Trạch.',
  alternates: { canonical: '/' },
};

export default function Page() {
  return <HomeClient />;
}
