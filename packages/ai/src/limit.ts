import pLimit from 'p-limit';

/**
 * Global concurrency limit cho mọi call Deepseek từ process này.
 * 16 đủ chỗ cho 6 section analyze + 4 deep readings chạy truly parallel khi FE
 * fire 2 endpoint cùng lúc (10 calls). Deepseek free tier cho phép 50 concurrent.
 * Có thể override qua env `AI_CONCURRENCY`.
 */
const concurrency = Number(process.env.AI_CONCURRENCY) || 16;
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
