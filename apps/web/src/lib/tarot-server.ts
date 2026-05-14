import 'server-only';
import { createHash } from 'node:crypto';
import { aiCall, getDeepseekClient, getDeepseekModel, seedFromHash } from '@tuvi/ai';
import { getDb, tarotCharts, tarotReadings } from '@tuvi/db';
import {
  buildReadingHashRaw,
  getCardByIdOrThrow,
  type DrawnCard,
  type TarotCard,
} from '@tuvi/tarot';
import { eq } from 'drizzle-orm';

function computeReadingHash(cards: DrawnCard[], field: string): string {
  return createHash('sha256').update(buildReadingHashRaw(cards, field)).digest('hex').slice(0, 16);
}

export type TarotField = 'love' | 'career' | 'finance' | 'health' | 'general';
export type Gender = 'male' | 'female';

export const VALID_FIELDS: TarotField[] = ['love', 'career', 'finance', 'health', 'general'];
export const VALID_NUM_CARDS = [1, 3, 5, 7, 10] as const;
export type NumCards = (typeof VALID_NUM_CARDS)[number];

const FIELD_LABEL: Record<TarotField, string> = {
  love: 'tình duyên / hôn nhân',
  career: 'sự nghiệp / công việc',
  finance: 'tài chính / tiền bạc',
  health: 'sức khỏe / tinh thần',
  general: 'tổng quát',
};

/**
 * Position labels theo số lá rút. Mỗi spread có nghĩa riêng cho từng vị trí.
 *  1: One-card daily reading
 *  3: Past / Present / Future (cổ điển)
 *  5: Cross (Hiện tại / Thách thức / Nền tảng / Cơ hội / Kết quả)
 *  7: Horseshoe (Quá khứ / Hiện tại / Tương lai gần / Bạn / Môi trường / Trở ngại / Kết quả)
 * 10: Celtic Cross (Trung tâm / Vắt chéo / Nền tảng / Quá khứ gần / Đỉnh / Tương lai gần
 *     / Bạn / Môi trường / Hi vọng & sợ hãi / Kết cục)
 */
const POSITION_LABELS: Record<NumCards, string[]> = {
  1: ['Năng lượng dẫn dắt'],
  3: ['Quá khứ', 'Hiện tại', 'Tương lai'],
  5: ['Hiện tại', 'Thách thức', 'Nền tảng', 'Cơ hội', 'Kết quả'],
  7: [
    'Quá khứ',
    'Hiện tại',
    'Tương lai gần',
    'Bản thân bạn',
    'Môi trường xung quanh',
    'Trở ngại',
    'Kết quả khả dĩ',
  ],
  10: [
    'Trung tâm vấn đề',
    'Yếu tố vắt chéo',
    'Nền tảng tiềm thức',
    'Quá khứ gần',
    'Đỉnh ý thức',
    'Tương lai gần',
    'Bản thân bạn',
    'Môi trường ngoại cảnh',
    'Hi vọng & nỗi sợ',
    'Kết cục khả dĩ',
  ],
};

