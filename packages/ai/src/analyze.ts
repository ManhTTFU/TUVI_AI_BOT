import type {
  AnalysisSections,
  ChartData,
  DaiHanReading,
  DeepReadingsData,
  NamHienTaiReading,
  TieuHanReading,
  TwelvePalaceReading,
} from '@tuvi/core';
import { summarizeChartForAI } from '@tuvi/astrology';
import { getDeepseekClient, getDeepseekModel } from './client.js';
import { aiCall } from './limit.js';
import {
  SYSTEM_PROMPT,
  SECTION_PROMPTS,
  SECTION_ORDER,
  DAI_HAN_JSON_PROMPT,
  TIEU_HAN_JSON_PROMPT,
  TWELVE_PALACES_JSON_PROMPT,
  NAM_HIEN_TAI_MAIN_PROMPT,
  NAM_HIEN_TAI_MONTHS_PROMPT,
  BAT_TU_SYSTEM_PROMPT,
  BAT_TU_PROMPT,
  type SectionKey,
} from './prompts.js';

const CAN_AI = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI_AI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

function canChiYearStr(y: number): string {
  const c = ((y + 6) % 10 + 10) % 10;
  const ch = ((y + 8) % 12 + 12) % 12;
  return `${CAN_AI[c]} ${CHI_AI[ch]}`;
}

function chiOfYear(y: number): string {
  const ch = ((y + 8) % 12 + 12) % 12;
  return CHI_AI[ch];
}

export interface AnalyzeOptions {
  onProgress?: (step: number, total: number, key: SectionKey) => void;
}

async function callOneSection(key: SectionKey, chartSummary: string): Promise<string> {
  const client = getDeepseekClient();
  const model = getDeepseekModel();

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.7,
    max_tokens: 1500, // ~1000 từ VN — cap để section không phình quá dài (mỗi 1k token ~ 20-25s sinh)
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
  let done = 0;
  const total = SECTION_ORDER.length;

  // Parallel: 6 section gọi đồng thời, mỗi cái qua aiCall (limit + retry).
  // Progress emit theo thứ tự hoàn thành, không theo thứ tự gọi.
  const texts = await Promise.all(
    SECTION_ORDER.map((key) =>
      aiCall(() => callOneSection(key, chartSummary), `analyze:${key}`).then((text) => {
        done++;
        opts.onProgress?.(done, total, key);
        return [key, text] as const;
      }),
    ),
  );

  const result: Partial<AnalysisSections> = {};
  for (const [k, t] of texts) result[k] = t;
  return result as AnalysisSections;
}

// ============================================================================
// Deep readings — JSON-mode calls
// ============================================================================

// max_tokens phân theo loại JSON deep. Tăng buffer ~30% để tránh truncate
// giữa chừng → JSON parse fail (đã gặp với twelvePalaces 2500 không đủ).
const JSON_MAX_TOKENS: Record<string, number> = {
  daiHan: 3000,            // 12 vận × ~50 token = 600 + overhead JSON + buffer
  tieuHan: 1800,           // 6 năm × ~80 token = 480 + buffer
  twelvePalaces: 4000,     // 12 cung × 4-5 câu × ~30 token = 1800 + buffer (gặp truncate ở 2500)
  namHienTaiMain: 3500,    // overview + 5 aspects (mỗi aspect 5-7 câu) + advice — đã thêm family + chi tiết hơn
  namHienTaiMonths: 1500,  // 12 tháng × 1-2 câu + buffer
};

async function callJsonSection<T>(
  prompt: string,
  chartSummary: string,
  extraContext?: string,
  label = 'json',
): Promise<T> {
  return aiCall(async () => {
    const client = getDeepseekClient();
    const model = getDeepseekModel();

    const userContent =
      `DỮ LIỆU LÁ SỐ (bắt buộc bám sát):\n\n${chartSummary}` +
      (extraContext ? `\n\n${extraContext}` : '') +
      `\n\n---\n\n${prompt}`;

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.7,
      max_tokens: JSON_MAX_TOKENS[label] ?? 2000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    });

    const finishReason = completion.choices[0]?.finish_reason;
    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) throw new Error('Deepseek không trả lời (JSON)');

    // finish_reason='length' = bị cắt do max_tokens → JSON gần như chắc chắn truncate.
    // Throw kèm status 500 để withRetry retry (may have shorter output lần sau).
    if (finishReason === 'length') {
      const err = new Error(
        `Deepseek bị cắt do max_tokens (label=${label}); thử retry với output ngắn hơn`,
      ) as Error & { status: number };
      err.status = 500;
      throw err;
    }
    try {
      return JSON.parse(text) as T;
    } catch (e) {
      const err = new Error(
        `Deepseek trả JSON không hợp lệ: ${(e as Error).message}\n${text.slice(0, 300)}`,
      ) as Error & { status: number };
      err.status = 500; // mark retryable — model temperature 0.7, lần sau có thể OK
      throw err;
    }
  }, label);
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
    'daiHan',
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
    'tieuHan',
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
    undefined,
    'twelvePalaces',
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

