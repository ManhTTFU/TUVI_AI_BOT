/**
 * Wallet pub/sub — KHÔNG còn polling, chỉ optimistic dispatch khi client action
 * charge/topup. Balance source-of-truth là `session.user.balanceVnd` (Auth.js v5
 * read DB mỗi request → fresh khi navigate/F5).
 *
 * Event 'balance' fire khi:
 *  - Submit form gọi `emitOptimisticBalance` (charge / topup / admin update).
 *  - Component subscribe để update UI ngay tức thì.
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
  }
}

export function subscribeWallet(fn: WalletListener): () => void {
  if (typeof window === 'undefined') return () => {};
  if (!window.__walletListeners) window.__walletListeners = new Set();
  window.__walletListeners.add(fn);
  return () => {
    window.__walletListeners?.delete(fn);
  };
}

export function emitOptimisticBalance(data: BalanceEventData): void {
  if (typeof window === 'undefined') return;
  window.__walletListeners?.forEach((fn) => {
    try {
      fn('balance', data);
    } catch {
      /* ignore */
    }
  });
}
