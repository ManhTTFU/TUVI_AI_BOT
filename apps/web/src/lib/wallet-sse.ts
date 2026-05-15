/**
 * Client polling balance — thay thế EventSource SSE để chạy được trên CF Workers
 * stateless. Singleton timer dùng window globals, mọi component subscribe chung
 * 1 interval (UserMenu navbar + WalletClient + submit form ...).
 *
 * Event 'balance' fire khi:
 *  - Khởi tạo (lần poll đầu, delta=0, reason='init') — snapshot từ DB.
 *  - Phát hiện balance đổi so với last poll (delta ≠ 0, reason='topup'/'charge').
 *  - Gọi `emitOptimisticBalance` từ submit form (delta + reason caller cung cấp).
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
    __walletPollTimer?: number;
    __walletLastBalance?: number;
  }
}

const POLL_INTERVAL_MS = 5_000;

async function pollBalance(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const res = await fetch('/api/wallet/balance', { cache: 'no-store' });
    if (!res.ok) return;
    const data = (await res.json()) as { balanceVnd?: number };
    if (typeof data.balanceVnd !== 'number') return;

    const prev = window.__walletLastBalance;
    const isInitial = prev === undefined;
    const delta = isInitial ? 0 : data.balanceVnd - prev;

    if (!isInitial && delta === 0) return;

    window.__walletLastBalance = data.balanceVnd;
    const reason = isInitial ? 'init' : delta > 0 ? 'topup' : 'charge';
    window.__walletListeners?.forEach((fn) => {
      try {
        fn('balance', { balanceVnd: data.balanceVnd!, delta, reason });
      } catch {
        /* ignore */
      }
    });
  } catch {
    /* network error, retry next tick */
  }
}

export function subscribeWallet(fn: WalletListener): () => void {
  if (typeof window === 'undefined') return () => {};
  if (!window.__walletListeners) window.__walletListeners = new Set();
  window.__walletListeners.add(fn);

  if (!window.__walletPollTimer) {
    window.__walletPollTimer = window.setInterval(pollBalance, POLL_INTERVAL_MS);
    void pollBalance();
  }

  return () => {
    window.__walletListeners?.delete(fn);
    if (window.__walletListeners && window.__walletListeners.size === 0) {
      if (window.__walletPollTimer) {
        clearInterval(window.__walletPollTimer);
        window.__walletPollTimer = undefined;
      }
      window.__walletLastBalance = undefined;
    }
  };
}

/**
 * Synthetic dispatch — fire 'balance' event tới mọi listener ngay tức thì cho
 * optimistic UI. Update last balance state để lần poll sau không thấy "đổi"
 * khi server commit cùng giá trị.
 */
export function emitOptimisticBalance(data: BalanceEventData): void {
  if (typeof window === 'undefined') return;
  window.__walletLastBalance = data.balanceVnd;
  window.__walletListeners?.forEach((fn) => {
    try {
      fn('balance', data);
    } catch {
      /* ignore */
    }
  });
}
