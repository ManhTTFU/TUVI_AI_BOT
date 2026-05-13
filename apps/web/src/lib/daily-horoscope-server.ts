import 'server-only';
import { createHash } from 'node:crypto';
import { aiCall, getDeepseekClient, getDeepseekModel, seedFromHash } from '@tuvi/ai';
import { getDb, dailyHoroscope } from '@tuvi/db';
import { eq } from 'drizzle-orm';

const SIGNS_EN = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

export type EnglishSign = (typeof SIGNS_EN)[number];

// Chia 12 cung thành 2 nhóm 6 → gọi Deepseek song song. Mỗi call chỉ phải sinh
// ~6 × 2 câu nên không bao giờ chạm trần max_tokens, kể cả khi model viết hơi dài.
const SIGNS_GROUP_1 = SIGNS_EN.slice(0, 6) as readonly EnglishSign[];
const SIGNS_GROUP_2 = SIGNS_EN.slice(6, 12) as readonly EnglishSign[];

export interface DailyHoroscope {
  /** YYYY-MM-DD theo múi giờ Việt Nam. */
  date: string;
  /** Map: tên cung tiếng Anh → đoạn 2-3 câu luận giải VN cho hôm nay. */
  readings: Record<EnglishSign, string>;
}

/**
 * 2-tier cache:
 *   L1 = Map in-memory (instance-local, 0ms hit).
 *   L2 = bảng `daily_horoscope` trong Postgres (share giữa mọi instance).
 *
 * Flow miss: L1 miss → query L2 → nếu L2 miss thì gọi Deepseek → INSERT L2
 * (ON CONFLICT DO NOTHING để xử lý race khi 2 instance cùng miss). Sau INSERT
 * (hoặc conflict) đọc lại từ L2 và populate L1.
 *
 * Inflight promise tránh duplicate work trong cùng instance khi nhiều request
 * cùng arrive ngay khi L1 đang miss.
 */
const cache = new Map<string, DailyHoroscope>();
let inflight: Promise<DailyHoroscope> | null = null;

/** Ngày VN dạng YYYY-MM-DD. Dùng UTC+7 offset thay vì lib timezone. */
function vnDateStr(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

const SYSTEM_PROMPT = `Bạn là chiêm tinh gia 20 năm kinh nghiệm. Trả về JSON object đúng schema được yêu cầu — không markdown, không câu thừa, không bọc trong dấu nháy ngoài.`;

function buildPrompt(dateStr: string, signs: readonly EnglishSign[]): string {
  const schemaLines = signs.map((s) => `  "${s}": "1-2 câu"`).join(',\n');
  return `Hôm nay là ${dateStr}. Viết luận giải vận trình HÔM NAY cho ${signs.length} cung hoàng đạo bằng tiếng Việt: ${signs.join(', ')}.

QUY TẮC ĐỘ DÀI (BẮT BUỘC):
- Mỗi reading TỐI ĐA 2 câu ngắn (~25-35 từ mỗi cung).
- TUYỆT ĐỐI KHÔNG viết quá 2 câu.

Yêu cầu nội dung mỗi cung:
- Đề cập 1 năng lượng / sao chiếu nổi bật hôm nay.
- 1 ý ngắn về tình duyên HOẶC sự nghiệp HOẶC tài lộc (xen kẽ, không lặp).
- Không bịa số liệu cụ thể (vd "65%"), không hứa hẹn tuyệt đối.
- Không dùng markdown (** , ##, • ). Văn xuôi liền mạch.

Trả về JSON object đúng schema (đủ ${signs.length} key, không sót cung nào, KHÔNG thêm key khác ngoài danh sách):
{
${schemaLines}
}`;
}

/**
 * Seed = sha256(dateStr|groupIdx).slice(0,7) → int. Mỗi ngày × mỗi group → seed
 * khác nhau. Cùng ngày + cùng group → cùng seed → output deterministic, tránh
 * "đông cứng output random" khi cache.
 */
function seedForDailyGroup(dateStr: string, groupTag: string): number {
  const hash = createHash('sha256').update(`${dateStr}|${groupTag}`).digest('hex');
  return seedFromHash(hash);
}

async function callDeepseekGroup(
  dateStr: string,
  signs: readonly EnglishSign[],
): Promise<Partial<Record<EnglishSign, string>>> {
  const label = `daily-horoscope:${signs[0]}..${signs[signs.length - 1]}`;
  const seed = seedForDailyGroup(dateStr, signs[0]);
  return aiCall(async () => {
    const client = getDeepseekClient();
    const model = getDeepseekModel();
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.7,
      // Mỗi group chỉ 6 cung × ~2 câu × ~45 token VN ≈ 540 + JSON overhead (~150) + buffer.
      // 2500 là dư rất nhiều — gấp ~3 lần nhu cầu, an toàn kể cả khi model viết dài.
      max_tokens: 2500,
      seed,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildPrompt(dateStr, signs) },
      ],
    });
    const finishReason = completion.choices[0]?.finish_reason;
    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) throw new Error('Deepseek không trả lời (daily-horoscope)');
    if (finishReason === 'length') {
      // Mark status=500 → withRetry sẽ retry (model có thể viết ngắn hơn lần sau).
      const err = new Error(
        `Deepseek bị cắt do max_tokens (${label}); thử retry`,
      ) as Error & { status: number };
      err.status = 500;
      throw err;
    }
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const out: Partial<Record<EnglishSign, string>> = {};
    for (const en of signs) {
      const v = parsed[en];
      if (typeof v === 'string' && v.trim().length > 0) {
        out[en] = v.trim();
      } else {
        // Schema sai → throw retryable, model có thể fix lần sau.
        const err = new Error(`Thiếu reading cho ${en} trong response Deepseek`) as Error & {
          status: number;
        };
        err.status = 500;
        throw err;
      }
    }
    return out;
  }, label);
}