export function getPositionLabel(numCards: NumCards, idx: number): string {
  return POSITION_LABELS[numCards][idx] ?? `Vị trí ${idx + 1}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT — thầy Tarot Việt
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Bạn là một thầy Tarot người Việt có 20 năm hành nghề, đọc theo bộ Rider-Waite-Smith. Phong cách:
- Trầm tĩnh, sâu sắc, không sáo rỗng kiểu "ai đọc cũng thấy đúng".
- KHÔNG dùng ngôn từ tiên đoán cực đoan, KHÔNG dọa nạt (vd: "đại hung", "không thể tránh khỏi tai họa").
- KHÔNG đưa ra chẩn đoán y tế / pháp lý / tài chính cụ thể. Khi nhắc đến, kèm câu lưu ý tham khảo chuyên gia.
- Bám SÁT lá bài thật (tên, vị trí trong trải bài, chiều xuôi/ngược). Không bịa lá.
- Văn xuôi tiếng Việt liền mạch, KHÔNG markdown trong từng đoạn (không "##", "**", "•").`;

// ─────────────────────────────────────────────────────────────────────────────
// Shared reading — cache theo readingHash
// ─────────────────────────────────────────────────────────────────────────────

interface PerCardEntry {
  cardId: string;
  reversed: boolean;
  position: string;
  paragraph: string;
}

export interface TarotSharedReading {
  perCard: PerCardEntry[];
  overallMarkdown: string;
}

function buildPerCardPrompt(
  card: TarotCard,
  reversed: boolean,
  position: string,
  numCards: NumCards,
  field: TarotField,
  positionIdx: number,
): string {
  const orientation = reversed ? 'NGƯỢC' : 'XUÔI';
  const baseMeaning = reversed ? card.reversedMeaning : card.uprightMeaning;
  return `Trải bài ${numCards} lá, chủ đề: ${FIELD_LABEL[field]}.

Vị trí thứ ${positionIdx + 1} — **${position}**:
- Lá: **${card.nameVi}** (${card.name})
- Chiều: ${orientation}
- Ý nghĩa gốc của lá (tham khảo, không bê nguyên): ${baseMeaning}

Hãy viết 4-5 câu luận giải riêng cho lá này trong vị trí ${position}, gắn với chủ đề ${FIELD_LABEL[field]}. Nói rõ:
1. Lá này ở vị trí ${position} đang chỉ ra điều gì cụ thể trong bối cảnh ${FIELD_LABEL[field]}.
2. Chiều ${orientation} làm thay đổi sắc thái như thế nào.
3. Một thông điệp hành động/chiêm nghiệm cô đọng.

KHÔNG nhắc tên lá khác. KHÔNG dùng markdown. Văn xuôi liền mạch, 4-5 câu.`;
}

function buildOverallPrompt(
  cards: DrawnCard[],
  numCards: NumCards,
  field: TarotField,
): string {
  const lines = cards.map((c, i) => {
    const card = getCardByIdOrThrow(c.cardId);
    return `  ${i + 1}. ${POSITION_LABELS[numCards][i]} — ${card.nameVi} (${c.reversed ? 'ngược' : 'xuôi'})`;
  });
  return `Trải bài ${numCards} lá, chủ đề: ${FIELD_LABEL[field]}.

Các lá theo thứ tự vị trí:
${lines.join('\n')}

Hãy viết 5-7 câu TỔNG KẾT cả trải bài: dòng chảy năng lượng tổng thể đi từ vị trí đầu đến cuối, mối liên kết giữa các lá (cộng hưởng hay đối nghịch), thông điệp lớn của trải bài cho chủ đề ${FIELD_LABEL[field]}, và một lời khuyên cô đọng cho người hỏi.

KHÔNG luận chi tiết từng lá lại (đã có call riêng cho từng lá). Tập trung vào BỨC TRANH LỚN.

KHÔNG dùng markdown. Văn xuôi liền mạch.`;
}

async function callPerCard(
  card: TarotCard,
  drawn: DrawnCard,
  position: string,
  positionIdx: number,
  numCards: NumCards,
  field: TarotField,
  seed: number,
): Promise<string> {
  return aiCall(async () => {
    const client = getDeepseekClient();
    const model = getDeepseekModel();
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.85,
      // ~150 từ × 3 token + buffer = ~700 tokens. 1500 = 2x safety.
      max_tokens: 1500,
      seed,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: buildPerCardPrompt(card, drawn.reversed, position, numCards, field, positionIdx),
        },
      ],
    });
    const finishReason = completion.choices[0]?.finish_reason;
    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) throw new Error(`Hệ thống không trả lời lá ${card.id}`);
    if (finishReason === 'length') {
      const err = new Error(`Bị cắt do max_tokens (lá ${card.id})`) as Error & { status: number };
      err.status = 500;
      throw err;
    }
    return text;
  }, `tarot:card:${card.id.slice(0, 12)}`);
}

