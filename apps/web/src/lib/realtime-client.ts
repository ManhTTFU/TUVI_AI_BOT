/**
 * Supabase Realtime client singleton (browser).
 *
 * Tách khỏi realtime-server.ts vì:
 *  - server.ts dùng `node:crypto` (HMAC) + service_role key — không bundle vào client
 *  - client.ts dùng anon key (public) + chỉ subscribe
 *
 * Singleton: 1 instance / tab. WebSocket connection lazy-init khi subscribe lần
 * đầu. Auto-reconnect built-in (exponential backoff).
 */
'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient | null {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 20 } },
  });
  return cached;
}
