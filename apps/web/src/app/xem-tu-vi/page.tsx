import type { Metadata } from 'next';
import TuviClient from '@/components/tu-vi/TuviClient';

export const metadata: Metadata = {
  title: 'Xem Tử Vi — Lập lá số 14 chính tinh',
  description:
    'Lập lá số tử vi 14 chính tinh — luận giải 12 cung, sự nghiệp, tình duyên, tài lộc theo Can Chi và mệnh nạp âm.',
  alternates: { canonical: '/xem-tu-vi' },
};

export default function Page() {
  return <TuviClient />;
}
