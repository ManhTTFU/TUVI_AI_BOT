/**
 * Can Chi — hệ thống 10 can × 12 chi cho năm/tháng/ngày/giờ.
 * Công thức tính từ Julian Day Number cho ngày; từ năm âm cho năm/tháng.
 */

export const CAN = [
  'Giáp',
  'Ất',
  'Bính',
  'Đinh',
  'Mậu',
  'Kỷ',
  'Canh',
  'Tân',
  'Nhâm',
  'Quý',
] as const;

export const CHI = [
  'Tý',
  'Sửu',
  'Dần',
  'Mão',
  'Thìn',
  'Tỵ',
  'Ngọ',
  'Mùi',
  'Thân',
  'Dậu',
  'Tuất',
  'Hợi',
] as const;

export type Can = (typeof CAN)[number];
export type Chi = (typeof CHI)[number];

export interface CanChi {
  can: Can;
  chi: Chi;
  /** Index can (0-9) */
  canIndex: number;
  /** Index chi (0-11) */
  chiIndex: number;
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function make(canIndex: number, chiIndex: number): CanChi {
  const c = mod(canIndex, 10);
  const ch = mod(chiIndex, 12);
  return { can: CAN[c], chi: CHI[ch], canIndex: c, chiIndex: ch };
}

/** Can chi năm âm lịch. */
export function canChiYear(lunarYear: number): CanChi {
  return make(lunarYear + 6, lunarYear + 8);
}

/**
 * Can chi tháng âm lịch.
 * Tháng giêng luôn là Dần. Can tháng giêng phụ thuộc Can năm:
 *   Giáp/Kỷ → Bính Dần, Ất/Canh → Mậu Dần, Bính/Tân → Canh Dần,
 *   Đinh/Nhâm → Nhâm Dần, Mậu/Quý → Giáp Dần.
 * Công thức: canThang = (canNăm * 2 + lunarMonth + 1) mod 10
 */
export function canChiMonth(lunarYear: number, lunarMonth: number): CanChi {
  const canYear = mod(lunarYear + 6, 10);
  const canIndex = canYear * 2 + lunarMonth + 1;
  const chiIndex = lunarMonth + 1;
  return make(canIndex, chiIndex);
}

/** Can chi ngày từ Julian Day Number. */
export function canChiDay(jdn: number): CanChi {
  return make(jdn + 9, jdn + 1);
}

/**
 * Can chi giờ. Mỗi canh giờ = 2 tiếng, bắt đầu Tý (23-01h) → Hợi (21-23h).
 * Can giờ Tý của ngày phụ thuộc Can ngày:
 *   Giáp/Kỷ → Giáp Tý, Ất/Canh → Bính Tý, Bính/Tân → Mậu Tý,
 *   Đinh/Nhâm → Canh Tý, Mậu/Quý → Nhâm Tý.
 * @param dayCanIndex Can ngày (0-9)
 * @param hourChiIndex Chi giờ (0=Tý, 1=Sửu, ...)
 */
export function canChiHour(dayCanIndex: number, hourChiIndex: number): CanChi {
  const startCan = (dayCanIndex % 5) * 2;
  return make(startCan + hourChiIndex, hourChiIndex);
}

/** Format "Can Chi" ví dụ "Giáp Tý". */
export function formatCanChi(cc: CanChi): string {
  return `${cc.can} ${cc.chi}`;
}
