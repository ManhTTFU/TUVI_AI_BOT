import type { Metadata } from 'next';
import TuTruClient from '@/components/tu-tru/TuTruClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { serviceSchema, breadcrumbSchema, faqSchema } from '@/lib/seo-schemas';

export const metadata: Metadata = {
  title: 'Tứ Trụ Bát Tự — Luận giải bản mệnh, sự nghiệp, tài lộc, hôn nhân',
  description:
    'Lập Tứ Trụ Bát Tự theo năm/tháng/ngày/giờ sinh — luận giải Nhật chủ, dụng thần, kỵ thần, ngũ hành nạp âm, sự nghiệp, tài lộc, tình duyên, hôn nhân cá nhân hóa.',
  alternates: { canonical: '/tu-tru-bat-tu' },
};

const FAQS = [
  {
    q: 'Tứ Trụ Bát Tự là gì?',
    a: 'Tứ Trụ Bát Tự (còn gọi Bát Tự, 八字 — "8 chữ") là môn mệnh lý cổ truyền Trung Hoa, lập bản mệnh từ 4 trụ năm/tháng/ngày/giờ sinh chuyển sang Can Chi — tổng 8 chữ. Mỗi trụ phản ánh một giai đoạn: trụ năm = tổ tiên + tuổi thiếu niên, trụ tháng = cha mẹ + tuổi trẻ, trụ ngày = bản thân + vợ/chồng + tuổi trung niên, trụ giờ = con cái + tuổi già. Phân tích Ngũ Hành (Kim Mộc Thủy Hỏa Thổ) trong 8 chữ để định Dụng Thần.',
  },
  {
    q: 'Khác biệt giữa Tử Vi và Tứ Trụ?',
    a: 'Tử Vi dùng 14 chính tinh đặt lên 12 cung — chú trọng "ai làm gì với ai" trong cuộc đời (mệnh, phụ mẫu, huynh đệ, phu thê...). Tứ Trụ chỉ có 8 chữ Can Chi — chú trọng "cấu hình Ngũ Hành" và năng lượng vận hành theo từng giai đoạn. Tử Vi "có hình ảnh" hơn (12 cung như 12 căn phòng), Tứ Trụ "có nhịp" hơn (đại vận thay 10 năm một lần). Nhiều người dùng cả hai để bù đắp góc nhìn.',
  },
  {
    q: 'Cần thông tin gì để lập Tứ Trụ?',
    a: 'Cần ngày tháng năm sinh dương lịch + giờ sinh chính xác đến canh giờ (12 canh giờ theo địa chi, mỗi canh 2 tiếng), cộng giới tính (nam/nữ quyết định chiều khởi đại vận). Sai giờ sinh sẽ đổi trụ giờ — ảnh hưởng đặc biệt mạnh đến cung con cái và tuổi già.',
  },
  {
    q: 'Dụng thần, kỵ thần là gì?',
    a: 'Dụng thần là Ngũ Hành "hữu ích" cho Nhật Chủ (Thiên Can của trụ ngày) — bổ sung sức mạnh hoặc cân bằng. Kỵ thần là Ngũ Hành "có hại" — làm Nhật Chủ mất cân đối. Biết Dụng/Kỵ giúp chọn ngành nghề (Mộc làm sách báo, Hỏa làm ẩm thực, Kim làm cơ khí...), màu sắc, hướng nhà, ngày tốt phù hợp tăng vượng khí.',
  },
  {
    q: 'Tứ Trụ có dự đoán được tuổi thọ không?',
    a: 'Không. Tứ Trụ phản ánh xu hướng năng lượng vận hành — sức khỏe yếu/mạnh theo từng đại vận 10 năm, hoặc các năm có Ngũ Hành xung khắc Nhật Chủ. Không có công thức "tuổi thọ" cố định. Bất kỳ thầy nào quả quyết "anh sống đến X tuổi" đều đang dọa hoặc tự phong — bỏ qua.',
  },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={serviceSchema({
          name: 'Luận giải Tứ Trụ Bát Tự',
          description:
            'Lập Tứ Trụ Bát Tự theo năm/tháng/ngày/giờ sinh — luận giải Nhật chủ, dụng thần, ngũ hành, sự nghiệp, tài lộc, hôn nhân.',
          path: '/tu-tru-bat-tu',
          serviceType: 'BaZi Reading',
          priceVnd: 5000,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Trang chủ', path: '/' },
          { name: 'Tứ Trụ Bát Tự', path: '/tu-tru-bat-tu' },
        ])}
      />
      <JsonLd data={faqSchema(FAQS)} />
      <TuTruClient />
    </>
  );
}
