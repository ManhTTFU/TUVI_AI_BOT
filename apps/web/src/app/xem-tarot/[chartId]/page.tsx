import type { Metadata } from 'next';
import TarotResultPage from './TarotResultPage';

export const metadata: Metadata = {
  title: 'Kết quả Tarot · Vận Mệnh',
  description: 'Xem lại trải bài Tarot đã rút trước đây — Vận Mệnh.',
};

export default function Page({ params }: { params: { chartId: string } }) {
  return <TarotResultPage chartId={params.chartId} />;
}
