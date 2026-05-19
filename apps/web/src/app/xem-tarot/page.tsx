import type { Metadata } from 'next';
import TarotClient from './TarotClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { serviceSchema, breadcrumbSchema, faqSchema } from '@/lib/seo-schemas';

export const metadata: Metadata = {
  title: 'Xem Tarot · Trải bài 78 lá Rider-Waite — Vận Mệnh',
  description:
    'Trải bài Tarot Rider-Waite-Smith 78 lá, vuốt chọn lá theo trực giác, luận giải cá nhân hóa cho tình duyên, sự nghiệp, tài chính, sức khỏe.',
  alternates: { canonical: '/xem-tarot' },
};

const FAQS = [
  {
    q: 'Tarot Rider-Waite-Smith là gì?',
    a: 'Rider-Waite-Smith (RWS) là bộ bài Tarot 78 lá kinh điển thiết kế bởi Arthur Edward Waite và họa sĩ Pamela Colman Smith năm 1909, do nhà xuất bản Rider phát hành. Bộ gồm 22 lá Major Arcana (ý nghĩa lớn về số phận, ngã rẽ cuộc đời) và 56 lá Minor Arcana (4 hệ Cups/Wands/Swords/Pentacles ứng với tình cảm/sự nghiệp/tư duy/tài chính). Đây là bộ Tarot phổ biến nhất thế giới hiện nay.',
  },
  {
    q: 'Trải bài Tarot có chính xác không?',
    a: 'Tarot không phải khoa học tiên đoán tương lai cứng nhắc. Tarot phản ánh trực giác của người bốc bài tại thời điểm đặt câu hỏi, giúp soi chiếu các khía cạnh tiềm ẩn của tình huống hiện tại và đưa ra góc nhìn mới. Mức độ "chính xác" phụ thuộc bạn đặt câu hỏi cụ thể đến đâu và cởi mở với gợi ý đến đâu. Coi như công cụ phản tư thay vì lời tiên tri.',
  },
  {
    q: 'Cần chuẩn bị gì trước khi xem Tarot?',
    a: 'Cần 3 thứ: (1) một câu hỏi cụ thể bạn đang băn khoăn — tránh hỏi quá chung chung như "tương lai tôi thế nào", thay bằng "tôi nên ở lại công việc hiện tại hay chuyển sang chỗ mới?"; (2) tâm thế bình tĩnh, không vừa lúc đang quá xúc động hoặc phán xét trước; (3) chọn số lá rút từ 3 đến 7 — càng nhiều lá càng có nhiều góc nhìn nhưng cũng phức tạp hơn để liên kết.',
  },
  {
    q: 'Cùng câu hỏi xem 2 lần có ra kết quả khác không?',
    a: 'Có. Tarot không deterministic — mỗi lần shuffle + rút bài là 1 lần lấy mẫu mới từ ~12 triệu combo (cho rút 5 lá từ 78). Cùng câu hỏi có thể ra combo bài khác, từ đó phần luận giải cá nhân hóa cũng khác. Đây là tính chất chứ không phải lỗi — Tarot là công cụ phản tư, nhiều góc nhìn càng đầy đủ.',
  },
  {
    q: 'Tại sao xem Tarot có phí 5.000đ?',
    a: 'Phí cover chi phí AI Deepseek luận giải từng lá bài + ý nghĩa tổng thể trải bài + phần personalize theo tên + câu hỏi của bạn. Mỗi lần xem ~6-8 lần gọi AI, không thể miễn phí. Mức 5.000đ tương đương 1 ly trà đá, đủ rẻ để xem thường xuyên.',
  },
];

export default function Page() {
  return (
    <>
      <JsonLd
        data={serviceSchema({
          name: 'Bói bài Tarot',
          description:
            'Trải bài Tarot Rider-Waite-Smith 78 lá, luận giải cá nhân hóa cho tình duyên, sự nghiệp, tài chính, sức khỏe.',
          path: '/xem-tarot',
          serviceType: 'Tarot Reading',
          priceVnd: 5000,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Trang chủ', path: '/' },
          { name: 'Xem Tarot', path: '/xem-tarot' },
        ])}
      />
      <JsonLd data={faqSchema(FAQS)} />
      <TarotClient />
    </>
  );
}
