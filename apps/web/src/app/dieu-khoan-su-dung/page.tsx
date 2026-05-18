import Link from 'next/link';

const SERIF_FONT = "'Cormorant Garamond',serif";

export const metadata = {
  title: 'Điều khoản sử dụng · Vận Mệnh',
  description:
    'Các điều khoản và điều kiện khi sử dụng dịch vụ luận giải Tử Vi của Vận Mệnh.',
};

export default function TermsOfService() {
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
        Điều khoản sử dụng
      </h1>
      <p className="mt-2 text-[13px] text-[#4a3a30]">
        Cập nhật lần cuối: 18 tháng 5 năm 2026
      </p>

      <section className="mt-8 space-y-5 text-[15px]">
        <p>
          Bằng việc truy cập và sử dụng website{' '}
          <strong>luangiaivanmenh.com</strong> (sau đây gọi là &ldquo;Vận
          Mệnh&rdquo; hoặc &ldquo;chúng tôi&rdquo;), bạn đồng ý tuân thủ các
          điều khoản dưới đây. Vui lòng đọc kỹ trước khi sử dụng dịch vụ.
        </p>

        <h2
          className="text-2xl font-semibold text-[#5a3a1a] mt-8"
          style={{ fontFamily: SERIF_FONT }}
        >
          1. Phạm vi dịch vụ
        </h2>
        <p>
          Vận Mệnh cung cấp dịch vụ luận giải Tử Vi Đẩu Số, Tứ Trụ, Tarot và các
          nội dung văn hoá tâm linh phương Đông, với sự hỗ trợ của trí tuệ nhân
          tạo. Các bản luận giải chỉ mang tính chất{' '}
          <strong>tham khảo, giải trí và định hướng tinh thần</strong>, không
          thay thế cho lời khuyên y tế, pháp lý, tài chính hay tâm lý chuyên
          môn.
        </p>

        <h2
          className="text-2xl font-semibold text-[#5a3a1a] mt-8"
          style={{ fontFamily: SERIF_FONT }}
        >
          2. Tài khoản người dùng
        </h2>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>
            Bạn cần đăng nhập qua Google hoặc email magic link để sử
            dụng dịch vụ trả phí.
          </li>
          <li>
            Bạn chịu trách nhiệm bảo mật tài khoản đăng nhập và mọi hoạt động
            phát sinh từ tài khoản của mình.
          </li>
          <li>
            Mỗi người dùng chỉ nên sử dụng 1 tài khoản. Việc lạm dụng nhiều tài
            khoản để gian lận khuyến mãi có thể dẫn đến khoá tài khoản.
          </li>
        </ul>

        <h2
          className="text-2xl font-semibold text-[#5a3a1a] mt-8"
          style={{ fontFamily: SERIF_FONT }}
        >
          3. Thanh toán và sử dụng số dư
        </h2>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>
            Người dùng nạp tiền vào ví thông qua chuyển khoản ngân hàng. Số dư
            được ghi nhận sau khi giao dịch được xác nhận thành công.
          </li>
          <li>
            Mỗi lần luận giải (Tử Vi, Tứ Trụ, Tarot, Hoàng Đạo cá nhân hoá) sẽ
            trừ một khoản phí tương ứng theo bảng giá hiển thị tại thời điểm sử
            dụng.
          </li>
          <li>
            Sau khi dịch vụ được cung cấp (bản luận giải đã sinh ra thành
            công), khoản phí <strong>không hoàn lại</strong>, trừ trường hợp lỗi
            hệ thống xác minh được từ phía chúng tôi.
          </li>
          <li>
            Số dư trong ví không có giá trị quy đổi ra tiền mặt và không tính
            lãi.
          </li>
        </ul>

        <h2
          className="text-2xl font-semibold text-[#5a3a1a] mt-8"
          style={{ fontFamily: SERIF_FONT }}
        >
          4. Quyền sở hữu nội dung
        </h2>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>
            Toàn bộ giao diện, mã nguồn, logo, văn bản hướng dẫn của Vận Mệnh
            thuộc quyền sở hữu của chúng tôi và được bảo vệ theo luật sở hữu
            trí tuệ.
          </li>
          <li>
            Các bản luận giải cá nhân hoá thuộc về người dùng đã trả phí — bạn
            có thể lưu, in, chia sẻ cho mục đích cá nhân.
          </li>
          <li>
            Cấm sao chép, phân phối hàng loạt nội dung luận giải dưới danh
            nghĩa thương mại mà không có sự đồng ý bằng văn bản.
          </li>
        </ul>

        <h2
          className="text-2xl font-semibold text-[#5a3a1a] mt-8"
          style={{ fontFamily: SERIF_FONT }}
        >
          5. Hành vi bị cấm
        </h2>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>
            Sử dụng công cụ tự động (bot, crawler) để truy cập dịch vụ ngoài
            mục đích cá nhân hợp lý.
          </li>
          <li>
            Cố tình tấn công, dò lỗi, can thiệp vào hệ thống vận hành của Vận
            Mệnh.
          </li>
          <li>
            Sử dụng dịch vụ cho mục đích vi phạm pháp luật Việt Nam, lừa đảo,
            quấy rối người khác.
          </li>
        </ul>

        <h2
          className="text-2xl font-semibold text-[#5a3a1a] mt-8"
          style={{ fontFamily: SERIF_FONT }}
        >
          6. Giới hạn trách nhiệm
        </h2>
        <p>
          Vận Mệnh cung cấp dịch vụ trên cơ sở &ldquo;nguyên trạng&rdquo;
          (as-is). Chúng tôi không chịu trách nhiệm cho bất kỳ quyết định nào
          bạn đưa ra dựa trên nội dung luận giải. Trong trường hợp xảy ra lỗi
          kỹ thuật, trách nhiệm tối đa của chúng tôi giới hạn ở việc hoàn lại
          khoản phí bạn đã trả cho lần sử dụng tương ứng.
        </p>

        <h2
          className="text-2xl font-semibold text-[#5a3a1a] mt-8"
          style={{ fontFamily: SERIF_FONT }}
        >
          7. Thay đổi điều khoản
        </h2>
        <p>
          Chúng tôi có thể cập nhật điều khoản này theo thời gian. Phiên bản
          mới nhất luôn được hiển thị tại trang này kèm ngày cập nhật. Việc bạn
          tiếp tục sử dụng dịch vụ sau khi điều khoản thay đổi được xem là
          đồng ý với phiên bản mới.
        </p>

        <h2
          className="text-2xl font-semibold text-[#5a3a1a] mt-8"
          style={{ fontFamily: SERIF_FONT }}
        >
          8. Chấm dứt dịch vụ
        </h2>
        <p>
          Bạn có thể ngừng sử dụng và yêu cầu xoá tài khoản bất cứ lúc nào — xem{' '}
          <Link href="/xoa-du-lieu" className="text-[#4a6c7a] underline">
            hướng dẫn xoá dữ liệu
          </Link>
          . Chúng tôi có quyền tạm khoá hoặc chấm dứt tài khoản nếu phát hiện vi
          phạm các điều khoản trên.
        </p>

        <h2
          className="text-2xl font-semibold text-[#5a3a1a] mt-8"
          style={{ fontFamily: SERIF_FONT }}
        >
          9. Luật áp dụng
        </h2>
        <p>
          Các điều khoản này được điều chỉnh bởi luật pháp Việt Nam. Mọi tranh
          chấp phát sinh sẽ được giải quyết thông qua thương lượng thiện chí;
          nếu không đạt được thỏa thuận, sẽ được đưa ra toà án có thẩm quyền
          tại Việt Nam.
        </p>

        <h2
          className="text-2xl font-semibold text-[#5a3a1a] mt-8"
          style={{ fontFamily: SERIF_FONT }}
        >
          10. Liên hệ
        </h2>
        <p>
          Mọi câu hỏi về điều khoản sử dụng, vui lòng liên hệ:{' '}
          <strong>tuanmanh97x@gmail.com</strong>
        </p>

        <p className="mt-8 text-[13px] text-[#4a3a30] italic">
          Xem thêm:{' '}
          <Link
            href="/chinh-sach-bao-mat"
            className="text-[#4a6c7a] underline"
          >
            Chính sách bảo mật
          </Link>
        </p>
      </section>
    </article>
  );
}
