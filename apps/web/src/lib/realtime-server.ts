/**
 * Supabase Realtime publisher — fan-out wallet balance change tới mọi browser
 * tab của user (cross-device push). Server-only.
 *
 * Architecture: Supabase Postgres KHÔNG dùng — data ở Neon. Chỉ dùng Supabase
 * như WebSocket pub/sub bus thuần. Mỗi user 1 channel `wallet:<hmac>` với
 * channel name = HMAC(userId, WALLET_REALTIME_SECRET) để không enumerate được.
 *
 * Wire-in điểm: gọi tự động bên trong `chargeReading` / `creditBalance` /
 * `debitBalance` ở wallet.ts — KHÔNG add publish call thủ công ở route.
 *
 * Failure: publish lỗi → swallow. Source-of-truth vẫn ở Neon, user thấy đúng
 * balance khi navigate/F5/`GET /api/wallet/balance`.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createHmac } from 'node:crypto';

export interface WalletEventPayload {
  balanceVnd: number;
  delta: number;
  reason: 'topup' | 'admin_credit' | 'refund' | 'charge' | 'admin_debit';
  service?: string;
}

let cachedClient: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  cachedClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 20 } },
  });
  return cachedClient;
}

/**
 * Channel name = `wallet:` + HMAC-SHA256(userId, WALLET_REALTIME_SECRET) truncated
 * to 16 hex chars (64 bit, đủ chống guess).
 *
 * Server lẫn auth.ts đều dùng hàm này để derive — đảm bảo browser nhận đúng
 * channel name qua session.user.walletChannel.
 */
export function walletChannelFor(userId: string): string {
  const secret = process.env.WALLET_REALTIME_SECRET;
  if (!secret) {
    // Fallback dev-only: dùng userId trực tiếp. KHÔNG bao giờ chạy prod vì
    // env phải có WALLET_REALTIME_SECRET. Log warning để dev biết.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[realtime] WALLET_REALTIME_SECRET missing — channel name fallback to plain userId');
    }
    return `wallet:${userId}`;
  }
  const hmac = createHmac('sha256', secret).update(userId).digest('hex').slice(0, 16);
  return `wallet:${hmac}`;
}

/**
 * Publish 1 event 'balance' tới channel của user. Awaited để Cloudflare Worker
 * không terminate trước khi WebSocket gửi xong. Latency ~50-200ms.
 *
 * KHÔNG throw — caller (wallet.ts) đã wrap fire-and-forget, lỗi publish không
 * được làm fail mutation.
 */
export async function publishWalletEvent(userId: string, payload: WalletEventPayload): Promise<void> {
  const supa = getClient();
  if (!supa) return; // Supabase chưa config — bỏ qua, polling/F5 vẫn fallback được.

  try {
    const ch = supa.channel(walletChannelFor(userId), {
      config: { broadcast: { ack: false, self: false } },
    });
    await ch.send({
      type: 'broadcast',
      event: 'balance',
      payload,
    });
    // Cleanup connection để không leak — broadcast send là 1-shot, không cần giữ.
    await supa.removeChannel(ch);
  } catch (e) {
    console.warn('[realtime] publish failed', (e as Error).message);
  }
}
