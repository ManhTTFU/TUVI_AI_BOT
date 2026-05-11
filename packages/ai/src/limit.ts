import pLimit from 'p-limit';

/**
 * Global concurrency limit cho mọi call Deepseek từ process này.
 * 8 là sweet spot: nhanh hơn 4–5×, không đụng rate-limit chuẩn (60 RPM, 50 concurrent).
 * Có thể override qua env `AI_CONCURRENCY` (vd "16") khi scale up.
 */
const concurrency = Number(process.env.AI_CONCURRENCY) || 8;
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
  const { retries = 4, baseMs = 600, maxMs = 8000, label = 'ai' } = opts;
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

/** Wrap 1 call AI: limit + retry. Dùng cho mọi entry điểm Deepseek. */
export function aiCall<T>(fn: () => Promise<T>, label = 'ai'): Promise<T> {
  return aiLimit(() => withRetry(fn, { label }));
}
