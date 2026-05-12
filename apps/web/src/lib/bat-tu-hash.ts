import { createHash } from 'node:crypto';

export interface BatTuHashInput {
  gender: 'male' | 'female';
  /** Dương lịch DD/MM/YYYY zero-padded. */
  solarDate: string;
  hour: number; // 0..23
  minute: number; // 0..59
}

/**
 * Key cache cho Tứ Trụ. name + birthPlace KHÔNG vào hash — chỉ context hiển thị.
 */
export function batTuBirthHash(info: BatTuHashInput): string {
  const raw = `${info.gender}|${info.solarDate}|${info.hour}|${info.minute}`;
  return createHash('sha256').update(raw).digest('hex').slice(0, 16);
}
