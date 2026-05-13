import pLimit from 'p-limit';

/**
 * Map birthHash (16 hex) → integer seed cho Deepseek `seed` parameter.
 * Lấy 7 hex đầu (max 0xFFFFFFF ≈ 268M) — fit safe trong int32 signed, tránh
 * edge case API reject seed quá lớn.
 *
 * Mục đích: cùng input → cùng seed → output deterministic (~95-98%, best-effort
 * theo Deepseek doc). Cho phép cache share-cross-user có ý nghĩa logic chứ
 * không chỉ "đông cứng output random".
 */
export function seedFromHash(hash: string): number {
  return parseInt(hash.slice(0, 7), 16);
}

/**
 * Global concurrency limit cho mọi call Deepseek từ process này.
 *
 * Default 64 — chọn cho Deepseek paid tier (không hard cap concurrent, chỉ
 * rate-limit RPM ~5000). 64 đủ để:
 *  - 1 user submit Tu-Vi full (11 calls) chạy hoàn toàn song song.
 *  - 5-6 user submit cùng lúc vẫn không queue (60+ calls).
 *  - Còn buffer cho daily/personalize background.
 *
 * Limit thực tế ở mức cao hơn = Node single-thread + memory per pending HTTP
 * request (~10MB × 64 ≈ 640MB). Vượt 128 dễ nghẽn event loop.
 *
 * Có thể override qua env `AI_CONCURRENCY` (vd: AI_CONCURRENCY=128 cho server
 * mạnh, hoặc =16 trên free tier để tránh 429).
 */
const concurrency = Number(process.env.AI_CONCURRENCY) || 64;
export const aiLimit = pLimit(concurrency);

interface RetryOptions {
  retries?: number;
  baseMs?: number;
  maxMs?: number;
  label?: string;
}

/**
 * Retry với exponential backoff + jitter cho 429/5xx và network error.
 * KHÔNG retry với 4xx khác (vd 400/401/403) vì là lỗi user/config.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const { retries = 3, baseMs = 500, maxMs = 3000, label = 'ai' } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const status = (e as { status?: number; code?: string }).status;
      const isNetwork =
        (e as { code?: string }).code === 'ECONNRESET' ||
        (e as { code?: string }).code === 'ETIMEDOUT';
      const isRetryable = isNetwork || status === 429 || (typeof status === 'number' && status >= 500);
      if (!isRetryable || attempt === retries) throw e;
      const delay = Math.min(baseMs * 2 ** attempt, maxMs) + Math.floor(Math.random() * 200);
      console.warn(`[${label}] retry ${attempt + 1}/${retries} sau ${delay}ms (status=${status ?? 'net'})`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

/** Wrap 1 call AI: limit + retry + timing log. Dùng cho mọi entry điểm Deepseek. */
export function aiCall<T>(fn: () => Promise<T>, label = 'ai'): Promise<T> {
  return aiLimit(async () => {
    const start = Date.now();
    try {
      const result = await withRetry(fn, { label });
      const ms = Date.now() - start;
      console.log(`[ai:${label}] ${ms}ms`);
      return result;
    } catch (e) {
      const ms = Date.now() - start;
      console.error(`[ai:${label}] FAILED after ${ms}ms — ${(e as Error).message}`);
      throw e;
    }
  });
}
