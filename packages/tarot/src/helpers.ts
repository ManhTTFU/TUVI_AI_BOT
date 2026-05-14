import { TAROT_DECK, TAROT_IMAGE_BASE } from './deck.js';
import type { DrawnCard, TarotCard } from './types.js';

const CARD_BY_ID = new Map<string, TarotCard>(TAROT_DECK.map((c) => [c.id, c]));

export function getCardById(id: string): TarotCard | undefined {
  return CARD_BY_ID.get(id);
}

export function getCardByIdOrThrow(id: string): TarotCard {
  const c = CARD_BY_ID.get(id);
  if (!c) throw new Error(`Tarot card không tồn tại: ${id}`);
  return c;
}

export function getImageUrl(card: TarotCard | string): string {
  const slug = typeof card === 'string' ? getCardByIdOrThrow(card).imageSlug : card.imageSlug;
  return `${TAROT_IMAGE_BASE}${slug}.jpg`;
}

/**
 * Build raw string deterministic từ cards+field. Server hash bằng node:crypto;
 * client KHÔNG cần hash (nên không import node:crypto vào bundle).
 *
 * Sort cards theo cardId trước khi join → cùng tập lá theo thứ tự khác nhau
 * vẫn ra cùng raw. `reversed` được đưa theo `cardId|R`/`cardId|U` để lá
 * ngược vs xuôi cùng id ra raw khác (đúng — diễn giải khác hẳn).
 */
export function buildReadingHashRaw(cards: DrawnCard[], field: string): string {
  const sorted = [...cards]
    .map((c) => `${c.cardId}|${c.reversed ? 'R' : 'U'}`)
    .sort();
  return `${sorted.join(',')}#${field}`;
}

/** In-place Fisher-Yates shuffle (returns same array). */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Rút ngẫu nhiên n lá không lặp từ deck. Mỗi lá có 50% xác suất ngược.
 * Dùng `Math.random` — caller có thể override bằng cách shuffle deck rồi
 * gọi `pickAndReverse`. Hàm này tiện cho server-side fallback (test, cron).
 */
export function drawRandomCards(n: number, allowReversed = true): DrawnCard[] {
  if (n < 1 || n > 78) throw new Error(`numCards phải trong 1..78, got ${n}`);
  const deck = shuffle([...TAROT_DECK]);
  return deck.slice(0, n).map((c) => ({
    cardId: c.id,
    reversed: allowReversed && Math.random() < 0.5,
  }));
}

export function isValidCardId(id: string): boolean {
  return CARD_BY_ID.has(id);
}
