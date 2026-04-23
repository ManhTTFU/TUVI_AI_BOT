export function removeDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export function slugify(str: string): string {
  return removeDiacritics(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function makeChartSlug(name: string, birthDate: string): string {
  const base = slugify(name) || 'tu-vi';
  const year = birthDate.match(/(\d{4})/)?.[1] ?? '';
  const rand = Math.random().toString(36).slice(2, 6);
  return year ? `${base}-${year}-${rand}` : `${base}-${rand}`;
}
