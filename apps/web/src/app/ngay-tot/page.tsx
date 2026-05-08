import type { Metadata } from 'next';
import NgayTotClient from '@/components/ngay-tot/NgayTotClient';

export const metadata: Metadata = {
  title: 'Xem Ngày Tốt — Lịch Vạn Niên',
  description:
    'Lịch vạn niên — Đối chiếu hoàng đạo, hắc đạo, can chi tứ trụ và giờ tốt cho mọi việc trọng đại: cưới hỏi, khai trương, xuất hành, động thổ, nhập trạch.',
  alternates: { canonical: '/ngay-tot' },
};

export default function Page() {
  return <NgayTotClient />;
}
