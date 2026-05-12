// Tính Tứ Trụ Bát Tự từ thông tin sinh dương lịch + giờ + phút.
// Múi giờ UTC+7 (Việt Nam) — KHÔNG điều chỉnh giờ mặt trời.

import {
  canChiHour,
  canChiYear,
  canChiMonth,
  canChiDay,
  formatCanChi,
  solarToLunar,
  type CanChi,
} from '@tuvi/lichvannien';

export type WuxingPhase = 'Kim' | 'Mộc' | 'Thủy' | 'Hỏa' | 'Thổ';

export type Polarity = 'Dương' | 'Âm';

export interface PillarInfo {
  /** Tên cột: "Năm Trụ" / "Tháng Trụ" / "Ngày Trụ" / "Giờ Trụ" */
  label: string;
  /** Can + Chi đã chuẩn hóa. */
  canChi: CanChi;
  /** "Giáp Tý" */
  text: string;
  /** Ngũ hành của Can. */
  canPhase: WuxingPhase;
  /** Ngũ hành của Chi (bản khí). */
  chiPhase: WuxingPhase;
  /** Âm/Dương của Can. */
  canPolarity: Polarity;
}

export interface BatTuChart {
  pillars: {
    year: PillarInfo;
    month: PillarInfo;
    day: PillarInfo;
    hour: PillarInfo;
  };
  /** Nhật chủ = Can ngày. */
  dayMaster: { can: string; phase: WuxingPhase; polarity: Polarity };
  birth: {
    /** Dương lịch đầu vào. */
    solar: { day: number; month: number; year: number; hour: number; minute: number };
    /** Âm lịch tương ứng. */
    lunar: { day: number; month: number; year: number; leap: 0 | 1 };
    /** Nơi sinh (không bắt buộc, để AI tham khảo bối cảnh vùng miền). */
    place?: string;
  };
}

// Ngũ hành của Can (Giáp/Ất Mộc, Bính/Đinh Hỏa, Mậu/Kỷ Thổ, Canh/Tân Kim, Nhâm/Quý Thủy)
const CAN_PHASE: WuxingPhase[] = [
  'Mộc', 'Mộc',
  'Hỏa', 'Hỏa',
  'Thổ', 'Thổ',
  'Kim', 'Kim',
  'Thủy', 'Thủy',
];

// Âm/Dương Can: số chẵn (Giáp/Bính/Mậu/Canh/Nhâm) Dương; lẻ Âm.
const CAN_POLARITY: Polarity[] = [
  'Dương', 'Âm', 'Dương', 'Âm', 'Dương', 'Âm', 'Dương', 'Âm', 'Dương', 'Âm',
];

// Ngũ hành bản khí của Chi: Tý Thủy, Sửu Thổ, Dần Mộc, Mão Mộc, Thìn Thổ,
// Tỵ Hỏa, Ngọ Hỏa, Mùi Thổ, Thân Kim, Dậu Kim, Tuất Thổ, Hợi Thủy.
const CHI_PHASE: WuxingPhase[] = [
  'Thủy', 'Thổ', 'Mộc', 'Mộc', 'Thổ', 'Hỏa',
  'Hỏa', 'Thổ', 'Kim', 'Kim', 'Thổ', 'Thủy',
];

function makePillar(label: string, canChi: CanChi): PillarInfo {
  return {
    label,
    canChi,
    text: formatCanChi(canChi),
    canPhase: CAN_PHASE[canChi.canIndex],
    chiPhase: CHI_PHASE[canChi.chiIndex],
    canPolarity: CAN_POLARITY[canChi.canIndex],
  };
}

/**
 * Chỉ số chi của giờ (0=Tý ... 11=Hợi) theo giờ + phút dương lịch.
 * Tý kéo dài 23:00–01:00. Boundary tại 23:00 và 01:00 chính xác.
 */
function hourChiIndex(hour: number, minute: number): number {
  const t = hour + minute / 60;
  return (Math.floor((t + 1) / 2) % 12 + 12) % 12;
}

