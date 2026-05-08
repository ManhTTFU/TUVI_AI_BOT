import { Router, type Request, type Response, type Router as ExpressRouter } from 'express';
import { calculateChart } from '@tuvi/astrology';
import { analyzeChart, analyzeDeepReadings } from '@tuvi/ai';
import { buildPdf } from '@tuvi/pdf';
import { makeChartSlug, CANH_GIO, validateBirthDate } from '@tuvi/core';
import type { BirthInfo, Gender, FullResult } from '@tuvi/core';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { loadFullResult, pdfPath, savePdf, saveFullResult } from '../store.js';

export const tuviRouter: ExpressRouter = Router();

function parseInfo(body: any): BirthInfo {
  const name = String(body?.name ?? '').trim();
  const gender = body?.gender as Gender;
  const birthDate = String(body?.birthDate ?? '').trim();
  const timeIndex = Number(body?.timeIndex);
  const birthPlace = String(body?.birthPlace ?? '').trim();

  if (!name) throw new Error('Thiếu họ tên');
  if (gender !== 'male' && gender !== 'female') throw new Error('Giới tính không hợp lệ');
  if (!validateBirthDate(birthDate)) throw new Error('Ngày sinh không hợp lệ (DD/MM/YYYY)');
  if (!Number.isInteger(timeIndex) || timeIndex < 0 || timeIndex > 11) {
    throw new Error('Giờ sinh không hợp lệ (0–11 theo 12 canh giờ)');
  }

  const timeName = CANH_GIO[timeIndex].name;
  return { name, gender, birthDate, timeIndex, timeName, birthPlace };
}

tuviRouter.post('/calculate', (req: Request, res: Response) => {
  try {
    const info = parseInfo(req.body);
    const chart = calculateChart(info);
    res.json({ ok: true, chart });
  } catch (e) {
    res.status(400).json({ ok: false, error: (e as Error).message });
  }
});

tuviRouter.post('/analyze', async (req: Request, res: Response) => {
  try {
    const info = parseInfo(req.body);
    const chart = calculateChart(info);
    const analysis = await analyzeChart(chart);
    res.json({ ok: true, chart, analysis });
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message });
  }
});

tuviRouter.post('/pdf', async (req: Request, res: Response) => {
  try {
    const info = parseInfo(req.body);
    const chart = calculateChart(info);
    const analysis = await analyzeChart(chart);
    const buf = await buildPdf({ chart, analysis });
    res
      .status(200)
      .setHeader('Content-Type', 'application/pdf')
      .setHeader('Content-Disposition', `attachment; filename="tuvi-${info.name}.pdf"`)
      .end(buf);
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message });
  }
});

tuviRouter.post('/full', async (req: Request, res: Response) => {
  try {
    const info = parseInfo(req.body);
    const slug = makeChartSlug(info.name, info.birthDate);
    const chart = calculateChart(info);
    const analysis = await analyzeChart(chart);
    const full: FullResult = {
      slug,
      createdAt: new Date().toISOString(),
      info,
      chart,
      analysis,
    };
    await saveFullResult(full);
    const buf = await buildPdf({ chart, analysis });
    await savePdf(slug, buf);
    res.json({ ok: true, slug, chart, analysis });
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message });
  }
});

tuviRouter.get('/chart/:slug', async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const result = await loadFullResult(slug);
  if (!result) return res.status(404).json({ ok: false, error: 'Không tìm thấy lá số' });
  res.json({ ok: true, result });
});

tuviRouter.get('/pdf/:slug', async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const p = pdfPath(slug);
  if (!existsSync(p)) return res.status(404).json({ ok: false, error: 'Không tìm thấy PDF' });
  const buf = await readFile(p);
  res
    .status(200)
    .setHeader('Content-Type', 'application/pdf')
    .setHeader('Content-Disposition', `inline; filename="${slug}.pdf"`)
    .end(buf);
});

tuviRouter.post('/deep-readings', async (req: Request, res: Response) => {
  try {
    const info = parseInfo(req.body);
    const chart = calculateChart(info);
    const birthYear = Number(info.birthDate.split('/')[2]);
    const currentYear = new Date().getFullYear();
    const deep = await analyzeDeepReadings(chart, birthYear, currentYear);
    res.json({ ok: true, deep });
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message });
  }
});

tuviRouter.get('/canh-gio', (_req, res) => {
  res.json({ ok: true, items: CANH_GIO });
});
