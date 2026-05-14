export type TarotSuit = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';

export interface TarotCard {
  /** Stable id, vd "major-00-fool", "wands-03". Dùng làm key trong DB. */
  id: string;
  /** Tên gốc tiếng Anh (theo Rider-Waite). */
  name: string;
  /** Tên hiển thị tiếng Việt. */
  nameVi: string;
  /** Bộ bài. */
  suit: TarotSuit;
  /** 0..21 cho major, 1..14 cho minor (Ace=1, Page=11, Knight=12, Queen=13, King=14). */
  number: number;
  /** Ý nghĩa cơ bản khi lá ngửa (xuôi), 1-2 câu Việt. */
  uprightMeaning: string;
  /** Ý nghĩa cơ bản khi lá ngược, 1-2 câu Việt. */
  reversedMeaning: string;
  /** File ảnh trên data.totl.net (KHÔNG kèm .jpg). Vd "rws_tarot_00_fool". */
  imageSlug: string;
}

export interface DrawnCard {
  cardId: string;
  reversed: boolean;
}
