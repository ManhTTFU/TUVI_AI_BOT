import 'server-only';
import { createHash } from 'node:crypto';
import { aiCall, getDeepseekClient, getDeepseekModel, seedFromHash } from '@tuvi/ai';
import { getDb, hoangDaoCharts, hoangDaoAnalyses } from '@tuvi/db';
import { and, eq } from 'drizzle-orm';
import { ALL_SIGNS_VI, type SignVi } from './horoscope-lib';

export type Gender = 'male' | 'female';
export type Status = 'single' | 'dating' | 'married' | 'divorced';
export type Goal = 'career' | 'love' | 'wealth' | 'health' | 'study' | 'family';

const STATUS_LABEL: Record<Status, string> = {
  single: 'độc thân',
  dating: 'đang yêu, chưa kết hôn',
  married: 'đã kết hôn',
  divorced: 'đã ly hôn hoặc goá',
};

const GOAL_LABEL: Record<Goal, string> = {
  career: 'sự nghiệp / công việc',
  love: 'tình cảm / hôn nhân',
  wealth: 'tài chính / tiền bạc',
  health: 'sức khỏe / tinh thần',
  study: 'học hành / phát triển bản thân',
  family: 'gia đình / con cái',
};

const SIGN_BY_EN = new Map<string, SignVi>(ALL_SIGNS_VI.map((s) => [s.en, s]));

export interface PersonalizeInput {
  signEn: string;
  gender: Gender;
  status: Status;
  goal: Goal;
}

export interface PersonalizedReading {
  personality: { strengths: string[]; weaknesses: string[]; thinkingStyle: string };
  love: { style: string; challenges: string; advice: string };
  career: { suitable: string[]; workStyle: string; opportunity: string };
  advice: { actions: string[] };
}

export interface PersonalizeResult {
  id: string;
  reading: PersonalizedReading;
}

/**
 * Hash deterministic cho cache cross-user. Cùng (signEn, gender, status, goal)
 * → cùng hash → cùng reading. Match convention `birthHash` của tu-vi / bat-tu.
 */
function computeBirthHash(input: PersonalizeInput): string {
  return createHash('sha256')
    .update(`${input.signEn}|${input.gender}|${input.status}|${input.goal}`)
    .digest('hex')
    .slice(0, 16);
}

/**
 * Inflight map theo birthHash (KHÔNG theo userId): nếu 2 user khác nhau cùng
 * combo đồng thời miss → chỉ 1 Deepseek call, request thứ 2 đợi kết quả.
 */
const inflight = new Map<string, Promise<PersonalizedReading>>();

const SYSTEM_PROMPT = `Bạn là một chuyên gia chiêm tinh học phương Tây (Zodiac), có kinh nghiệm phân tích tính cách và xu hướng cuộc sống.

PHONG CÁCH VIẾT:
- Tự nhiên, như đang nói chuyện với người thật.
- Không mê tín cực đoan.
- Không nói kiểu "chắc chắn 100%" — dùng "có xu hướng", "thường", "có khả năng".
- Tránh sáo rỗng kiểu "ai đọc cũng thấy đúng".
- Có chiều sâu, giống chuyên gia chiêm tinh thật sự.

ĐỊNH DẠNG TRẢ VỀ: JSON object đúng schema được yêu cầu. Trong từng string KHÔNG dùng markdown (không "##", "**", "•", "-"), chỉ văn xuôi liền mạch. KHÔNG bọc JSON trong markdown code fence.`;

