import type { Metadata } from 'next';
import LuanGiaiClient from './LuanGiaiClient';

export const metadata: Metadata = {
  title: 'Luận giải Hoàng Đạo cá nhân — Vận Mệnh',
  description:
    'Phân tích chiêm tinh chi tiết theo cung hoàng đạo + giới tính + trạng thái + mục tiêu cá nhân.',
  alternates: { canonical: '/hoang-dao/luan-giai' },
};

export default function Page() {
  return <LuanGiaiClient />;
}
