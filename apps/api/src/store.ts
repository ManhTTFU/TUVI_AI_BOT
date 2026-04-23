import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { FullResult } from '@tuvi/core';

function chartsDir(): string {
  const out = process.env.OUTPUT_DIR || './output';
  return resolve(process.cwd(), out, 'charts');
}

function pdfsDir(): string {
  const out = process.env.OUTPUT_DIR || './output';
  return resolve(process.cwd(), out, 'pdfs');
}

export async function ensureDirs(): Promise<void> {
  for (const dir of [chartsDir(), pdfsDir()]) {
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  }
}

export async function saveFullResult(result: FullResult): Promise<string> {
  await ensureDirs();
  const filePath = resolve(chartsDir(), `${result.slug}.json`);
  await writeFile(filePath, JSON.stringify(result, null, 2), 'utf8');
  return filePath;
}

export async function loadFullResult(slug: string): Promise<FullResult | null> {
  const filePath = resolve(chartsDir(), `${slug}.json`);
  if (!existsSync(filePath)) return null;
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as FullResult;
}

export async function savePdf(slug: string, buf: Buffer): Promise<string> {
  await ensureDirs();
  const filePath = resolve(pdfsDir(), `${slug}.pdf`);
  await writeFile(filePath, buf);
  return filePath;
}

export function pdfPath(slug: string): string {
  return resolve(pdfsDir(), `${slug}.pdf`);
}
