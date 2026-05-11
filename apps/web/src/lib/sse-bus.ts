/**
 * In-process pub/sub cho SSE balance updates. KHÔNG work với multi-instance —
 * cần Redis pubsub cho production scale. MVP single-instance OK.
 */
type Listener = (msg: string) => void;

const listeners = new Map<string, Set<Listener>>();

export function subscribe(userId: string, fn: Listener): () => void {
  let set = listeners.get(userId);
  if (!set) {
    set = new Set();
    listeners.set(userId, set);
  }
  set.add(fn);
  return () => {
    set!.delete(fn);
    if (set!.size === 0) listeners.delete(userId);
  };
}

export function publish(userId: string, event: string, data: unknown): void {
  const set = listeners.get(userId);
  if (!set || set.size === 0) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const fn of set) {
    try {
      fn(payload);
    } catch {
      /* ignore */
    }
  }
}
