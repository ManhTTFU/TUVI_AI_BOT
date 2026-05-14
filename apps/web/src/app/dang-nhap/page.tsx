import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LoginClient from './LoginClient';

const SERIF_FONT = "'Cormorant Garamond',serif";

export const metadata = {
  title: 'Đăng nhập · Vận Mệnh',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; error?: string };
}) {
  const session = await auth();
  if (session?.user) redirect(searchParams.callbackUrl ?? '/');

  const callbackUrl = searchParams.callbackUrl ?? '/';
  const hasGoogle = !!process.env.GOOGLE_CLIENT_ID;
  const hasFacebook = !!process.env.FACEBOOK_CLIENT_ID;
  const hasEmail = !!process.env.EMAIL_SERVER_HOST;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md rounded-3xl border border-[#4a6c7a]/45 bg-[#fbf3e2]/96 p-8 md:p-10 shadow-[0_30px_80px_-30px_rgba(90,58,26,0.3)]">
        <div className="text-center mb-6">
          <Link
            href="/"
            className="text-[11px] tracking-[0.3em] text-[#4a6c7a] hover:text-[#5a3a1a] uppercase"
          >
            ← Trang chủ
          </Link>
          <h1
            className="mt-3 text-4xl font-serif text-[#0f0a08]"
            style={{ fontFamily: SERIF_FONT }}
          >
            Đăng <em className="text-[#4a6c7a]">nhập</em>
          </h1>
          <p className="mt-2 text-[14px] text-[#4a3a30]">
            Lưu lại các lá số của bạn, nạp tiền và xem lịch sử
          </p>
        </div>

        <LoginClient
          callbackUrl={callbackUrl}
          hasGoogle={hasGoogle}
          hasFacebook={hasFacebook}
          hasEmail={hasEmail}
          errorParam={searchParams.error}
        />

        <p className="mt-6 text-center text-[12px] text-[#4a3a30] leading-relaxed">
          Bằng việc đăng nhập, bạn đồng ý với điều khoản sử dụng và chính sách
          bảo mật của Vận Mệnh.
        </p>
      </div>
    </div>
  );
}
