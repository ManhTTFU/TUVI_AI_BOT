import { solarToLunar, type LunarDate } from './solar-lunar.js';
import {
  canChiDay,
  canChiMonth,
  canChiYear,
  formatCanChi,
  type CanChi,
} from './can-chi.js';
import {
  getDayStar,
  getLuckyHours,
  type Star,
  type HourStar,
} from './hoang-dao.js';
import {
  getLuckyDirections,
  getStarAdvice,
  type LuckyDirections,
} from './advice.js';

export interface DayInfo {
  solar: { day: number; month: number; year: number; weekday: number };
  lunar: LunarDate;
  canChi: {
    year: CanChi;
    month: CanChi;
    day: CanChi;
  };
  canChiText: {
    year: string;
    month: string;
    day: string;
  };
  /** Sao Ngọc Hạp trực ngày — hoàng đạo (tốt) hoặc hắc đạo (xấu). */
  dayStar: Star;
  /** 6 giờ hoàng đạo trong ngày. */
  luckyHours: HourStar[];
  /** Việc nên làm / nên kiêng theo trực ngày. */
  advice: {
    nen: string[];
    kieng: string[];
  };
  /** Hướng xuất hành: Hỷ thần + Tài thần. */
  directions: LuckyDirections;
}

/** Tổng hợp thông tin 1 ngày dương lịch: âm lịch + can chi + sao + giờ HĐ + việc nên/kiêng + hướng. */
export function getDayInfo(dd: number, mm: number, yy: number): DayInfo {
  const lunar = solarToLunar(dd, mm, yy);
  const year = canChiYear(lunar.year);
  const month = canChiMonth(lunar.year, lunar.month);
  const day = canChiDay(lunar.jd);
  const date = new Date(yy, mm - 1, dd);
  const dayStar = getDayStar(month.chiIndex, day.chiIndex);
  const luckyHours = getLuckyHours(day.chiIndex);
  const advice = getStarAdvice(dayStar);
  const directions = getLuckyDirections(day.can);
  return {
    solar: { day: dd, month: mm, year: yy, weekday: date.getDay() },
    lunar,
    canChi: { year, month, day },
    canChiText: {
      year: formatCanChi(year),
      month: formatCanChi(month),
      day: formatCanChi(day),
    },
    dayStar,
    luckyHours,
    advice,
    directions,
  };
}
