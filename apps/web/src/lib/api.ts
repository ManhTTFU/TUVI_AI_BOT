import type { FullResult } from '@tuvi/core';
import { API_BASE_URL } from './env';

export async function fetchChartBySlug(slug: string): Promise<FullResult | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/tuvi/chart/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.result ?? null;
  } catch {
    return null;
  }
}
