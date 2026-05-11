export type Gender = 'male' | 'female';

export interface BirthInfo {
  name: string;
  gender: Gender;
  /** DD/MM/YYYY dương lịch */
  birthDate: string;
  /** 0..11 tương ứng Tý..Hợi */
  timeIndex: number;
  /** Tên canh giờ hiển thị */
  timeName: string;
  birthPlace: string;
}

export interface StarInfo {
  name: string;
  type?: string;
  scope?: string;
  brightness?: string;
  mutagen?: string;
}

export interface PalaceData {
  index: number;
  name: string;
  heavenlyStem: string;
  earthlyBranch: string;
  isBodyPalace: boolean;
  isOriginalPalace: boolean;
  majorStars: StarInfo[];
  minorStars: StarInfo[];
  adjectiveStars: StarInfo[];
  changsheng12?: string;
  boshi12?: string;
  jiangqian12?: string;
  suiqian12?: string;
  decadal?: { range: [number, number]; heavenlyStem: string; earthlyBranch: string };
  ages?: number[];
}

export interface ChartData {
  info: BirthInfo;
  solarDate: string;
  lunarDate: string;
  chineseDate: string;
  time: string;
  timeRange: string;
  sign: string;
  zodiac: string;
  earthlyBranchOfSoulPalace: string;
  earthlyBranchOfBodyPalace: string;
  soul: string;
  body: string;
  fiveElementsClass: string;
  palaces: PalaceData[];
}

export interface AnalysisSections {
  overview: string;
  career: string;
  love: string;
  health: string;
  decade: string;
  advice: string;
}

export interface DaiHanReading {
  /** Thứ tự vận theo tuổi tăng dần (0..11) */
  index: number;
  ageStart: number;
  ageEnd: number;
  yearStart: number;
  yearEnd: number;
  palaceName: string;
  earthlyBranch: string;
  reading: string;
}

export interface TieuHanReading {
  year: number;
  age: number;
  palaceName: string;
  earthlyBranch: string;
  reading: string;
}

export interface TwelvePalaceReading {
  name: string;
  earthlyBranch: string;
  reading: string;
}

export type NamCategory = 'Đại Cát' | 'Tiểu Cát' | 'Bình Hòa' | 'Cẩn Trọng';
export type MonthLabel = 'Tốt' | 'Bình' | 'Cẩn trọng';

export interface NamHienTaiAspect {
  /** 1..5 sao đánh giá */
  rating: number;
  /** 3-5 câu luận giải khía cạnh trong năm */
  text: string;
}

export interface NamHienTaiMonth {
  month: number;
  label: MonthLabel;
  text: string;
}

export interface NamHienTaiReading {
  year: number;
  age: number;
  yearCanChi: string;
  palaceName: string;
  earthlyBranch: string;
  category: NamCategory;
  /** 4-6 câu tổng quan năm, cá nhân hóa theo cung tiểu hạn + đại hạn + năm Can Chi */
  overview: string;
  aspects: {
    career: NamHienTaiAspect;
    wealth: NamHienTaiAspect;
    love: NamHienTaiAspect;
    health: NamHienTaiAspect;
  };
  months: NamHienTaiMonth[];
  /**
   * 3-5 lời khuyên cá nhân hóa cho năm, mỗi câu kèm 1 tục ngữ/ca dao Việt Nam
   * có thật và HỢP NGỮ CẢNH (không gượng ép). AI có thể trả về câu không tục ngữ
   * nếu không có câu phù hợp.
   */
  advice: string[];
}

export interface DeepReadingsData {
  daiHan: DaiHanReading[];
  tieuHan: TieuHanReading[];
  twelvePalaces: TwelvePalaceReading[];
  namHienTai: NamHienTaiReading;
}

export interface FullResult {
  slug: string;
  createdAt: string;
  info: BirthInfo;
  chart: ChartData;
  analysis: AnalysisSections;
}

export const PALACE_LABELS_VI: readonly string[] = [
  'Mệnh',
  'Huynh Đệ',
  'Phu Thê',
  'Tử Tức',
  'Tài Bạch',
  'Tật Ách',
  'Thiên Di',
  'Nô Bộc',
  'Quan Lộc',
  'Điền Trạch',
  'Phúc Đức',
  'Phụ Mẫu',
] as const;

export const ANALYSIS_TITLES: Record<keyof AnalysisSections, string> = {
  overview: 'Tổng quan lá số',
  career: 'Sự nghiệp & Tài lộc',
  love: 'Tình duyên & Gia đạo',
  health: 'Sức khỏe',
  decade: 'Vận hạn 10 năm (2025–2035)',
  advice: 'Lời khuyên tổng hợp',
};
