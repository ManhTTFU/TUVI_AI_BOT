/**
 * Map birthHash (16 hex) → integer seed cho Deepseek `seed` parameter.
 * Lấy 7 hex đầu (max 0xFFFFFFF ≈ 268M) — fit safe trong int32 signed, tránh
 * edge case API reject seed quá lớn.
 */
export function seedFromHash(hash: string): number {
  return parseInt(hash.slice(0, 7), 16);
}

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

// Không dùng pLimit module-level — CF Workers chạy nhiều request cùng isolate,
// pLimit singleton tạo cross-request promise continuation bị CF Workers cancel/hang.
// withRetry đã handle 429/5xx; Deepseek paid tier không cần global semaphore
// (mỗi request gọi ≤13 calls, thấp hơn nhiều so với rate limit 5000 RPM).
/** Wrap 1 call AI: retry + timing log. Dùng cho mọi entry điểm Deepseek. */
export function aiCall<T>(fn: () => Promise<T>, label = 'ai'): Promise<T> {
  const start = Date.now();
  return withRetry(fn, { label }).then(
    (result) => {
      console.log(`[ai:${label}] ${Date.now() - start}ms`);
      return result;
    },
    (e) => {
      console.error(`[ai:${label}] FAILED after ${Date.now() - start}ms — ${(e as Error).message}`);
      throw e;
    },
  );
}
