import type PDFDocument from 'pdfkit';
import { COLORS } from './colors.js';

export type Doc = InstanceType<typeof PDFDocument>;

export const FONT = {
  regular: 'Regular',
  bold: 'Bold',
  italic: 'Italic',
};

export type Block =
  | { type: 'heading'; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'paragraph'; text: string };

/** Parse AI output with `##`, `•`, `**bold**` into blocks. */
export function parseBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let paragraphBuf: string[] = [];

  const flushPara = () => {
    if (paragraphBuf.length) {
      const text = paragraphBuf.join(' ').trim();
      if (text) blocks.push({ type: 'paragraph', text });
      paragraphBuf = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      continue;
    }
    if (/^#{2,6}\s+/.test(line)) {
      flushPara();
      blocks.push({ type: 'heading', text: line.replace(/^#{2,6}\s+/, '').trim() });
      continue;
    }
    if (/^[•\-*]\s+/.test(line)) {
      flushPara();
      blocks.push({ type: 'bullet', text: line.replace(/^[•\-*]\s+/, '').trim() });
      continue;
    }
    paragraphBuf.push(line);
  }
  flushPara();
  return blocks;
}

/** Render "plain **bold** plain" by splitting into segments. */
export function renderInline(
  doc: Doc,
  text: string,
  options: {
    x?: number;
    y?: number;
    width: number;
    align?: 'left' | 'right' | 'center' | 'justify';
    fillColor?: string;
    fontSize?: number;
  },
): void {
  const segments = splitBold(text);
  const { x, y, width, align = 'left', fillColor = COLORS.text, fontSize = 11 } = options;
  doc.fillColor(fillColor);
  doc.fontSize(fontSize);

  segments.forEach((seg, i) => {
    const isLast = i === segments.length - 1;
    doc.font(seg.bold ? FONT.bold : FONT.regular);
    if (i === 0 && x !== undefined && y !== undefined) {
      doc.text(seg.text, x, y, { width, align, continued: !isLast });
    } else if (i === 0 && x !== undefined) {
      doc.text(seg.text, x, doc.y, { width, align, continued: !isLast });
    } else {
      doc.text(seg.text, { width, align, continued: !isLast });
    }
  });
}

interface Seg {
  text: string;
  bold: boolean;
}

function splitBold(text: string): Seg[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((p) => p !== '');
  if (!parts.length) return [{ text, bold: false }];
  return parts.map((p) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return { text: p.slice(2, -2), bold: true };
    }
    return { text: p, bold: false };
  });
}
