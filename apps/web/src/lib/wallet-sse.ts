/**
 * Singleton EventSource cho /api/wallet/stream — tránh nhiều component
 * (UserMenu navbar, WalletClient trang ví, ...) cùng mở connection.
 *
 * Event hiện tại: 'subscription' { proUntil: string|null, tier: 'PRO' }
 * (Legacy 'balance' và 'topup-completed' đã loại bỏ khi xoá balanceVnd.)
 */

export type WalletEvent = 'subscription';
export type WalletListener = (event: WalletEvent, data: any) => void;

declare global {
  interface Window {
    __walletListeners?: Set<WalletListener>;
    __walletES?: EventSource;
  }
}

const EVENTS: WalletEvent[] = ['subscription'];

export function subscribeWallet(fn: WalletListener): () => void {
  if (typeof window === 'undefined') return () => {};
  if (!window.__walletListeners) window.__walletListeners = new Set();
  window.__walletListeners.add(fn);

  if (!window.__walletES) {
    const es = new EventSource('/api/wallet/stream');
    window.__walletES = es;
    for (const evt of EVENTS) {
      es.addEventListener(evt, (e) => {
        let data: any = null;
        try {
          data = JSON.parse((e as MessageEvent).data);
        } catch {
          /* keep null */
        }
        window.__walletListeners?.forEach((f) => {
          try {
            f(evt, data);
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