/**
 * Ngày Bát Tự: nếu giờ ≥ 23 thì ngày trụ chuyển sang ngày dương lịch kế tiếp
 * (vì Tý mới bắt đầu ngày can chi mới).
 */
function effectiveDayDate(
  day: number,
  month: number,
  year: number,
  hour: number,
): { day: number; month: number; year: number } {
  if (hour < 23) return { day, month, year };
  const dt = new Date(year, month - 1, day);
  dt.setDate(dt.getDate() + 1);
  return { day: dt.getDate(), month: dt.getMonth() + 1, year: dt.getFullYear() };
}

export interface BatTuInput {
  /** Ngày dương lịch. */
  day: number;
  month: number;
  year: number;
  /** Giờ 0–23 dương lịch (Việt Nam UTC+7). */
  hour: number;
  /** Phút 0–59. */
  minute: number;
  /** Nơi sinh — tùy chọn. */
  birthPlace?: string;
}

export function calculateBatTu(input: BatTuInput): BatTuChart {
  const { day, month, year, hour, minute } = input;

  // Ngày Bát Tự (có thể đẩy sang hôm sau nếu giờ ≥ 23).
  const eff = effectiveDayDate(day, month, year, hour);
  const lunarEff = solarToLunar(eff.day, eff.month, eff.year);

  // 4 trụ:
  const yearCC = canChiYear(lunarEff.year);
  const monthCC = canChiMonth(lunarEff.year, lunarEff.month);
  const dayCC = canChiDay(lunarEff.jd);
  const hourCC = canChiHour(dayCC.canIndex, hourChiIndex(hour, minute));

  // Âm lịch hiển thị cho user (theo ngày dương lịch input — chưa shift).
  const lunarInput = solarToLunar(day, month, year);

  return {
    pillars: {
      year: makePillar('Năm Trụ', yearCC),
      month: makePillar('Tháng Trụ', monthCC),
      day: makePillar('Ngày Trụ', dayCC),
      hour: makePillar('Giờ Trụ', hourCC),
    },
    dayMaster: {
      can: dayCC.can,
      phase: CAN_PHASE[dayCC.canIndex],
      polarity: CAN_POLARITY[dayCC.canIndex],
    },
    birth: {
      solar: { day, month, year, hour, minute },
      lunar: {
        day: lunarInput.day,
        month: lunarInput.month,
        year: lunarInput.year,
        leap: lunarInput.leap,
      },
      place: input.birthPlace?.trim() || undefined,
    },
  };
}

/** Format toàn bộ Bát Tự cho AI prompt context. */
export function formatBatTuForAI(chart: BatTuChart, name: string, gender: 'male' | 'female'): string {
  const { pillars, dayMaster, birth } = chart;
  const fmt = (p: PillarInfo) =>
    `${p.label}: ${p.text} (Can ${p.canPhase}/${p.canPolarity}, Chi ${p.chiPhase})`;
  const dob = `${birth.solar.day}/${birth.solar.month}/${birth.solar.year} ${pad(birth.solar.hour)}:${pad(birth.solar.minute)}`;
  const lunar = `${birth.lunar.day}/${birth.lunar.month}${birth.lunar.leap ? '(nhuận)' : ''}/${birth.lunar.year}`;
  const lines = [
    `Tên: ${name}`,
    `Giới tính: ${gender === 'male' ? 'Nam' : 'Nữ'}`,
    `Dương lịch: ${dob} (UTC+7, không điều chỉnh giờ mặt trời)`,
    `Âm lịch: ${lunar}`,
  ];
  if (chart.birth.place) lines.push(`Nơi sinh: ${chart.birth.place}`);
  lines.push(
    `Tứ Trụ Bát Tự:`,
    `  - ${fmt(pillars.year)}`,
    `  - ${fmt(pillars.month)}`,
    `  - ${fmt(pillars.day)}`,
    `  - ${fmt(pillars.hour)}`,
    `Nhật chủ (Can ngày): ${dayMaster.can} (${dayMaster.phase} ${dayMaster.polarity})`,
  );
  return lines.join('\n');
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
