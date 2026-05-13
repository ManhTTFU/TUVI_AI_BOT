/**
 * Wrapper trên thư viện `horoscope` (npm) — chỉ tính sign từ {month, day}.
 * Bổ sung metadata tiếng Việt + ngày-tháng range (lib không có).
 *
 * Trả thành SignVi: name VN + symbol + nguyên tố + range + en — dùng chung
 * cho HomeClient.tsx (section Horoscope) và HoangDaoClient.tsx (Grid).
 *
 * Daily reading text vẫn curated thủ công trong `home-data.ts` (lib không
 * trả nội dung luận giải) — chỉ "ràng buộc" về metadata được lib chuẩn hóa.
 */
// @ts-expect-error — horoscope không có @types, library tự khai báo trong index.js
import { getSign as libGetSign, getZodiac as libGetZodiac } from 'horoscope';

export type Element = 'Lửa' | 'Đất' | 'Khí' | 'Nước';

export interface SignVi {
  /** Sign tiếng Anh, khớp giá trị library trả (Aries, Taurus, …). */
  en: string;
  /** Sign tiếng Việt — name canonical. */
  name: string;
  /** Ký hiệu Unicode. */
  sym: string;
  el: Element;
  /** Khoảng ngày trong năm (dd/M – dd/M). */
  range: string;
  /** Slug URL (matchs ZODIAC_DETAILS). */
  slug: string;
}

const META: SignVi[] = [
  { en: 'Aries',       name: 'Bạch Dương', sym: '♈', el: 'Lửa',  range: '21/3 – 19/4',  slug: 'bach-duong' },
  { en: 'Taurus',      name: 'Kim Ngưu',   sym: '♉', el: 'Đất',  range: '20/4 – 20/5',  slug: 'kim-nguu' },
  { en: 'Gemini',      name: 'Song Tử',    sym: '♊', el: 'Khí',  range: '21/5 – 20/6',  slug: 'song-tu' },
  { en: 'Cancer',      name: 'Cự Giải',    sym: '♋', el: 'Nước', range: '21/6 – 22/7',  slug: 'cu-giai' },
  { en: 'Leo',         name: 'Sư Tử',      sym: '♌', el: 'Lửa',  range: '23/7 – 22/8',  slug: 'su-tu' },
  { en: 'Virgo',       name: 'Xử Nữ',      sym: '♍', el: 'Đất',  range: '23/8 – 22/9',  slug: 'xu-nu' },
  { en: 'Libra',       name: 'Thiên Bình', sym: '♎', el: 'Khí',  range: '23/9 – 22/10', slug: 'thien-binh' },
  { en: 'Scorpio',     name: 'Bọ Cạp',     sym: '♏', el: 'Nước', range: '23/10 – 21/11', slug: 'bo-cap' },
  { en: 'Sagittarius', name: 'Nhân Mã',    sym: '♐', el: 'Lửa',  range: '22/11 – 21/12', slug: 'nhan-ma' },
  { en: 'Capricorn',   name: 'Ma Kết',     sym: '♑', el: 'Đất',  range: '22/12 – 19/1',  slug: 'ma-ket' },
  { en: 'Aquarius',    name: 'Bảo Bình',   sym: '♒', el: 'Khí',  range: '20/1 – 18/2',   slug: 'bao-binh' },
  { en: 'Pisces',      name: 'Song Ngư',   sym: '♓', el: 'Nước', range: '19/2 – 20/3',   slug: 'song-ngu' },
];

const META_BY_EN: Map<string, SignVi> = new Map(META.map((m) => [m.en, m]));

/** 12 sign theo thứ tự lịch hoàng đạo (Aries → Pisces). */
export const ALL_SIGNS_VI: readonly SignVi[] = META;

/**
 * Tính sign từ ngày sinh dương lịch. Trả null nếu input invalid.
 * Tháng 1-12, ngày 1-31. Dùng library `horoscope` để chuẩn hóa logic
 * biên ngày — tránh tự viết bảng tra tay dễ sai ở biên (vd Aries kết
 * thúc 19/4 hay 20/4).
 */
export function getSignFromDate(month: number, day: number): SignVi | null {
  const en = libGetSign({ month, day }, true) as string | null;
  return en ? META_BY_EN.get(en) ?? null : null;
}

/** Sign đang "active" (cung của hôm nay) theo ngày hiện tại. */
export function getSignToday(now: Date = new Date()): SignVi | null {
  return getSignFromDate(now.getMonth() + 1, now.getDate());
}

/** Con giáp năm — wrapping thư viện `getZodiac(year)`. */
export function getChineseZodiacByYear(year: number): string | null {
  return (libGetZodiac(year, true) as string | null) ?? null;
}