function buildPrompt(sign: SignVi, input: PersonalizeInput): string {
  return `Thông tin người dùng:
- Cung hoàng đạo: ${sign.name} (${sign.en} ${sign.sym}, nguyên tố ${sign.el}, ${sign.range})
- Giới tính: ${input.gender === 'male' ? 'Nam' : 'Nữ'}
- Trạng thái: ${STATUS_LABEL[input.status]}
- Mục tiêu hiện tại: ${GOAL_LABEL[input.goal]}

Hãy phân tích chi tiết và thực tế, KHÔNG viết chung chung. Bám SÁT cung ${sign.name} + bối cảnh cụ thể (giới tính, trạng thái, mục tiêu) của người dùng.

Trả về JSON object ĐÚNG schema dưới đây (đủ TẤT CẢ các key, không sót, không thêm key khác):

{
  "personality": {
    "strengths": ["3-4 điểm mạnh nổi bật của người ${sign.name}, mỗi mục là 1 câu cụ thể"],
    "weaknesses": ["2-3 điểm yếu cần cải thiện, không né tránh"],
    "thinkingStyle": "đoạn văn 2-3 câu mô tả cách họ suy nghĩ và ra quyết định"
  },
  "love": {
    "style": "2-3 câu mô tả cách ${sign.name} yêu — phong cách thể hiện tình cảm đặc trưng",
    "challenges": "2-3 câu nêu điểm dễ gặp vấn đề trong tình cảm",
    "advice": "2-3 câu lời khuyên thực tế phù hợp với trạng thái '${STATUS_LABEL[input.status]}' hiện tại"
  },
  "career": {
    "suitable": ["3-4 công việc / ngành nghề phù hợp với ${sign.name}, mỗi mục 1 câu ngắn"],
    "workStyle": "2-3 câu mô tả phong cách làm việc + điểm mạnh khi va chạm môi trường thực tế",
    "opportunity": "2-3 câu nêu cơ hội phát triển trong 6-12 tháng tới — thời điểm và lĩnh vực thuận"
  },
  "advice": {
    "actions": ["3-4 hành động cụ thể, áp dụng được ngay trong 1-3 tháng tới, bám đúng đặc trưng ${sign.name} + bối cảnh '${STATUS_LABEL[input.status]}' + mục tiêu '${GOAL_LABEL[input.goal]}', mỗi hành động 1-2 câu"]
  }
}

Ngôn ngữ: Tiếng Việt. Văn xuôi liền mạch trong từng field, KHÔNG markdown.`;
}

function ensureString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function ensureArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .map((x) => x.trim());
}

async function callDeepseek(
  sign: SignVi,
  input: PersonalizeInput,
  birthHash: string,
): Promise<PersonalizedReading> {
  const label = `personalize:${input.signEn}`;
  return aiCall(async () => {
    const client = getDeepseekClient();
    const model = getDeepseekModel();
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.8,
      // 500 từ × 2.8 token/từ + JSON overhead (~200) ≈ 1600 token. 3500 = buffer ~2x.
      max_tokens: 3500,
      seed: seedFromHash(birthHash),
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildPrompt(sign, input) },
      ],
    });
    const finishReason = completion.choices[0]?.finish_reason;
    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) throw new Error('Hệ thống không trả lời');
    if (finishReason === 'length') {
      const err = new Error(`Hệ thống bị cắt do max_tokens (${label}); thử retry`) as Error & {
        status: number;
      };
      err.status = 500;
      throw err;
    }
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const personality = (parsed.personality ?? {}) as Record<string, unknown>;
    const love = (parsed.love ?? {}) as Record<string, unknown>;
    const career = (parsed.career ?? {}) as Record<string, unknown>;
    const advice = (parsed.advice ?? {}) as Record<string, unknown>;

    return {
      personality: {
        strengths: ensureArray(personality.strengths),
        weaknesses: ensureArray(personality.weaknesses),
        thinkingStyle: ensureString(personality.thinkingStyle),
      },
      love: {
        style: ensureString(love.style),
        challenges: ensureString(love.challenges),
        advice: ensureString(love.advice),
      },
      career: {
        suitable: ensureArray(career.suitable),
        workStyle: ensureString(career.workStyle),
        opportunity: ensureString(career.opportunity),
      },
      advice: {
        actions: ensureArray(advice.actions),
      },
    };
  }, label);
}

/** Đọc reading từ analyses cache. Null nếu chưa có. */
async function readAnalysis(birthHash: string): Promise<PersonalizedReading | null> {
  const db = getDb();
  const [row] = await db
    .select({ reading: hoangDaoAnalyses.reading })
    .from(hoangDaoAnalyses)
    .where(eq(hoangDaoAnalyses.birthHash, birthHash))
    .limit(1);
  return row ? (row.reading as PersonalizedReading) : null;
}

