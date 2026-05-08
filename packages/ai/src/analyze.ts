import type {
  AnalysisSections,
  ChartData,
  DaiHanReading,
  DeepReadingsData,
  TieuHanReading,
  TwelvePalaceReading,
} from '@tuvi/core';
import { summarizeChartForAI } from '@tuvi/astrology';
import { getDeepseekClient, getDeepseekModel } from './client.js';
import {
  SYSTEM_PROMPT,
  SECTION_PROMPTS,
  SECTION_ORDER,
  DAI_HAN_JSON_PROMPT,
  TIEU_HAN_JSON_PROMPT,
  TWELVE_PALACES_JSON_PROMPT,
  type SectionKey,
} from './prompts.js';

export interface AnalyzeOptions {
  onProgress?: (step: number, total: number, key: SectionKey) => void;
}

async function callOneSection(key: SectionKey, chartSummary: string): Promise<string> {
  const client = getDeepseekClient();
  const model = getDeepseekModel();

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.7,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `DỮ LIỆU LÁ SỐ (bắt buộc bám sát):\n\n${chartSummary}\n\n---\n\n${SECTION_PROMPTS[key]}`,
      },
    ],
  });

  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) throw new Error(`Deepseek không trả lời phần ${key}`);
  return text;
}

export async function analyzeChart(
  chart: ChartData,
  opts: AnalyzeOptions = {},
): Promise<AnalysisSections> {
  const chartSummary = summarizeChartForAI(chart);
  const result: Partial<AnalysisSections> = {};

  for (let i = 0; i < SECTION_ORDER.length; i++) {
    const key = SECTION_ORDER[i];
    opts.onProgress?.(i + 1, SECTION_ORDER.length, key);
    result[key] = await callOneSection(key, chartSummary);
  }

  return result as AnalysisSections;
}

// ============================================================================
// Deep readings — JSON-mode calls
// ============================================================================

async function callJsonSection<T>(
  prompt: string,
  chartSummary: string,
  extraContext?: string,
): Promise<T> {
  const client = getDeepseekClient();
  const model = getDeepseekModel();

  const userContent =
    `DỮ LIỆU LÁ SỐ (bắt buộc bám sát):\n\n${chartSummary}` +
    (extraContext ? `\n\n${extraContext}` : '') +
    `\n\n---\n\n${prompt}`;

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.7,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
  });

  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) throw new Error('Deepseek không trả lời (JSON)');
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    throw new Error(`Deepseek trả JSON không hợp lệ: ${(e as Error).message}\n${text.slice(0, 500)}`);
  }
}

/** Sắp 12 đại hạn theo tuổi tăng dần và trả meta để AI tham chiếu. */
function buildDaiHanContext(chart: ChartData, birthYear: number): string {
  const sorted = [...chart.palaces]
    .filter((p) => p.decadal)
    .sort((a, b) => a.decadal!.range[0] - b.decadal!.range[0]);

  const lines: string[] = ['=== ĐẠI HẠN (12 vận, sắp xếp theo tuổi tăng dần) ==='];
  sorted.forEach((p, i) => {
    const [as, ae] = p.decadal!.range;
    const ys = birthYear + as;
    const ye = birthYear + ae;
    const major = p.majorStars.map((s) => s.name).join(', ') || '(không chính tinh)';
    const minor = p.minorStars.map((s) => s.name).join(', ') || '(không phụ tinh)';
    lines.push(
      `Vận ${i + 1}: ${as}-${ae} tuổi (${ys}-${ye}) — Cung ${p.name} ${p.heavenlyStem}${p.earthlyBranch}; chính: ${major}; phụ: ${minor}`,
    );
  });
  return lines.join('\n');
}

