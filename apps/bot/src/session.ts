import type { Gender } from '@tuvi/core';

export type Step =
  | 'idle'
  | 'name'
  | 'gender'
  | 'birthdate'
  | 'time'
  | 'place'
  | 'confirm'
  | 'processing';

export interface Session {
  step: Step;
  name?: string;
  gender?: Gender;
  birthDate?: string;
  timeIndex?: number;
  timeName?: string;
  birthPlace?: string;
}

export class SessionStore {
  private map = new Map<number, Session>();

  get(chatId: number): Session {
    let s = this.map.get(chatId);
    if (!s) {
      s = { step: 'idle' };
      this.map.set(chatId, s);
    }
    return s;
  }

  set(chatId: number, s: Session): void {
    this.map.set(chatId, s);
  }

  reset(chatId: number): void {
    this.map.set(chatId, { step: 'idle' });
  }

  delete(chatId: number): void {
    this.map.delete(chatId);
  }
}

export const sessions = new SessionStore();