async function callOverall(
  cards: DrawnCard[],
  numCards: NumCards,
  field: TarotField,
  seed: number,
): Promise<string> {
  return aiCall(async () => {
    const client = getDeepseekClient();
    const model = getDeepseekModel();
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.85,
      // ~250 từ × 3 + 200 buffer ≈ 950. 2000 = 2x safety.
      max_tokens: 2000,
      seed,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildOverallPrompt(cards, numCards, field) },
      ],
    });
    const finishReason = completion.choices[0]?.finish_reason;
    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) throw new Error('Hệ thống không trả lời phần tổng kết');
    if (finishReason === 'length') {
      const err = new Error(`Bị cắt do max_tokens (overall)`) as Error & { status: number };
      err.status = 500;
      throw err;
    }
    return text;
  }, `tarot:overall`);
}

/**
 * Sinh shared reading. Parallel: N call per-card + 1 call overall = N+1 call.
 * Mọi call dùng seed = seedFromHash(readingHash) + offset để output deterministic.
 */
async function generateSharedReading(
  cards: DrawnCard[],
  field: TarotField,
  numCards: NumCards,
  readingHash: string,
): Promise<TarotSharedReading> {
  const baseSeed = seedFromHash(readingHash);

  const perCardPromises = cards.map((drawn, idx) => {
    const card = getCardByIdOrThrow(drawn.cardId);
    const position = POSITION_LABELS[numCards][idx];
    return callPerCard(card, drawn, position, idx, numCards, field, baseSeed + idx).then(
      (paragraph): PerCardEntry => ({
        cardId: drawn.cardId,
        reversed: drawn.reversed,
        position,
        paragraph,
      }),
    );
  });

  const overallPromise = callOverall(cards, numCards, field, baseSeed + 100);

  const [perCard, overallMarkdown] = await Promise.all([
    Promise.all(perCardPromises),
    overallPromise,
  ]);

  return { perCard, overallMarkdown };
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache layer: inflight map + DB cache
// ─────────────────────────────────────────────────────────────────────────────

const inflight = new Map<string, Promise<TarotSharedReading>>();

async function readReadingFromCache(readingHash: string): Promise<TarotSharedReading | null> {
  const db = getDb();
  const [row] = await db
    .select({
      perCard: tarotReadings.perCard,
      overallMarkdown: tarotReadings.overallMarkdown,
    })
    .from(tarotReadings)
    .where(eq(tarotReadings.readingHash, readingHash))
    .limit(1);
  if (!row) return null;
  return {
    perCard: row.perCard as PerCardEntry[],
    overallMarkdown: row.overallMarkdown,
  };
}

async function resolveSharedReading(
  cards: DrawnCard[],
  field: TarotField,
  numCards: NumCards,
  readingHash: string,
): Promise<TarotSharedReading> {
  const cached = await readReadingFromCache(readingHash);
  if (cached) return cached;

  const pending = inflight.get(readingHash);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const reading = await generateSharedReading(cards, field, numCards, readingHash);
      const db = getDb();
      await db
        .insert(tarotReadings)
        .values({
          readingHash,
          cardsJson: cards,
          field,
          perCard: reading.perCard,
          overallMarkdown: reading.overallMarkdown,
        })
        .onConflictDoNothing();
      const final = (await readReadingFromCache(readingHash)) ?? reading;
      return final;
    } finally {
      inflight.delete(readingHash);
    }
  })();

  inflight.set(readingHash, promise);
  return promise;
}

// ─────────────────────────────────────────────────────────────────────────────
// Personalize layer — per-user, NO cache
// ─────────────────────────────────────────────────────────────────────────────

