import type { Metadata } from 'next';
import TarotClient from './TarotClient';

export const metadata: Metadata = {
  title: 'Xem Tarot · Trải bài 78 lá Rider-Waite — Vận Mệnh',
  description:
    'Trải bài Tarot Rider-Waite-Smith 78 lá, vuốt chọn lá theo trực giác, luận giải cá nhân hóa cho tình duyên, sự nghiệp, tài chính, sức khỏe.',
  alternates: { canonical: '/xem-tarot' },
};

export default function Page() {
  return <TarotClient />;
}
