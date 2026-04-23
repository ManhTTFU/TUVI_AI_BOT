import { astro } from 'iztro';
import type { BirthInfo, ChartData, PalaceData, StarInfo } from '@tuvi/core';
import { toIsoDate } from '@tuvi/core';

function mapStars(stars: any[] | undefined): StarInfo[] {
  if (!Array.isArray(stars)) return [];
  return stars.map((s) => ({
    name: String(s?.name ?? ''),
    type: s?.type ? String(s.type) : undefined,
    scope: s?.scope ? String(s.scope) : undefined,
    brightness: s?.brightness ? String(s.brightness) : undefined,
    mutagen: s?.mutagen ? String(s.mutagen) : undefined,
  }));
}

export function calculateChart(info: BirthInfo): ChartData {
  const iso = toIsoDate(info.birthDate);
  if (!iso) {
    throw new Error(`Ngày sinh không hợp lệ: ${info.birthDate} (định dạng DD/MM/YYYY)`);
  }
  if (info.timeIndex < 0 || info.timeIndex > 11) {
    throw new Error(`timeIndex không hợp lệ: ${info.timeIndex}`);
  }

  const astrolabe: any = astro.bySolar(iso, info.timeIndex, info.gender, true, 'vi-VN');

  const palaces: PalaceData[] = (astrolabe.palaces ?? []).map((p: any, idx: number) => ({
    index: idx,
    name: String(p?.name ?? ''),
    heavenlyStem: String(p?.heavenlyStem ?? ''),
    earthlyBranch: String(p?.earthlyBranch ?? ''),
    isBodyPalace: !!p?.isBodyPalace,
    isOriginalPalace: !!p?.isOriginalPalace,
    majorStars: mapStars(p?.majorStars),
    minorStars: mapStars(p?.minorStars),
    adjectiveStars: mapStars(p?.adjectiveStars),
    changsheng12: p?.changsheng12 ? String(p.changsheng12) : undefined,
    boshi12: p?.boshi12 ? String(p.boshi12) : undefined,
    jiangqian12: p?.jiangqian12 ? String(p.jiangqian12) : undefined,
    suiqian12: p?.suiqian12 ? String(p.suiqian12) : undefined,
    decadal: p?.decadal
      ? {
          range: [Number(p.decadal.range?.[0] ?? 0), Number(p.decadal.range?.[1] ?? 0)],
          heavenlyStem: String(p.decadal.heavenlyStem ?? ''),
          earthlyBranch: String(p.decadal.earthlyBranch ?? ''),
        }
      : undefined,
    ages: Array.isArray(p?.ages) ? p.ages.map((x: any) => Number(x)) : undefined,
  }));

  return {
    info,
    solarDate: String(astrolabe.solarDate ?? iso),
    lunarDate: String(astrolabe.lunarDate ?? ''),
    chineseDate: String(astrolabe.chineseDate ?? ''),
    time: String(astrolabe.time ?? ''),
    timeRange: String(astrolabe.timeRange ?? ''),
    sign: String(astrolabe.sign ?? ''),
    zodiac: String(astrolabe.zodiac ?? ''),
    earthlyBranchOfSoulPalace: String(astrolabe.earthlyBranchOfSoulPalace ?? ''),
    earthlyBranchOfBodyPalace: String(astrolabe.earthlyBranchOfBodyPalace ?? ''),
    soul: String(astrolabe.soul ?? ''),
    body: String(astrolabe.body ?? ''),
    fiveElementsClass: String(astrolabe.fiveElementsClass ?? ''),
    palaces,
  };
}

export function summarizeChartForAI(chart: ChartData): string {
  const lines: string[] = [];
  lines.push(`Họ tên: ${chart.info.name}`);
  lines.push(`Giới tính: ${chart.info.gender === 'male' ? 'Nam' : 'Nữ'}`);
  lines.push(`Ngày sinh (dương): ${chart.solarDate}`);
  lines.push(`Ngày sinh (âm): ${chart.lunarDate}`);
  lines.push(`Can chi ngày: ${chart.chineseDate}`);
  lines.push(`Giờ sinh: ${chart.time} (${chart.timeRange})`);
  lines.push(`Con giáp: ${chart.zodiac} — Cung hoàng đạo: ${chart.sign}`);
  lines.push(`Mệnh chủ: ${chart.soul} — Thân chủ: ${chart.body}`);
  lines.push(`Ngũ hành cục: ${chart.fiveElementsClass}`);
  lines.push(`Địa chi cung Mệnh: ${chart.earthlyBranchOfSoulPalace} — Địa chi cung Thân: ${chart.earthlyBranchOfBodyPalace}`);
  lines.push('');
  lines.push('=== 12 CUNG ===');
  for (const p of chart.palaces) {
    const tags: string[] = [];
    if (p.isBodyPalace) tags.push('Thân cung');
    if (p.isOriginalPalace) tags.push('Cung gốc');
    const head = `[${p.heavenlyStem}${p.earthlyBranch}] ${p.name}${tags.length ? ` (${tags.join(', ')})` : ''}`;
    lines.push(head);
    if (p.majorStars.length) lines.push(`  • Chính tinh: ${p.majorStars.map(formatStar).join(', ')}`);
    if (p.minorStars.length) lines.push(`  • Phụ tinh: ${p.minorStars.map(formatStar).join(', ')}`);
    if (p.adjectiveStars.length) lines.push(`  • Tạp diệu: ${p.adjectiveStars.map((s) => s.name).join(', ')}`);
    if (p.decadal) {
      lines.push(`  • Đại hạn: ${p.decadal.range[0]}–${p.decadal.range[1]} tuổi (${p.decadal.heavenlyStem}${p.decadal.earthlyBranch})`);
    }
  }
  return lines.join('\n');
}

function formatStar(s: StarInfo): string {
  const parts = [s.name];
  if (s.brightness) parts.push(`(${s.brightness})`);
  if (s.mutagen) parts.push(`[Hóa ${s.mutagen}]`);
  return parts.join(' ');
}
