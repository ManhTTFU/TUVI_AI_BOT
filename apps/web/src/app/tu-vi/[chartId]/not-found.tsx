import Link from 'next/link';

const SERIF_FONT = "'Cormorant Garamond',serif";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1
        className="font-serif text-4xl text-[#0f0a08]"
        style={{ fontFamily: SERIF_FONT }}
      >
        Không tìm thấy <em className="text-[#4a6c7a]">lá số</em>
      </h1>
      <p className="mt-3 text-[#4a3a30]">
        Đường dẫn không hợp lệ, lá số chưa tồn tại, hoặc bạn không có quyền xem.
      </p>
      <div className="mt-6 flex gap-3 justify-center flex-wrap">
        <Link
          href="/lich-su"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#4a6c7a]/45 text-[#4a3a30] font-semibold text-[13.5px] hover:bg-[#fbf3e2]/70"
        >
          ← Lịch sử của tôi
        </Link>
        <Link
          href="/xem-tu-vi"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#5a3a1a] to-[#c89146] text-[#fbf3e2] font-semibold text-[13.5px] hover:from-[#4a6c7a] hover:to-[#d4a05a]"
        >
          ✦ Lập lá số mới
        </Link>
      </div>
    </section>
  );
}
