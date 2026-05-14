import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin · Vận Mệnh' };

const SERIF_FONT = "'Cormorant Garamond',serif";

const NAV = [
  { href: '/admin/users', label: 'Người dùng', icon: '👥' },
  { href: '/admin/transactions', label: 'Giao dịch', icon: '💳' },
  { href: '/admin/bank-config', label: 'Cấu hình bank', icon: '🏦' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/dang-nhap?callbackUrl=/admin/users');
  if (session.user.role !== 'admin') redirect('/');

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 text-[#0f0a08]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1
            className="text-3xl md:text-4xl font-serif italic text-[#0f0a08]"
            style={{ fontFamily: SERIF_FONT }}
          >
            Quản trị viên
          </h1>
          <span className="px-3 py-1 rounded-full bg-[#c8361d] text-[#fbf3e2] text-[10px] tracking-[0.2em] font-bold uppercase">
            Admin Mode
          </span>
        </div>
        <nav className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-[#4a6c7a]/45 bg-[#fbf3e2]/95 p-1.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 min-w-[140px] text-center px-4 py-2.5 rounded-xl text-[13.5px] font-semibold hover:bg-[#fbf3e2] transition"
            >
              <span className="mr-1.5">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}
