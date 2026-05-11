/** Centralized logic cho tier PRO vs NORMAL. */

export function isProActive(proUntil: Date | string | null | undefined): boolean {
  if (!proUntil) return false;
  const t = typeof proUntil === 'string' ? new Date(proUntil) : proUntil;
  return t.getTime() > Date.now();
}

export function tierFromProUntil(proUntil: Date | string | null | undefined): 'PRO' | 'NORMAL' {
  return isProActive(proUntil) ? 'PRO' : 'NORMAL';
}

/**
 * Lifetime mốc thời gian: timestamp năm 9999 — đủ xa để không bao giờ hết hạn
 * trong thực tế, vẫn fit trong timestamp Postgres.
 */
export const LIFETIME_DATE = new Date('9999-12-31T00:00:00Z');

export function isLifetime(proUntil: Date | string | null | undefined): boolean {
  if (!proUntil) return false;
  const t = typeof proUntil === 'string' ? new Date(proUntil) : proUntil;
  return t.getFullYear() >= 9999;
}

export function formatProExpiry(proUntil: Date | string | null | undefined): string {
  if (!proUntil) return '—';
  if (isLifetime(proUntil)) return 'Trọn đời';
  const t = typeof proUntil === 'string' ? new Date(proUntil) : proUntil;
  return t.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function daysRemaining(proUntil: Date | string | null | undefined): number {
  if (!proUntil) return 0;
  if (isLifetime(proUntil)) return Number.POSITIVE_INFINITY;
  const t = typeof proUntil === 'string' ? new Date(proUntil) : proUntil;
  const diff = t.getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}
