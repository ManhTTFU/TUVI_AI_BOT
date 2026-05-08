/**
 * Tra cứu truyền thống: việc nên làm / nên kiêng theo 12 sao Ngọc Hạp,
 * hướng xuất hành (Hỷ thần + Tài thần) theo Can ngày.
 */

import type { Star } from './hoang-dao.js';

interface StarAdvice {
  nen: string[];
  kieng: string[];
}

/** Bảng khuyến nghị theo trực ngày (sao Ngọc Hạp của ngày). */
const STAR_ADVICE: Record<string, StarAdvice> = {
  'Thanh Long': {
    nen: ['Cầu tài', 'Khai trương', 'Cưới hỏi', 'Xuất hành', 'Giao dịch'],
    kieng: ['Động thổ', 'Chôn cất'],
  },
  'Minh Đường': {
    nen: ['Yết kiến quý nhân', 'Xây dựng', 'Kết bạn', 'Đính hôn'],
    kieng: ['Tranh chấp', 'Ký kết hợp đồng lớn'],
  },
  'Kim Quỹ': {
    nen: ['Hôn lễ', 'Cầu tài', 'Khai trương', 'Nhập trạch'],
    kieng: ['Tố tụng', 'Mai táng'],
  },
  'Thiên Đức': {
    nen: ['Vạn sự đều lành', 'Cầu phúc', 'Dâng sớ', 'Cưới hỏi'],
    kieng: ['Không có điều đặc biệt cần kiêng'],
  },
  'Ngọc Đường': {
    nen: ['Yến tiệc', 'Cầu tài', 'Đi xa', 'Sửa nhà'],
    kieng: ['Động thổ', 'Lợp mái'],
  },
  'Tư Mệnh': {
    nen: ['Dâng sớ', 'Đàm phán', 'Thi cử', 'Xuất hành'],
    kieng: ['Cử sự quan trọng về đêm'],
  },
  'Thiên Hình': {
    nen: ['Săn bắn', 'Tế tự'],
    kieng: ['Khởi tạo', 'Kiện tụng', 'Tranh chấp'],
  },
  'Chu Tước': {
    nen: ['Cầu tự'],
    kieng: ['Ký kết', 'Họp bàn', 'Giao thiệp'],
  },
  'Bạch Hổ': {
    nen: ['Sửa kho', 'Xây tường'],
    kieng: ['Xuất hành', 'Đi xa', 'Săn bắn'],
  },
  'Thiên Lao': {
    nen: ['Tế tự'],
    kieng: ['Giam cầm', 'Chuyển dời', 'Khởi sự'],
  },
  'Nguyên Vũ': {
    nen: ['Không có việc đặc biệt nên làm'],
    kieng: ['Du lịch', 'Thủy vận', 'Cưới hỏi'],
  },
  'Câu Trần': {
    nen: ['Tế tự'],
    kieng: ['Kiện tụng', 'Giao dịch', 'Xuất hành'],
  },
};

export function getStarAdvice(star: Star): StarAdvice {
  return (
    STAR_ADVICE[star.name] ?? {
      nen: [],
      kieng: [],
    }
  );
}

/**
 * Hướng Hỷ thần & Tài thần theo Can ngày (bảng truyền thống).
 * Dùng cho "Hướng xuất hành" — lấy 2 hướng tốt nhất trong ngày.
 */
const DIRECTIONS_BY_CAN: Record<string, { hy: string; tai: string }> = {
  Giáp: { hy: 'Đông Bắc', tai: 'Đông Nam' },
  Ất: { hy: 'Tây Bắc', tai: 'Đông Nam' },
  Bính: { hy: 'Tây Nam', tai: 'Đông' },
  Đinh: { hy: 'Nam', tai: 'Đông' },
  Mậu: { hy: 'Đông Nam', tai: 'Bắc' },
  Kỷ: { hy: 'Đông Bắc', tai: 'Bắc' },
  Canh: { hy: 'Tây Bắc', tai: 'Đông' },
  Tân: { hy: 'Tây Nam', tai: 'Đông' },
  Nhâm: { hy: 'Nam', tai: 'Nam' },
  Quý: { hy: 'Đông Nam', tai: 'Nam' },
};

export interface LuckyDirections {
  hyThan: string;
  taiThan: string;
  /** Format "Đông Nam, Bắc" để hiển thị gọn. */
  combined: string;
}

export function getLuckyDirections(dayCan: string): LuckyDirections {
  const d = DIRECTIONS_BY_CAN[dayCan] ?? { hy: '—', tai: '—' };
  const combined =
    d.hy === d.tai ? d.hy : [d.hy, d.tai].filter((x) => x !== '—').join(', ');
  return { hyThan: d.hy, taiThan: d.tai, combined };
}
