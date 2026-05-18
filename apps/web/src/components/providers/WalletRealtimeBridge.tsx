/**
 * Bridge: Supabase Realtime broadcast → local wallet-sse bus.
 *
 * Mount 1 lần ở root (inside SessionProvider). Khi session có userId +
 * walletChannel → subscribe channel; mọi event 'balance' dispatch vào local
 * bus → UserMenu/WalletClient nhận qua subscribeWallet() như trước.
 *
 * Tại sao bridge thay vì subscribe trực tiếp ở từng component: tránh tạo
 * N WebSocket connection cho N component cùng dùng balance. 1 connection /
 * tab là đủ.
 */
'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getSupabaseBrowser } from '@/lib/realtime-client';
import { emitOptimisticBalance, type BalanceEventData } from '@/lib/wallet-sse';

export function WalletRealtimeBridge() {
  const { data: session } = useSession();
  const channelName = session?.user?.walletChannel;

  useEffect(() => {
    if (!channelName) return;
    const supa = getSupabaseBrowser();
    if (!supa) return;

    const channel = supa
      .channel(channelName, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'balance' }, ({ payload }) => {
        const data = payload as BalanceEventData;
        if (typeof data?.balanceVnd !== 'number') return;
        emitOptimisticBalance(data);
      })
      .subscribe();

    return () => {
      supa.removeChannel(channel).catch(() => {});
    };
  }, [channelName]);

  return null;
}
