import type { Metadata } from 'next';
import NgayTotClient from '@/components/ngay-tot/NgayTotClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { serviceSchema, breadcrumbSchema, faqSchema } from '@/lib/seo-schemas';

export const metadata: Metadata = {
  title: 'Xem Ngày Tốt — Lịch Vạn Niên',
  description:
    'Lịch vạn niên — Đối chiếu hoàng đạo, hắc đạo, can chi tứ trụ và giờ tốt cho mọi việc trọng đại: cưới hỏi, khai trương, xuất hành, động thổ, nhập trạch.',
  alternates: { canonical: '/ngay-tot' },
};

const FAQS = [
  {
    q: 'Ngày hoàng đạo và hắc đạo khác nhau thế nào?',
    a: 'Hoàng đạo là 6 ngày trong mỗi tháng âm lịch được 6 sao tốt chiếu (Thanh Long, Minh Đường, Kim Quỹ, Thiên Đức, Ngọc Đường, Tư Mệnh) — phù hợp cưới hỏi, khai trương, ký kết, xuất hành. Hắc đạo là 6 ngày còn lại bị 6 sao xấu chiếu (Thiên Hình, Chu Tước, Bạch Hổ, Thiên Lao, Huyền Vũ, Câu Trận) — nên tránh việc trọng đại. Mỗi tháng có đủ 6 hoàng + 6 hắc theo bảng Ngọc Hạp Thông Thư.',
  },
  {
    q: 'Cách chọn ngày tốt cho cưới hỏi?',
    a: 'Bước 1: chọn tháng âm phù hợp (tránh tháng 7 cô hồn, tháng đại lợi của tuổi cô dâu/chú rể). Bước 2: lọc ngày hoàng đạo trong tháng. Bước 3: kiểm tra trực ngày (12 trực: Kiến/Trừ/Mãn/Bình/Định/Chấp/Phá/Nguy/Thành/Thâu/Khai/Bế) — "Thành", "Khai", "Mãn" tốt cho cưới; tránh "Phá", "Nguy". Bước 4: hợp tuổi 2 bên (tránh năm "Kim Lâu" cô dâu).',
  },
  {
    q: 'Cách chọn giờ hoàng đạo trong ngày?',
    a: 'Mỗi ngày có 6 trong 12 canh giờ là giờ hoàng đạo, theo công thức: chi giờ cách chi ngày một khoảng cố định trong bảng tra. Ví dụ ngày Tý có giờ hoàng đạo là Tý/Sửu/Mão/Ngọ/Thân/Dậu. Chọn giờ hoàng đạo cho việc quan trọng (đón dâu, ký hợp đồng, động thổ). Hệ thống Lịch Vạn Niên trên trang tự liệt 6 giờ hoàng đạo + tên sao của ngày bạn chọn.',
  },
  {
    q: 'Trực ngày là gì?',
    a: 'Trực ngày là 1 trong 12 sao Ngọc Hạp (Kiến/Trừ/Mãn/Bình/Định/Chấp/Phá/Nguy/Thành/Thâu/Khai/Bế) ứng với mỗi ngày trong tháng âm. Mỗi trực có việc nên làm và việc kỵ kèm theo — ví dụ trực "Thành" nên cưới hỏi/khai trương; trực "Phá" kỵ khởi công/cưới hỏi nhưng tốt cho phá dỡ/đào giếng. Hệ thống tự show danh sách việc nên/kiêng theo trực của ngày bạn chọn.',
  },
  {
    q: 'Lịch Vạn Niên trên trang dùng thuật toán nào?',
    a: 'Dùng thuật toán Hồ Ngọc Đức — chuẩn vàng cho lịch âm Việt Nam, múi giờ +7 (GMT+7). Khác với các thư viện npm phổ biến dùng múi +8 (Trung Quốc) hay lệch 1 ngày ở biên tháng âm. Đã verify khớp với các mốc lịch sử (17/2/2026, 30/4/1975, 2/9/1945) chính xác 100%.',
  },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={serviceSchema({
          name: 'Xem Ngày Tốt — Lịch Vạn Niên',
          description:
            'Tra cứu ngày hoàng đạo, giờ tốt theo can chi tứ trụ cho cưới hỏi, khai trương, xuất hành, động thổ, nhập trạch.',
          path: '/ngay-tot',
          serviceType: 'Astrological Calendar',
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Trang chủ', path: '/' },
          { name: 'Xem Ngày Tốt', path: '/ngay-tot' },
        ])}
      />
      <JsonLd data={faqSchema(FAQS)} />
      <NgayTotClient />
    </>
  );
}
