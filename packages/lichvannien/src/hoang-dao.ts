/**
 * Hệ 12 sao Ngọc Hạp — tính sao ngày (theo chi tháng) và giờ hoàng đạo (theo chi ngày).
 *
 * Nguyên lý (chung cho ngày và giờ):
 *   - 12 sao xếp cố định theo thứ tự từ Thanh Long → Câu Trần.
 *   - Điểm khởi (sao Thanh Long) đặt tại một chi nhất định, xoay theo chi "gốc":
 *       Dần/Thân → khởi Tý, Mão/Dậu → Dần, Thìn/Tuất → Thìn,
 *       Tỵ/Hợi  → Ngọ, Tý/Ngọ  → Thân, Sửu/Mùi → Tuất.
 *     Công thức gọn: startChi = ((chiBase - 2 + 12) mod 6) * 2
 *   - Với hoàng đạo NGÀY: chi gốc = chi tháng âm, sao rơi vào chi ngày.
 *   - Với hoàng đạo GIỜ: chi gốc = chi ngày, sao rơi vào chi giờ.
 */

import { CHI, type Chi } from './can-chi.js';

export type StarKind = 'hoang-dao' | 'hac-dao';

export interface Star {
  name: string;
  kind: StarKind;
}

/** 12 sao theo thứ tự khởi từ điểm bắt đầu. H = hoàng đạo (tốt), K = hắc đạo (xấu). */
export const TWELVE_STARS: readonly Star[] = [
  { name: 'Thanh Long', kind: 'hoang-dao' }, // 0 H
  { name: 'Minh Đường', kind: 'hoang-dao' }, // 1 H
  { name: 'Thiên Hình', kind: 'hac-dao' }, // 2 K
  { name: 'Chu Tước', kind: 'hac-dao' }, // 3 K
  { name: 'Kim Quỹ', kind: 'hoang-dao' }, // 4 H
  { name: 'Thiên Đức', kind: 'hoang-dao' }, // 5 H
  { name: 'Bạch Hổ', kind: 'hac-dao' }, // 6 K
  { name: 'Ngọc Đường', kind: 'hoang-dao' }, // 7 H
  { name: 'Thiên Lao', kind: 'hac-dao' }, // 8 K
  { name: 'Nguyên Vũ', kind: 'hac-dao' }, // 9 K
  { name: 'Tư Mệnh', kind: 'hoang-dao' }, // 10 H
  { name: 'Câu Trần', kind: 'hac-dao' }, // 11 K
];

function startChiIndex(baseChiIndex: number): number {
  return (((baseChiIndex - 2) % 6) + 6) % 6 * 2;
}

/** Trả về sao Ngọc Hạp của 1 chi (giờ hoặc ngày) dựa vào chi gốc (tháng hoặc ngày). */
function getStar(baseChiIndex: number, targetChiIndex: number): Star {
  const start = startChiIndex(baseChiIndex);
  const offset = ((targetChiIndex - start) % 12 + 12) % 12;
  return TWELVE_STARS[offset];
}

/** Sao của 1 ngày, dựa vào chi tháng âm + chi ngày. */
export function getDayStar(monthChiIndex: number, dayChiIndex: number): Star {
  return getStar(monthChiIndex, dayChiIndex);
}

export interface HourStar {
  /** Index chi giờ (0=Tý, 1=Sửu, ..., 11=Hợi). */
  chiIndex: number;
  /** Tên chi giờ. */
  chi: Chi;
  /** Range giờ dương lịch hiển thị, vd "23:00 – 01:00". */
  range: string;
  star: Star;
}

const HOUR_RANGES: readonly string[] = [
  '23:00 – 01:00', // Tý
  '01:00 – 03:00', // Sửu
  '03:00 – 05:00', // Dần
  '05:00 – 07:00', // Mão
  '07:00 – 09:00', // Thìn
  '09:00 – 11:00', // Tỵ
  '11:00 – 13:00', // Ngọ
  '13:00 – 15:00', // Mùi
  '15:00 – 17:00', // Thân
  '17:00 – 19:00', // Dậu
  '19:00 – 21:00', // Tuất
  '21:00 – 23:00', // Hợi
];

/** 12 canh giờ của 1 ngày, kèm sao Ngọc Hạp. */
export function getHourStars(dayChiIndex: number): HourStar[] {
  return HOUR_RANGES.map((range, i) => ({
    chiIndex: i,
    chi: CHI[i],
    range,
    star: getStar(dayChiIndex, i),
  }));
}

/** Chỉ lọc các giờ hoàng đạo (tốt). */
export function getLuckyHours(dayChiIndex: number): HourStar[] {
  return getHourStars(dayChiIndex).filter((h) => h.star.kind === 'hoang-dao');
}
