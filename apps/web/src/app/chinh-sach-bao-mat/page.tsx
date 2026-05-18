import Link from 'next/link';

const SERIF_FONT = "'Cormorant Garamond',serif";

export const metadata = {
  title: 'Chính sách bảo mật · Vận Mệnh',
  description:
    'Cách Vận Mệnh thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn.',
};

export default function PrivacyPolicy() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-12 text-[#0f0a08] leading-[1.85]">
      <Link
        href="/"
        className="text-[11px] tracking-[0.3em] text-[#4a6c7a] hover:text-[#5a3a1a] uppercase"
      >
        ← Trang chủ
      </Link>
      <h1
        className="mt-4 text-4xl md:text-5xl font-serif italic text-[#0f0a08]"
        style={{ fontFamily: SERIF_FONT }}
      >
        Chính sách bảo mật
      </h1>
      <p className="mt-2 text-[13px] text-[#4a3a30]">
        Cập nhật lần cuối: 11 tháng 5 năm 2026
      </p>

      <section className="mt-8 space-y-5 text-[15px]">
        <h2
          className="text-2xl font-semibold text-[#5a3a1a] mt-8"
          style={{ fontFamily: SERIF_FONT }}
        >
          1. Thông tin chúng tôi thu thập
        </h2>
        <p>
          Vận Mệnh thu thập các thông tin tối thiểu để cung cấp dịch vụ
          luận giải Tử Vi Đẩu Số:
        </p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>
            <strong>Thông tin tài khoản:</strong> email, tên, ảnh đại diện (qua
            Google OAuth hoặc email magic link).
          </li>
          <li>
            <strong>Thông tin lá số:</strong> họ tên, giới tính, ngày tháng năm
            sinh, giờ sinh — để tính toán lá số tử vi cá nhân hóa.
          </li>
          <li>
            <strong>Giao dịch:</strong> lịch sử nạp tiền, sử dụng dịch vụ.
          </li>
          <li>
            <strong>Cookie kỹ thuật:</strong> session để duy trì đăng nhập.
          </li>
        </ul>

        <h2
          className="text-2xl font-semibold text-[#5a3a1a] mt-8"
          style={{ fontFamily: SERIF_FONT }}
        >
          2. Cách sử dụng thông tin
        </h2>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>Tính toán và lưu trữ lá số tử vi cá nhân của bạn.</li>
          <li>Gửi nội dung tóm tắt lá số đến nhà cung cấp dịch vụ sinh văn để tạo bản luận giải cá nhân hóa.</li>
          <li>Quản lý số dư ví và giao dịch.</li>
          <li>Cải thiện chất lượng dịch vụ.</li>
        </ul>
        <p>
          Chúng tôi <strong>KHÔNG bán</strong> dữ liệu cá nhân của bạn cho bất kỳ
          bên thứ ba nào.
        </p>

        <h2
          className="text-2xl font-semibold text-[#5a3a1a] mt-8"
          style={{ fontFamily: SERIF_FONT }}
        >
          3. Chia sẻ với bên thứ ba
        </h2>
        <p>Một số nội dung được gửi đến đối tác kỹ thuật:</p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>
            <strong>Deepseek:</strong> đối tác kỹ thuật xử lý nội dung tóm tắt lá số
            (KHÔNG kèm email/tên) để sinh văn luận giải.
          </li>
          <li>
            <strong>Google:</strong> chỉ trong quá trình xác thực
            đăng nhập, nhận về email + tên + avatar.
          </li>
          <li>
            <strong>Nhà cung cấp hạ tầng:</strong> Neon (database), Vercel
            (hosting) — dữ liệu được mã hoá khi truyền và lưu.
          </li>
        </ul>

        <h2
          className="text-2xl font-semibold text-[#5a3a1a] mt-8"
          style={{ fontFamily: SERIF_FONT }}
        >
          4. Bảo mật
        </h2>
        <p>
          Dữ liệu được mã hoá khi truyền (HTTPS/TLS) và mã hoá khi lưu trữ
          (encryption at rest). Mật khẩu KHÔNG bao giờ được lưu — chúng tôi
          chỉ dùng OAuth / magic link.
        </p>

        <h2
          className="text-2xl font-semibold text-[#5a3a1a] mt-8"
          style={{ fontFamily: SERIF_FONT }}
        >
          5. Quyền của bạn
        </h2>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>Truy cập + tải xuống toàn bộ dữ liệu cá nhân của bạn.</li>
          <li>
            Yêu cầu xóa tài khoản và dữ liệu — xem{' '}
            <Link href="/xoa-du-lieu" className="text-[#4a6c7a] underline">
              hướng dẫn xóa dữ liệu
            </Link>
            .
          </li>
          <li>Rút lại sự đồng ý bất cứ lúc nào bằng cách xoá tài khoản.</li>
        </ul>

        <h2
          className="text-2xl font-semibold text-[#5a3a1a] mt-8"
          style={{ fontFamily: SERIF_FONT }}
        >
          6. Liên hệ
        </h2>
        <p>
          Email: <strong>tuanmanh97x@gmail.com</strong>
        </p>
      </section>
    </article>
  );
}
