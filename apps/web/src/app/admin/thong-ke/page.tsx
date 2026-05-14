import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAdminStats } from '@/lib/admin-stats';
import ChartsClient from './ChartsClient';

export const metadata = { title: 'Thống kê · Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminStatsPage() {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    redirect('/');
  }

  const stats = await getAdminStats();

  return (
    <div className="px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1
            className="text-3xl md:text-4xl font-serif italic text-[#0f0a08]"
            style={{ fontFamily: "'Cormorant Garamond',serif" }}
          >
            Thống kê
          </h1>
          <p className="mt-1 text-[13px] text-[#4a3a30]">
            Doanh thu và user signup theo thời gian. Số liệu tươi mỗi reload (giờ Việt Nam, UTC+7).
          </p>
        </header>

        <ChartsClient
          daily={stats.daily}
          monthly={stats.monthly}
          usersDaily={stats.usersDaily}
        />
      </div>
    </div>
  );
}