function buildNamHienTaiContext(
  chart: ChartData,
  birthYear: number,
  currentYear: number,
): { context: string; tieuHanPalaceName: string; tieuHanBranch: string } {
  const age = currentYear - birthYear;
  const yearCanChi = canChiYearStr(currentYear);
  const birthYearCanChi = canChiYearStr(birthYear);

  const tieuHanPalace =
    chart.palaces.find((p) => Array.isArray(p.ages) && p.ages.includes(age)) ?? null;
  const daiHanPalace =
    chart.palaces.find(
      (p) => p.decadal && age >= p.decadal.range[0] && age <= p.decadal.range[1],
    ) ?? null;
  const menh = chart.palaces.find((p) => p.name === 'Mệnh') ?? null;

  // Cung gia đạo — để AI luận quan hệ cha mẹ / vợ chồng / con cái / anh chị em năm này.
  const phuMau = chart.palaces.find((p) => p.name === 'Phụ Mẫu') ?? null;
  const phuThe = chart.palaces.find((p) => p.name === 'Phu Thê') ?? null;
  const tuTuc =
    chart.palaces.find((p) => p.name === 'Tử Nữ' || p.name === 'Tử Tức') ?? null;
  const huynhDe = chart.palaces.find((p) => p.name === 'Huynh Đệ') ?? null;

  const fmtPalace = (p: typeof tieuHanPalace, label: string) => {
    if (!p) return `${label}: không xác định`;
    const major = p.majorStars.map((s) => s.name).join(', ') || '(không chính tinh)';
    const minor = p.minorStars.map((s) => s.name).join(', ') || '(không phụ tinh)';
    return `${label}: cung ${p.name} ${p.heavenlyStem}${p.earthlyBranch}; chính: ${major}; phụ: ${minor}`;
  };

  // 12 tháng năm hiện tại — mỗi tháng có chi riêng (tháng giêng âm = Dần, ...).
  // Đây là chi tháng âm để AI tham chiếu xung khắc với cung tiểu hạn.
  const monthChis: string[] = [];
  for (let m = 1; m <= 12; m++) {
    const chiIdx = (m + 1) % 12; // tháng 1 → Dần (idx 2)
    monthChis.push(`Tháng ${m}: chi ${CHI_AI[chiIdx]}`);
  }

  const lines: string[] = [
    '=== BỐI CẢNH NĂM HIỆN TẠI (CÁ NHÂN HÓA) ===',
    `Đương số sinh năm ${birthYearCanChi} (${birthYear}), năm nay ${age} tuổi.`,
    `Năm hiện tại: ${yearCanChi} ${currentYear}.`,
    `Tương quan: chi năm sinh ${chiOfYear(birthYear)} — chi năm hiện tại ${chiOfYear(currentYear)}.`,
    fmtPalace(tieuHanPalace, 'Cung TIỂU HẠN năm hiện tại'),
    fmtPalace(daiHanPalace, 'Cung ĐẠI HẠN đang chạy'),
    fmtPalace(menh, 'Cung MỆNH gốc'),
    `Mệnh chủ: ${chart.soul} · Thân chủ: ${chart.body}; Ngũ hành cục: ${chart.fiveElementsClass}.`,
    '',
    '--- CUNG GIA ĐẠO (để luận quan hệ với các thành viên trong gia đình) ---',
    fmtPalace(phuMau, 'Cung PHỤ MẪU (cha mẹ)'),
    fmtPalace(phuThe, 'Cung PHU THÊ (vợ/chồng)'),
    fmtPalace(tuTuc, 'Cung TỬ TỨC (con cái)'),
    fmtPalace(huynhDe, 'Cung HUYNH ĐỆ (anh chị em / bạn thân)'),
    '',
    'Chi 12 tháng năm hiện tại (để xét xung khắc với cung tiểu hạn):',
    ...monthChis,
  ];

  return {
    context: lines.join('\n'),
    tieuHanPalaceName: tieuHanPalace?.name ?? '—',
    tieuHanBranch: tieuHanPalace?.earthlyBranch ?? '—',
  };
}

type RawNamHienTaiMain = Omit<
  NamHienTaiReading,
  'year' | 'age' | 'yearCanChi' | 'palaceName' | 'earthlyBranch' | 'months'
>;
type RawNamHienTaiMonths = { months?: NamHienTaiReading['months'] };