async function callDeepseek(dateStr: string): Promise<Record<EnglishSign, string>> {
  // 2 call song song, mỗi call 6 cung — vừa nhanh hơn (parallel) vừa tránh hoàn toàn
  // việc chạm trần max_tokens khi sinh JSON 12 entry tiếng Việt.
  const [g1, g2] = await Promise.all([
    callDeepseekGroup(dateStr, SIGNS_GROUP_1),
    callDeepseekGroup(dateStr, SIGNS_GROUP_2),
  ]);
  const readings = { ...g1, ...g2 } as Record<EnglishSign, string>;
  for (const en of SIGNS_EN) {
    if (!readings[en]) throw new Error(`Thiếu reading cho ${en} sau khi merge 2 group`);
  }
  return readings;
}

async function fetchFromDb(dateStr: string): Promise<DailyHoroscope | null> {
  const db = getDb();
  const [row] = await db
    .select({ readings: dailyHoroscope.readings })
    .from(dailyHoroscope)
    .where(eq(dailyHoroscope.date, dateStr))
    .limit(1);
  if (!row) return null;
  return { date: dateStr, readings: row.readings as Record<EnglishSign, string> };
}

async function resolve(dateStr: string): Promise<DailyHoroscope> {
  // L2: DB hit → dùng luôn.
  const fromDb = await fetchFromDb(dateStr);
  if (fromDb) return fromDb;

  // L2 miss: gọi Deepseek, INSERT (race-safe).
  const readings = await callDeepseek(dateStr);
  const db = getDb();
  await db
    .insert(dailyHoroscope)
    .values({ date: dateStr, readings })
    .onConflictDoNothing();

  // Đọc lại từ DB: nếu instance khác thắng race, ta dùng version của họ
  // (tránh trả về 2 bản khác nhau cho user cùng ngày, dù có thể đắt thêm
  // 1 Deepseek call nếu race xảy ra — chấp nhận trade-off này).
  const final = await fetchFromDb(dateStr);
  if (!final) {
    // Sanity fallback — chỉ xảy ra nếu DB write fail silently.
    return { date: dateStr, readings };
  }
  return final;
}

export async function getDailyHoroscope(): Promise<DailyHoroscope> {
  const dateStr = vnDateStr();

  // L1 hit.
  const cached = cache.get(dateStr);
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const result = await resolve(dateStr);
      cache.set(dateStr, result);
      // Dọn entry ngày cũ trong L1 — tránh leak memory dài hạn.
      for (const k of cache.keys()) if (k !== dateStr) cache.delete(k);
      return result;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}
