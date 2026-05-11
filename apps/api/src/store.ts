import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import type {
  AnalysisSections,
  BirthInfo,
  DeepReadingsData,
  FullResult,
} from '@tuvi/core';

function outBase(): string {
  return process.env.OUTPUT_DIR || './output';
}

function chartsDir(): string {
  return resolve(process.cwd(), outBase(), 'charts');
}

function pdfsDir(): string {
  return resolve(process.cwd(), outBase(), 'pdfs');
}

function cacheDir(): string {
  return resolve(process.cwd(), outBase(), 'cache');
}

export async function ensureDirs(): Promise<void> {
  for (const dir of [chartsDir(), pdfsDir(), cacheDir()]) {
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  }
}

/**
 * Hash deterministic theo birth-info (KHÔNG bao gồm name).
 * Cùng ngày/giờ/giới tính → cùng key → có thể share cache giữa các user.
 * 12 ký tự đầu sha256 là đủ unique cho 500-5000 entry.
 */
export function birthCacheKey(info: Pick<BirthInfo, 'gender' | 'birthDate' | 'timeIndex'>): string {
  const raw = `${info.gender}|${info.birthDate}|${info.timeIndex}`;
  return createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

async function readJson<T>(path: string): Promise<T | null> {
  if (!existsSync(path)) return null;
  try {
    const raw = await readFile(path, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJson(path: string, data: unknown): Promise<void> {
  await ensureDirs();
  await writeFile(path, JSON.stringify(data), 'utf8');
}

export async function loadCachedAnalysis(key: string): Promise<AnalysisSections | null> {
  return readJson<AnalysisSections>(resolve(cacheDir(), `${key}.analysis.json`));
}

export async function saveCachedAnalysis(
  key: string,
  data: AnalysisSections,
): Promise<void> {
  await writeJson(resolve(cacheDir(), `${key}.analysis.json`), data);
}

/**
 * Cache deep-readings có tính cả năm hiện tại (vì `namHienTai` phụ thuộc year).
 * Sang năm mới, cache cũ vô hiệu — không xoá nhưng key khác.
 */
export function deepCacheKey(
  info: Pick<BirthInfo, 'gender' | 'birthDate' | 'timeIndex'>,
  currentYear: number,
): string {
  return `${birthCacheKey(info)}.${currentYear}`;
}

export async function loadCachedDeep(key: string): Promise<DeepReadingsData | null> {
  return readJson<DeepReadingsData>(resolve(cacheDir(), `${key}.deep.json`));
}

export async function saveCachedDeep(
  key: string,
  data: DeepReadingsData,
): Promise<void> {
  await writeJson(resolve(cacheDir(), `${key}.deep.json`), data);
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
