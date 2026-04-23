import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONT_DIR = join(__dirname, '..', 'fonts');

const FONTS: Array<{ file: string; urls: string[] }> = [
  {
    file: 'NotoSans-Regular.ttf',
    urls: [
      'https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf',
      'https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf',
    ],
  },
  {
    file: 'NotoSans-Bold.ttf',
    urls: [
      'https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Bold.ttf',
      'https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf',
    ],
  },
  {
    file: 'NotoSans-Italic.ttf',
    urls: [
      'https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Italic.ttf',
      'https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/NotoSans-Italic%5Bwdth%2Cwght%5D.ttf',
    ],
  },
];

async function downloadOne(file: string, urls: string[]): Promise<void> {
  const dest = join(FONT_DIR, file);
  if (existsSync(dest)) {
    console.log(`[fonts] ${file} already exists, skip`);
    return;
  }
  if (!existsSync(FONT_DIR)) mkdirSync(FONT_DIR, { recursive: true });

  let lastErr: unknown = null;
  for (const url of urls) {
    try {
      console.log(`[fonts] downloading ${file} from ${url}`);
      const res = await fetch(url);
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      await pipeline(Readable.fromWeb(res.body as any), createWriteStream(dest));
      console.log(`[fonts] saved ${file}`);
      return;
    } catch (err) {
      lastErr = err;
      console.warn(`[fonts] failed ${url}: ${(err as Error).message}`);
    }
  }
  throw new Error(`Unable to download ${file}: ${(lastErr as Error)?.message}`);
}

async function main() {
  for (const f of FONTS) {
    try {
      await downloadOne(f.file, f.urls);
    } catch (err) {
      console.error(err);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
