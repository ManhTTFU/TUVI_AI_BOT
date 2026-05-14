import type { Metadata } from 'next';
import TuTruClient from '@/components/tu-tru/TuTruClient';

export const metadata: Metadata = {
  title: 'Tứ Trụ Bát Tự — Luận giải bản mệnh, sự nghiệp, tài lộc, hôn nhân',
  description:
    'Lập Tứ Trụ Bát Tự theo năm/tháng/ngày/giờ sinh — luận giải Nhật chủ, dụng thần, kỵ thần, ngũ hành nạp âm, sự nghiệp, tài lộc, tình duyên, hôn nhân cá nhân hóa.',
  alternates: { canonical: '/tu-tru-bat-tu' },
};

export default function Page() {
  return <TuTruClient />;
}
