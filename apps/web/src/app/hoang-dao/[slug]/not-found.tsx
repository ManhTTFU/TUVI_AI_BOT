import Link from 'next/link';

const SERIF_FONT = "'Cormorant Garamond',serif";

export default function NotFound() {
  return (
    <section className="relative px-6 py-24">
      <div className="max-w-2xl mx-auto text-center">
        <div className="text-[11px] tracking-[0.4em] uppercase text-[#4a6c7a] font-semibold">
          404 · Không tìm thấy
        </div>
        <h1
          className="mt-4 text-5xl font-serif text-[#0f0a08]"
          style={{ fontFamily: SERIF_FONT }}
        >
          Cung hoàng đạo <em className="text-[#5a3a1a]">không tồn tại</em>
        </h1>
        <p className="mt-4 text-[#4a3a30]">
          Đường dẫn bạn truy cập không khớp với 12 cung Tây Phương. Quay lại
          danh sách để chọn cung khác.
        </p>
        <Link
          href="/hoang-dao"
          className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#5a3a1a] text-[#fbf3e2] hover:bg-[#4a6c7a] transition"
        >
          ← Xem 12 Cung Hoàng Đạo
        </Link>
      </div>
    </section>
  );
}