/** Cho mỗi năm trong [currentYear-1, currentYear+4], lookup palace có ages chứa tuổi đó. */
function buildTieuHanContext(chart: ChartData, birthYear: number, currentYear: number): {
  context: string;
  meta: TieuHanReading[];
} {
  const meta: TieuHanReading[] = [];
  const lines: string[] = ['=== TIỂU HẠN 6 NĂM (năm trước → 4 năm sau) ==='];

  for (let i = -1; i <= 4; i++) {
    const year = currentYear + i;
    const age = year - birthYear;
    const palace =
      chart.palaces.find((p) => Array.isArray(p.ages) && p.ages.includes(age)) ?? null;

    if (palace) {
      const major = palace.majorStars.map((s) => s.name).join(', ') || '(không chính tinh)';
      const minor = palace.minorStars.map((s) => s.name).join(', ') || '(không phụ tinh)';
      lines.push(
        `Năm ${year} (${age} tuổi) — Cung ${palace.name} ${palace.heavenlyStem}${palace.earthlyBranch}; chính: ${major}; phụ: ${minor}`,
      );
      meta.push({
        year,
        age,
        palaceName: palace.name,
        earthlyBranch: palace.earthlyBranch,
        reading: '', // sẽ điền sau khi AI trả về
      });
    } else {
      lines.push(`Năm ${year} (${age} tuổi) — không xác định cung tiểu hạn`);
      meta.push({ year, age, palaceName: '—', earthlyBranch: '—', reading: '' });
    }
  }

  return { context: lines.join('\n'), meta };
}

export async function analyzeDaiHan(
  chart: ChartData,
  birthYear: number,
): Promise<DaiHanReading[]> {
  const summary = summarizeChartForAI(chart);
  const ctx = buildDaiHanContext(chart, birthYear);
  const out = await callJsonSection<{ periods: DaiHanReading[] }>(
    DAI_HAN_JSON_PROMPT,
    summary,
    ctx,
  );

  // Merge AI readings vào meta tự build (đảm bảo đủ 12 mục, đúng năm sinh).
  const sorted = [...chart.palaces]
    .filter((p) => p.decadal)
    .sort((a, b) => a.decadal!.range[0] - b.decadal!.range[0]);

  return sorted.map((p, i) => {
    const [as, ae] = p.decadal!.range;
    const aiItem = out.periods?.find((x) => x.index === i || x.ageStart === as);
    return {
      index: i,
      ageStart: as,
      ageEnd: ae,
      yearStart: birthYear + as,
      yearEnd: birthYear + ae,
      palaceName: p.name,
      earthlyBranch: p.earthlyBranch,
      reading: aiItem?.reading?.trim() || '(AI không trả lời cho vận này)',
    };
  });
}

export async function analyzeTieuHan(
  chart: ChartData,
  birthYear: number,
  currentYear: number,
): Promise<TieuHanReading[]> {
  const summary = summarizeChartForAI(chart);
  const { context, meta } = buildTieuHanContext(chart, birthYear, currentYear);
  const out = await callJsonSection<{ years: TieuHanReading[] }>(
    TIEU_HAN_JSON_PROMPT,
    summary,
    context,
  );

  return meta.map((m) => {
    const aiItem = out.years?.find((x) => x.year === m.year);
    return { ...m, reading: aiItem?.reading?.trim() || '(AI không trả lời cho năm này)' };
  });
}

export async function analyzeTwelvePalaces(
  chart: ChartData,
): Promise<TwelvePalaceReading[]> {
  const summary = summarizeChartForAI(chart);
  const out = await callJsonSection<{ palaces: TwelvePalaceReading[] }>(
    TWELVE_PALACES_JSON_PROMPT,
    summary,
  );

  // Match theo name; fallback theo earthlyBranch nếu name lệch (Tử Nữ vs Tử Tức)
  return chart.palaces.map((p) => {
    const aiItem =
      out.palaces?.find((x) => x.name === p.name) ??
      out.palaces?.find((x) => x.earthlyBranch === p.earthlyBranch) ??
      null;
    return {
      name: p.name,
      earthlyBranch: p.earthlyBranch,
      reading: aiItem?.reading?.trim() || '(AI không trả lời cho cung này)',
    };
  });
}

export interface DeepAnalyzeOptions {
  onProgress?: (step: number, total: number, label: string) => void;
}

export async function analyzeDeepReadings(
  chart: ChartData,
  birthYear: number,
  currentYear: number,
  opts: DeepAnalyzeOptions = {},
): Promise<DeepReadingsData> {
  opts.onProgress?.(1, 3, 'daiHan');
  const daiHan = await analyzeDaiHan(chart, birthYear);
  opts.onProgress?.(2, 3, 'tieuHan');
  const tieuHan = await analyzeTieuHan(chart, birthYear, currentYear);
  opts.onProgress?.(3, 3, 'twelvePalaces');
  const twelvePalaces = await analyzeTwelvePalaces(chart);
  return { daiHan, tieuHan, twelvePalaces };
}
