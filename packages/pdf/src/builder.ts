import PDFDocument from 'pdfkit';
import { createWriteStream } from 'node:fs';
import type { AnalysisSections, ChartData } from '@tuvi/core';
import { ANALYSIS_TITLES } from '@tuvi/core';
import { assertFontsExist, getFontPaths } from './fonts.js';
import { FONT } from './render.js';
import { renderCover } from './pages/cover.js';
import { renderToc } from './pages/toc.js';
import { renderSection } from './pages/section.js';
import { renderFinal } from './pages/final.js';

export interface BuildPdfOptions {
  chart: ChartData;
  analysis: AnalysisSections;
}

function createDoc(): PDFKit.PDFDocument {
  const paths = getFontPaths();
  assertFontsExist(paths);

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 95, bottom: 70, left: 55, right: 55 },
    autoFirstPage: false,
    info: {
      Title: 'Lá số Tử Vi Đẩu Số',
      Author: 'Tử Vi AI',
      Subject: 'Luận giải lá số tử vi',
    },
  });

  doc.registerFont(FONT.regular, paths.regular);
  doc.registerFont(FONT.bold, paths.bold);
  try {
    doc.registerFont(FONT.italic, paths.italic);
  } catch {
    doc.registerFont(FONT.italic, paths.regular);
  }
  doc.font(FONT.regular);
  return doc;
}

const SECTION_ORDER: Array<keyof AnalysisSections> = [
  'overview',
  'career',
  'love',
  'health',
  'decade',
  'advice',
];

function addAllPages(doc: PDFKit.PDFDocument, chart: ChartData, analysis: AnalysisSections): void {
  // Cover
  doc.addPage();
  renderCover(doc, chart);

  // TOC
  doc.addPage();
  renderToc(doc);

  // 6 sections
  SECTION_ORDER.forEach((key, i) => {
    doc.addPage();
    renderSection(doc, {
      index: i + 1,
      title: ANALYSIS_TITLES[key],
      content: analysis[key],
    });
  });

  // Final
  doc.addPage();
  renderFinal(doc, chart.info.name);
}

export async function buildPdf(opts: BuildPdfOptions): Promise<Buffer> {
  const doc = createDoc();
  const chunks: Buffer[] = [];
  return new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    try {
      addAllPages(doc, opts.chart, opts.analysis);
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

export async function buildPdfToFile(filePath: string, opts: BuildPdfOptions): Promise<void> {
  const doc = createDoc();
  const stream = createWriteStream(filePath);
  return new Promise<void>((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
    doc.on('error', reject);
    doc.pipe(stream);
    try {
      addAllPages(doc, opts.chart, opts.analysis);
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}