/** Tìm chart row của user cho combo này (qua birthHash). */
async function findUserChart(userId: string, birthHash: string): Promise<{ id: string } | null> {
  const db = getDb();
  const [row] = await db
    .select({ id: hoangDaoCharts.id })
    .from(hoangDaoCharts)
    .where(and(eq(hoangDaoCharts.userId, userId), eq(hoangDaoCharts.birthHash, birthHash)))
    .limit(1);
  return row ?? null;
}

/**
 * Resolve reading qua 2 tầng cache:
 *   L1: inflight map theo birthHash (cùng instance, chống thundering herd)
 *   L2: hoang_dao_analyses table (cross-user, persistent)
 *   miss → gọi Deepseek + INSERT analyses (ON CONFLICT DO NOTHING)
 */
async function resolveReading(sign: SignVi, input: PersonalizeInput, birthHash: string): Promise<PersonalizedReading> {
  const cached = await readAnalysis(birthHash);
  if (cached) return cached;

  const pending = inflight.get(birthHash);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const reading = await callDeepseek(sign, input, birthHash);
      const db = getDb();
      await db
        .insert(hoangDaoAnalyses)
        .values({ birthHash, reading })
        .onConflictDoNothing();
      // Re-read để dùng version "thắng race" nếu có instance khác cùng INSERT.
      const final = (await readAnalysis(birthHash)) ?? reading;
      return final;
    } finally {
      inflight.delete(birthHash);
    }
  })();

  inflight.set(birthHash, promise);
  return promise;
}

/**
 * Đảm bảo user có chart row cho combo. Idempotent qua UNIQUE (userId, birthHash).
 * Trả về id của row (mới hoặc đã tồn tại).
 */
async function ensureUserChart(
  userId: string,
  input: PersonalizeInput,
  birthHash: string,
): Promise<string> {
  const existing = await findUserChart(userId, birthHash);
  if (existing) return existing.id;

  const db = getDb();
  await db
    .insert(hoangDaoCharts)
    .values({
      userId,
      signEn: input.signEn,
      gender: input.gender,
      status: input.status,
      goal: input.goal,
      birthHash,
    })
    .onConflictDoNothing();

  const after = await findUserChart(userId, birthHash);
  // Cực hiếm — chỉ xảy ra nếu unique index bị disable hoặc INSERT silent fail.
  return after?.id ?? '';
}

/**
 * Entry point: lấy hoặc tạo lá số luận giải cá nhân.
 *
 * Pattern 2-bảng theo chuẩn Tu-Vi/Tu-Tru:
 *  - hoang_dao_analyses (PK birthHash): shared cache cross-user — 100 user
 *    cùng combo → 1 Deepseek call, không re-generate.
 *  - hoang_dao_charts (per-user submission): row history, trỏ tới analyses
 *    qua birthHash.
 *
 * Flow:
 *  1. Hash 4 input → birthHash.
 *  2. Resolve reading (analyses cache hoặc Deepseek + insert).
 *  3. Đảm bảo user có chart row trỏ tới hash này.
 *  4. Trả {id, reading}.
 */
export async function getPersonalizedHoroscope(
  userId: string,
  input: PersonalizeInput,
): Promise<PersonalizeResult> {
  const sign = SIGN_BY_EN.get(input.signEn);
  if (!sign) throw new Error(`Sign không hợp lệ: ${input.signEn}`);

  const birthHash = computeBirthHash(input);

  // Song song: reading (analyses) + chart (user row). Hash đã có → analyses
  // có thể hit ngay (DB read ~5ms), chart insert cũng song song được.
  // Nếu analyses miss, chart vẫn tiếp tục — chỉ analyses chờ Deepseek.
  const [reading, chartId] = await Promise.all([
    resolveReading(sign, input, birthHash),
    ensureUserChart(userId, input, birthHash),
  ]);

  return { id: chartId, reading };
}
