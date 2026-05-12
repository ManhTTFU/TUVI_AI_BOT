import Link from 'next/link';

const SERIF_FONT = "'Cormorant Garamond',serif";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 text-[#0f0a08]">
      <div className="max-w-md text-center">
        <div className="text-[11px] tracking-[0.4em] uppercase text-[#4a6c7a] font-semibold">
          404 · Không tìm thấy
        </div>
        <h1
          className="mt-3 text-4xl font-serif italic"
          style={{ fontFamily: SERIF_FONT }}
        >
          Lá số Tứ Trụ không tồn tại
        </h1>
        <p className="mt-3 text-[14px] text-[#4a3a30]">
          Có thể lá số đã bị xoá, hoặc không thuộc về tài khoản của bạn.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/lich-su"
            className="px-4 py-2 rounded-full border border-[#c89146]/55 bg-[#fbf3e2] text-[#5a3a1a] text-[13px] font-semibold hover:bg-[#f5e3c0]"
          >
            ← Về Lịch sử
          </Link>
          <Link
            href="/tu-tru-bat-tu"
            className="px-4 py-2 rounded-full bg-gradient-to-r from-[#5a3a1a] to-[#c89146] text-[#fbf3e2] text-[13px] font-semibold hover:from-[#4a6c7a] hover:to-[#d4a05a]"
          >
            Lập Tứ Trụ mới ✦
          </Link>
        </div>
      </div>
    </div>
  );
}
