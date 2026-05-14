/**
 * Singleton EventSource cho /api/wallet/stream — tránh nhiều component
 * (UserMenu navbar, WalletClient trang ví, ...) cùng mở connection.
 *
 * Event: 'balance' { balanceVnd: number, delta: number, reason: string }
 *   - reason ∈ 'topup' | 'admin_credit' | 'refund' | 'charge' | 'admin_debit'
 */

export type WalletEvent = 'balance';
export interface BalanceEventData {
  balanceVnd: number;
  delta: number;
  reason: string;
  service?: string;
}
export type WalletListener = (event: WalletEvent, data: BalanceEventData) => void;

declare global {
  interface Window {
    __walletListeners?: Set<WalletListener>;
    __walletES?: EventSource;
  }
}

const EVENTS: WalletEvent[] = ['balance'];

export function subscribeWallet(fn: WalletListener): () => void {
  if (typeof window === 'undefined') return () => {};
  if (!window.__walletListeners) window.__walletListeners = new Set();
  window.__walletListeners.add(fn);

  if (!window.__walletES) {
    const es = new EventSource('/api/wallet/stream');
    window.__walletES = es;
    for (const evt of EVENTS) {
      es.addEventListener(evt, (e) => {
        let data: BalanceEventData | null = null;
        try {
          data = JSON.parse((e as MessageEvent).data);
        } catch {
          return;
        }
        if (!data) return;
        window.__walletListeners?.forEach((f) => {
          try {
            f(evt, data!);
          } catch {
            /* ignore */
          }
        });
      });
    }
  }

  return () => {
    window.__walletListeners?.delete(fn);
    if (window.__walletListeners && window.__walletListeners.size === 0) {
      window.__walletES?.close();
      window.__walletES = undefined;
    }
  };
}

/**
 * Synthetic dispatch — fire 'balance' event tới mọi listener local mà KHÔNG đợi
 * server SSE. Dùng cho optimistic UI: ngay khi user click submit, drop balance
 * trong header trước, server SSE thực sẽ arrive ~200-500ms sau với cùng số →
 * setBalance idempotent, không flicker.
 *
 * Nếu request 402 INSUFFICIENT_BALANCE → caller phải gọi `useSession().update()`
 * để re-fetch session từ DB, useEffect trong UserMenu/WalletClient sẽ reset
 * balance về giá trị thật.
 */
export function emitOptimisticBalance(data: BalanceEventData): void {
  if (typeof window === 'undefined') return;
  window.__walletListeners?.forEach((f) => {
    try {
      f('balance', data);
    } catch {
      /* ignore */
    }
  });
}