export interface TarotPersonalized {
  /** 2-3 câu mở đầu xưng hô tên user, đặt bối cảnh trải bài. */
  intro: string;
  /** Per-card từ shared cache, KHÔNG sửa. */
  perCard: PerCardEntry[];
  /** Overall từ shared cache, KHÔNG sửa. */
  overall: string;
  /** 3-5 câu trả lời câu hỏi cụ thể. Null nếu user không hỏi. */
  answer: string | null;
}

function buildPersonalizePrompt(
  userName: string,
  gender: Gender,
  field: TarotField,
  question: string | null,
  numCards: NumCards,
  cards: DrawnCard[],
  shared: TarotSharedReading,
): string {
  const cardList = cards
    .map((c, i) => {
      const card = getCardByIdOrThrow(c.cardId);
      return `  ${i + 1}. ${POSITION_LABELS[numCards][i]}: ${card.nameVi} (${c.reversed ? 'ngược' : 'xuôi'})`;
    })
    .join('\n');

  const genderWord = gender === 'male' ? 'anh' : 'chị';

  const wantsAnswer = question && question.trim().length > 0;

  return `Người hỏi:
- Tên: ${userName}
- Giới tính: ${gender === 'male' ? 'Nam' : 'Nữ'} (xưng "${genderWord}" trong văn)
- Chủ đề muốn xem: ${FIELD_LABEL[field]}
${wantsAnswer ? `- Câu hỏi cụ thể: "${question}"` : '- Không có câu hỏi cụ thể, xem tổng quan chủ đề.'}

Trải bài ${numCards} lá đã rút:
${cardList}

Đoạn luận giải tổng (tham khảo, KHÔNG bê nguyên):
${shared.overallMarkdown}

Hãy trả về JSON object đúng schema sau (chỉ JSON, KHÔNG markdown code fence):

{
  "intro": "2-3 câu mở đầu xưng hô ${userName} bằng '${genderWord}', đặt không khí trải bài, không sáo rỗng",
  "answer": ${wantsAnswer ? '"3-5 câu trả lời TRỰC TIẾP câu hỏi của người hỏi dựa trên trải bài, gọi tên 1-2 lá then chốt nhất"' : 'null'}
}

LƯU Ý:
- KHÔNG lặp lại nội dung của đoạn luận giải tổng — đó đã có sẵn.
- Văn xuôi liền mạch, KHÔNG markdown.
- intro luôn xưng "${genderWord} ${userName}" hoặc "${userName} thân mến" — KHÔNG dùng "bạn".
${wantsAnswer ? '' : '- Trả answer là null (không phải chuỗi rỗng).'}`;
}

async function callPersonalize(
  userName: string,
  gender: Gender,
  field: TarotField,
  question: string | null,
  numCards: NumCards,
  cards: DrawnCard[],
  shared: TarotSharedReading,
): Promise<{ intro: string; answer: string | null }> {
  return aiCall(async () => {
    const client = getDeepseekClient();
    const model = getDeepseekModel();
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.9,
      // intro ~80 từ + answer ~150 từ → ~230 từ × 3 + JSON overhead 150 = ~840. 2000 = 2.4x safety.
      max_tokens: 2000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: buildPersonalizePrompt(
            userName,
            gender,
            field,
            question,
            numCards,
            cards,
            shared,
          ),
        },
      ],
    });
    const finishReason = completion.choices[0]?.finish_reason;
    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) throw new Error('Hệ thống không trả lời phần cá nhân hóa');
    if (finishReason === 'length') {
      const err = new Error('Bị cắt do max_tokens (personalize)') as Error & { status: number };
      err.status = 500;
      throw err;
    }
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      const err = new Error('JSON parse fail (personalize)') as Error & { status: number };
      err.status = 500;
      throw err;
    }
    const intro = typeof parsed.intro === 'string' ? parsed.intro.trim() : '';
    const answer = typeof parsed.answer === 'string' && parsed.answer.trim().length > 0
      ? parsed.answer.trim()
      : null;
    if (!intro) {
      const err = new Error('intro trống (personalize)') as Error & { status: number };
      err.status = 500;
      throw err;
    }
    return { intro, answer };
  }, 'tarot:personalize');
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateTarotInput {
  userId: string;
  name: string;
  gender: Gender;
  field: TarotField;
  question: string | null;
  numCards: NumCards;
  cards: DrawnCard[];
}

