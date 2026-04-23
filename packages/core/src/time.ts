export interface CanhGio {
  index: number;
  name: string;
  range: string;
}

export const CANH_GIO: readonly CanhGio[] = [
  { index: 0, name: 'Tý', range: '23:00 – 01:00' },
  { index: 1, name: 'Sửu', range: '01:00 – 03:00' },
  { index: 2, name: 'Dần', range: '03:00 – 05:00' },
  { index: 3, name: 'Mão', range: '05:00 – 07:00' },
  { index: 4, name: 'Thìn', range: '07:00 – 09:00' },
  { index: 5, name: 'Tỵ', range: '09:00 – 11:00' },
  { index: 6, name: 'Ngọ', range: '11:00 – 13:00' },
  { index: 7, name: 'Mùi', range: '13:00 – 15:00' },
  { index: 8, name: 'Thân', range: '15:00 – 17:00' },
  { index: 9, name: 'Dậu', range: '17:00 – 19:00' },
  { index: 10, name: 'Tuất', range: '19:00 – 21:00' },
  { index: 11, name: 'Hợi', range: '21:00 – 23:00' },
] as const;

/** Convert DD/MM/YYYY → YYYY-MM-DD (iztro format). Returns null if invalid. */
export function toIsoDate(ddmmyyyy: string): string | null {
  const m = ddmmyyyy.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  if (mo < 1 || mo > 12) return null;
  const daysInMonth = new Date(y, mo, 0).getDate();
  if (d < 1 || d > daysInMonth) return null;
  if (y < 1900 || y > 2100) return null;
  return `${y.toString().padStart(4, '0')}-${mo.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
}

export function validateBirthDate(ddmmyyyy: string): boolean {
  return toIsoDate(ddmmyyyy) !== null;
}
