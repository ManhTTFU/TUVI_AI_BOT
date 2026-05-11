import Link from 'next/link';

const SERIF_FONT = "'Cormorant Garamond',serif";

export const metadata = {
  title: 'Xóa dữ liệu · Diễn Cầm Tam Thế',
  description: 'Cách yêu cầu xóa toàn bộ dữ liệu cá nhân khỏi hệ thống.',
};

export default function DataDeletion() {
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
        Xóa dữ liệu cá nhân
      </h1>
      <p className="mt-2 text-[13px] text-[#4a3a30]">
        Hướng dẫn yêu cầu xóa tài khoản và toàn bộ dữ liệu liên quan.
      </p>

      <section className="mt-8 space-y-5 text-[15px]">
        <h2
          className="text-2xl font-semibold text-[#5a3a1a] mt-8"
          style={{ fontFamily: SERIF_FONT }}
        >
          Cách tự xóa tài khoản (đang phát triển)
        </h2>
        <p>
          Tính năng tự xóa tài khoản qua giao diện đang được phát triển. Trong
          thời gian này, vui lòng yêu cầu xóa qua email.
        </p>

        <h2
          className="text-2xl font-semibold text-[#5a3a1a] mt-8"
          style={{ fontFamily: SERIF_FONT }}
        >
          Yêu cầu xóa qua email
        </h2>
        <p>Gửi email tới <strong>support@diencam.vn</strong> với nội dung:</p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>Tiêu đề: <strong>Yêu cầu xóa dữ liệu cá nhân</strong></li>
          <li>Email đăng ký tài khoản</li>
          <li>Lý do (tuỳ chọn)</li>
        </ul>
        <p>
          Chúng tôi sẽ xác nhận và xóa toàn bộ dữ liệu trong vòng{' '}
          <strong>7 ngày làm việc</strong>:
        </p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>Tài khoản đăng nhập (Google / Facebook / Email link)</li>
          <li>Tất cả lá số tử vi đã lập</li>
          <li>Lịch sử giao dịch và số dư còn lại (sẽ hoàn lại nếu &gt; 0)</li>
          <li>Session và cookie</li>
        </ul>

        <h2
          className="text-2xl font-semibold text-[#5a3a1a] mt-8"
          style={{ fontFamily: SERIF_FONT }}
        >
          Dữ liệu giữ lại theo nghĩa vụ pháp lý
        </h2>
        <p>
          Chỉ giữ lại các bản ghi giao dịch tài chính (anonymized — không kèm
          email/tên) theo quy định kế toán và thuế của Việt Nam (5 năm).
        </p>

        <h2
          className="text-2xl font-semibold text-[#5a3a1a] mt-8"
          style={{ fontFamily: SERIF_FONT }}
        >
          Yêu cầu xóa từ Facebook / Google
        </h2>
        <p>
          Nếu bạn đăng nhập bằng Facebook hoặc Google và muốn xóa quyền truy cập
          của Diễn Cầm Tam Thế:
        </p>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>
            <strong>Facebook:</strong> Settings → Business Integrations → Diễn
            Cầm Tam Thế → Remove
          </li>
          <li>
            <strong>Google:</strong>{' '}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#4a6c7a] underline"
            >
              myaccount.google.com/permissions
            </a>{' '}
            → Diễn Cầm Tam Thế → Remove access
          </li>
        </ul>
        <p>
          Việc xoá ở mạng xã hội chỉ rút quyền OAuth — KHÔNG xoá dữ liệu trong
          hệ thống của chúng tôi. Phải gửi email để xoá hoàn toàn.
        </p>
      </section>
    </article>
  );
}