export interface TarotResult {
  chartId: string;
  cards: DrawnCard[];
  field: TarotField;
  numCards: NumCards;
  question: string | null;
  name: string;
  gender: Gender;
  reading: TarotPersonalized;
}

/**
 * Tạo chart row + resolve shared reading + personalize.
 *
 * Flow:
 *  1. Hash cards+field → readingHash.
 *  2. Song song:
 *     a. resolveSharedReading (cache hoặc Deepseek) — share cross-user.
 *     b. INSERT tarot_charts row (per-user, history).
 *  3. Sau khi có shared, gọi personalize (per-user, no cache).
 *  4. Return { chartId, reading: { intro, perCard, overall, answer } }.
 */
export async function createTarotReading(input: CreateTarotInput): Promise<TarotResult> {
  // Validate cards
  if (input.cards.length !== input.numCards) {
    throw new Error(`Số lá rút (${input.cards.length}) ≠ numCards (${input.numCards})`);
  }
  const seen = new Set<string>();
  for (const c of input.cards) {
    if (seen.has(c.cardId)) throw new Error(`Lá trùng trong trải bài: ${c.cardId}`);
    seen.add(c.cardId);
    getCardByIdOrThrow(c.cardId); // throws if invalid
  }

  const readingHash = computeReadingHash(input.cards, input.field);

  const db = getDb();
  const insertChart = db
    .insert(tarotCharts)
    .values({
      userId: input.userId,
      name: input.name,
      gender: input.gender,
      field: input.field,
      question: input.question,
      numCards: input.numCards,
      cards: input.cards,
      readingHash,
    })
    .returning({ id: tarotCharts.id });

  // Parallel: chart insert + shared reading resolution.
  const [chartRows, shared] = await Promise.all([
    insertChart,
    resolveSharedReading(input.cards, input.field, input.numCards, readingHash),
  ]);

  const { intro, answer } = await callPersonalize(
    input.name,
    input.gender,
    input.field,
    input.question,
    input.numCards,
    input.cards,
    shared,
  );

  return {
    chartId: chartRows[0].id,
    cards: input.cards,
    field: input.field,
    numCards: input.numCards,
    question: input.question,
    name: input.name,
    gender: input.gender,
    reading: {
      intro,
      perCard: shared.perCard,
      overall: shared.overallMarkdown,
      answer,
    },
  };
}

/** Load chart từ DB + resolve reading (cache hit hầu như chắc chắn) + personalize lại. */
export async function getTarotReadingById(chartId: string, userId: string): Promise<TarotResult | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(tarotCharts)
    .where(eq(tarotCharts.id, chartId))
    .limit(1);
  if (!row) return null;
  if (row.userId !== userId) return null; // Không cho user khác xem chart không phải của mình.

  const cards = row.cards as DrawnCard[];
  const field = row.field as TarotField;
  const numCards = row.numCards as NumCards;

  const shared = await resolveSharedReading(cards, field, numCards, row.readingHash);
  const { intro, answer } = await callPersonalize(
    row.name,
    row.gender as Gender,
    field,
    row.question,
    numCards,
    cards,
    shared,
  );

  return {
    chartId: row.id,
    cards,
    field,
    numCards,
    question: row.question,
    name: row.name,
    gender: row.gender as Gender,
    reading: {
      intro,
      perCard: shared.perCard,
      overall: shared.overallMarkdown,
      answer,
    },
  };
}
