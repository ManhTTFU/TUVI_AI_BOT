import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export interface FontPaths {
  regular: string;
  bold: string;
  italic: string;
}

function findFontsDir(): string {
  const candidates = [
    resolve(process.cwd(), 'fonts'),
    resolve(process.cwd(), '../fonts'),
    resolve(process.cwd(), '../../fonts'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return candidates[0];
}

export function getFontPaths(): FontPaths {
  const dir = findFontsDir();
  return {
    regular: resolve(dir, 'NotoSans-Regular.ttf'),
    bold: resolve(dir, 'NotoSans-Bold.ttf'),
    italic: resolve(dir, 'NotoSans-Italic.ttf'),
  };
}

export function assertFontsExist(paths: FontPaths): void {
  if (!existsSync(paths.regular) || !existsSync(paths.bold)) {
    throw new Error(
      `Không tìm thấy font Noto Sans ở ${paths.regular}. Chạy: pnpm download-fonts`,
    );
  }
}
