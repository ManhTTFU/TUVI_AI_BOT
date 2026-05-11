import { createHash } from 'node:crypto';
import type { BirthInfo } from '@tuvi/core';

export function birthHash(info: Pick<BirthInfo, 'gender' | 'birthDate' | 'timeIndex'>): string {
  const raw = `${info.gender}|${info.birthDate}|${info.timeIndex}`;
  return createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

/**
 * Parse + validate raw client payload thành BirthInfo solar (DD/MM/YYYY).
 * Throws Error nếu invalid.
 */
export function parseBirthPayload(body: any): BirthInfo & { lunarMode: boolean } {
  const name = String(body?.name ?? '').trim();
  if (!name) throw new Error('Thiếu họ tên');

  const gender = body?.gender;
  if (gender !== 'male' && gender !== 'female') throw new Error('Giới tính không hợp lệ');

  const birthDate = String(body?.birthDate ?? '').trim();
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(birthDate)) {
    throw new Error('Ngày sinh không hợp lệ (DD/MM/YYYY)');
  }
  const [d, m, y] = birthDate.split('/').map(Number);
  if (
    y < 1900 ||
    y > 2100 ||
    m < 1 ||
    m > 12 ||
    d < 1 ||
    d > 31
  ) {
    throw new Error('Ngày sinh ngoài phạm vi hợp lệ');
  }
  const test = new Date(y, m - 1, d);
  if (test.getFullYear() !== y || test.getMonth() !== m - 1 || test.getDate() !== d) {
    throw new Error('Ngày dương lịch không tồn tại');
  }

  const timeIndex = Number(body?.timeIndex);
  if (!Number.isInteger(timeIndex) || timeIndex < 0 || timeIndex > 11) {
    throw new Error('Giờ sinh không hợp lệ (0–11)');
  }

  const lunarMode = !!body?.lunarMode;
  const timeName = String(body?.timeName ?? '');
  const birthPlace = String(body?.birthPlace ?? '').trim();

  return { name, gender, birthDate, timeIndex, timeName, birthPlace, lunarMode };
}