export async function analyzeNamHienTai(
  chart: ChartData,
  birthYear: number,
  currentYear: number,
): Promise<NamHienTaiReading> {
  const summary = summarizeChartForAI(chart);
  const { context, tieuHanPalaceName, tieuHanBranch } = buildNamHienTaiContext(
    chart,
    birthYear,
    currentYear,
  );

  // Split thành 2 call parallel: main (aspects + advice) + months (12 tháng).
  // Cùng share context, giảm thời gian từ ~50s → ~max(main, months) ≈ ~25-30s.
  const [main, monthsRes] = await Promise.all([
    callJsonSection<RawNamHienTaiMain>(
      NAM_HIEN_TAI_MAIN_PROMPT,
      summary,
      context,
      'namHienTaiMain',
    ),
    callJsonSection<RawNamHienTaiMonths>(
      NAM_HIEN_TAI_MONTHS_PROMPT,
      summary,
      context,
      'namHienTaiMonths',
    ),
  ]);

  // Đảm bảo 12 tháng đủ và đúng thứ tự — fallback nếu AI lệch.
  const monthsMap = new Map<number, NamHienTaiReading['months'][number]>();
  (monthsRes.months ?? []).forEach((m) => {
    if (m && typeof m.month === 'number') monthsMap.set(m.month, m);
  });
  const months: NamHienTaiReading['months'] = [];
  for (let m = 1; m <= 12; m++) {
    const found = monthsMap.get(m);
    months.push({
      month: m,
      label: found?.label ?? 'Bình',
      text: found?.text?.trim() || '(AI không trả lời tháng này)',
    });
  }

  const clampRating = (n: unknown): number => {
    const v = Number(n);
    if (!Number.isFinite(v)) return 3;
    return Math.max(1, Math.min(5, Math.round(v)));
  };

  const advice = Array.isArray(main.advice)
    ? main.advice
        .map((s) => (typeof s === 'string' ? s.trim() : ''))
        .filter((s) => s.length > 0)
    : [];

  return {
    year: currentYear,
    age: currentYear - birthYear,
    yearCanChi: canChiYearStr(currentYear),
    palaceName: tieuHanPalaceName,
    earthlyBranch: tieuHanBranch,
    category: main.category ?? 'Bình Hòa',
    overview: main.overview?.trim() || '(AI không trả lời tổng quan năm)',
    aspects: {
      career: {
        rating: clampRating(main.aspects?.career?.rating),
        text: main.aspects?.career?.text?.trim() || '(AI không trả lời)',
      },
      wealth: {
        rating: clampRating(main.aspects?.wealth?.rating),
        text: main.aspects?.wealth?.text?.trim() || '(AI không trả lời)',
      },
      love: {
        rating: clampRating(main.aspects?.love?.rating),
        text: main.aspects?.love?.text?.trim() || '(AI không trả lời)',
      },
      health: {
        rating: clampRating(main.aspects?.health?.rating),
        text: main.aspects?.health?.text?.trim() || '(AI không trả lời)',
      },
      family: {
        rating: clampRating(main.aspects?.family?.rating),
        text: main.aspects?.family?.text?.trim() || '(AI không trả lời)',
      },
    },
    months,
    advice,
  };
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
  // 4 deep section gọi đồng thời. Mỗi call đã wrap aiCall (limit + retry) trong callJsonSection.
  let done = 0;
  const tick = (label: string) => {
    done++;
    opts.onProgress?.(done, 4, label);
  };
  const [daiHan, tieuHan, twelvePalaces, namHienTai] = await Promise.all([
    analyzeDaiHan(chart, birthYear).then((r) => { tick('daiHan'); return r; }),
    analyzeTieuHan(chart, birthYear, currentYear).then((r) => { tick('tieuHan'); return r; }),
    analyzeTwelvePalaces(chart).then((r) => { tick('twelvePalaces'); return r; }),
    analyzeNamHienTai(chart, birthYear, currentYear).then((r) => { tick('namHienTai'); return r; }),
  ]);
  return { daiHan, tieuHan, twelvePalaces, namHienTai };
}

// ============================================================================
// Tứ Trụ Bát Tự — 1 call markdown trả 7 phần đã định nghĩa trong BAT_TU_PROMPT.
// `context` đã được caller format trước (tên/giới tính/dương lịch/âm lịch/4 trụ/Nhật chủ).
// ============================================================================

export async function analyzeBatTu(context: string): Promise<string> {
  return aiCall(async () => {
    const client = getDeepseekClient();
    const model = getDeepseekModel();

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.7,
      max_tokens: 3500, // 1500-2200 từ VN — buffer tránh truncate ở phần cuối
      messages: [
        { role: 'system', content: BAT_TU_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `THÔNG TIN ĐƯƠNG SỐ (bắt buộc bám sát):\n\n${context}\n\n---\n\n${BAT_TU_PROMPT}`,
        },
      ],
    });

    const finishReason = completion.choices[0]?.finish_reason;
    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) throw new Error('Deepseek không trả lời (bat-tu)');
    if (finishReason === 'length') {
      const err = new Error(
        `Deepseek bị cắt do max_tokens (bat-tu); thử retry`,
      ) as Error & { status: number };
      err.status = 500;
      throw err;
    }
    return text;
  }, 'bat-tu');
}
