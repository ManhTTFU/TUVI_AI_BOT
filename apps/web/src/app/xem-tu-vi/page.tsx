import type { Metadata } from 'next';
import TuviClient from '@/components/tu-vi/TuviClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { serviceSchema, breadcrumbSchema, faqSchema } from '@/lib/seo-schemas';

export const metadata: Metadata = {
  title: 'Xem Tử Vi — Lập lá số 14 chính tinh',
  description:
    'Lập lá số tử vi 14 chính tinh — luận giải 12 cung, sự nghiệp, tình duyên, tài lộc theo Can Chi và mệnh nạp âm.',
  alternates: { canonical: '/xem-tu-vi' },
};

const FAQS = [
  {
    q: 'Tử Vi Đẩu Số là gì?',
    a: 'Tử Vi Đẩu Số là môn chiêm tinh truyền thống của Trung Hoa và Việt Nam, dùng 14 chính tinh và hơn 100 phụ tinh sắp xếp lên 12 cung địa chi để luận giải vận mệnh con người. Lá số được lập theo năm tháng ngày giờ sinh chuyển sang Can Chi, mỗi cung phản ánh một khía cạnh cuộc sống: mệnh, phụ mẫu, phúc đức, điền trạch, quan lộc, nô bộc, thiên di, tật ách, tài bạch, tử tức, phu thê, huynh đệ.',
  },
  {
    q: 'Cần thông tin gì để lập lá số tử vi?',
    a: 'Cần 4 thông tin: họ tên (để xưng hô), giới tính (nam/nữ — quyết định chiều khởi đại hạn), ngày tháng năm sinh dương lịch, và giờ sinh chính xác đến canh giờ (12 canh giờ theo địa chi Tý Sửu Dần... mỗi canh 2 tiếng). Sai giờ sinh có thể khiến mệnh thân nằm sai cung, ảnh hưởng cả lá số.',
  },
  {
    q: 'Lá số tử vi luận giải bằng AI có chính xác không?',
    a: 'Phép lập lá số (định cung, an sao, tính đại hạn) là phép toán cố định 100% chính xác dựa trên Can Chi. Phần luận giải dùng AI Deepseek tổng hợp tri thức tử vi truyền thống — chính xác cho tổng quan và hướng vận trình, nhưng không thể thay thế tham vấn riêng tư với thầy tử vi có kinh nghiệm cho các quyết định lớn như hôn nhân, đầu tư, thay đổi nghề nghiệp.',
  },
  {
    q: 'Tại sao xem tử vi có phí 40.000đ?',
    a: 'Phí dùng để chi trả chi phí AI Deepseek luận giải 6 cung mệnh chính + 4 luận giải nâng cao (đại hạn 10 năm, tiểu hạn năm hiện tại, luận tháng, lời khuyên), cộng chi phí hạ tầng (server, DB, lưu trữ lá số). Mỗi lá số tốn nhiều token AI, không thể miễn phí toàn bộ.',
  },
  {
    q: 'Xem xong rồi có truy cập lại lá số được không?',
    a: 'Có. Sau khi lập lá số thành công, bạn vào mục "Lịch sử" trên menu để xem lại tất cả lá số đã lập, miễn phí. Bạn cũng có thể tải về PDF luận giải để giữ ngoại tuyến.',
  },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={serviceSchema({
          name: 'Luận giải Tử Vi Đẩu Số',
          description:
            'Lập lá số tử vi 14 chính tinh, luận giải 12 cung mệnh thân, sự nghiệp, tình duyên, tài lộc bằng AI.',
          path: '/xem-tu-vi',
          serviceType: 'Astrology Reading',
          priceVnd: 40000,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Trang chủ', path: '/' },
          { name: 'Xem Tử Vi', path: '/xem-tu-vi' },
        ])}
      />
      <JsonLd data={faqSchema(FAQS)} />
      <TuviClient />
    </>
  );
}
