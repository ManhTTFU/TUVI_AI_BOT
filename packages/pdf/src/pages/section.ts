import { COLORS } from '../colors.js';
import { FONT, parseBlocks, renderInline, type Doc } from '../render.js';

export function renderSection(
  doc: Doc,
  opts: { index: number; title: string; content: string },
): void {
  // Add fresh page (callers ensure they start on blank page for first section).
  renderHeader(doc, opts.index, opts.title);

  // Re-render header when an automatic page break happens within this section.
  const onPageAdded = () => {
    paintPageBackground(doc);
    renderHeader(doc, opts.index, opts.title);
  };
  doc.on('pageAdded', onPageAdded);

  try {
    renderBody(doc, opts.content);
  } finally {
    doc.removeListener('pageAdded', onPageAdded);
  }
}

function paintPageBackground(doc: Doc): void {
  const { width, height } = doc.page;
  doc.save();
  doc.rect(0, 0, width, height).fill(COLORS.cream);
  doc.restore();
}

function renderHeader(doc: Doc, index: number, title: string): void {
  paintPageBackground(doc);

  const { width } = doc.page;

  // Purple header bar
  doc.save();
  doc.rect(0, 0, width, 70).fill(COLORS.purple);
  // gold bottom line
  doc.rect(0, 70, width, 3).fill(COLORS.gold);
  doc.restore();

  // Section number chip
  doc.save();
  doc.roundedRect(40, 20, 40, 30, 4).fill(COLORS.gold);
  doc.fillColor(COLORS.purple).font(FONT.bold).fontSize(16);
  doc.text(`0${index}`, 40, 27, { width: 40, align: 'center' });
  doc.restore();

  // Section title
  doc.fillColor(COLORS.white).font(FONT.bold).fontSize(16);
  doc.text(title.toUpperCase(), 95, 26, { width: width - 135 });

  // Small tag
  doc.fillColor(COLORS.goldLight).font(FONT.italic).fontSize(9);
  doc.text('Phần ' + index + ' / 6', 95, 50, { width: width - 135 });

  // Reset cursor for body
  doc.y = 95;
  doc.x = doc.page.margins.left;
}

function renderBody(doc: Doc, content: string): void {
  const blocks = parseBlocks(content);
  const { width: pageWidth, margins } = doc.page;
  const contentWidth = pageWidth - margins.left - margins.right;

  for (const block of blocks) {
    ensureSpace(doc, 40);
    if (block.type === 'heading') {
      renderHeading(doc, block.text, contentWidth);
    } else if (block.type === 'bullet') {
      renderBullet(doc, block.text, contentWidth);
    } else {
      renderParagraph(doc, block.text, contentWidth);
    }
  }
}

function ensureSpace(doc: Doc, needed: number): void {
  const limit = doc.page.height - doc.page.margins.bottom;
  if (doc.y + needed > limit) {
    doc.addPage();
  }
}

function renderHeading(doc: Doc, text: string, contentWidth: number): void {
  const x = doc.page.margins.left;
  // Add vertical breathing room before heading
  doc.y += 6;
  const y = doc.y;

  doc.font(FONT.bold).fontSize(13).fillColor(COLORS.purple);
  const measured = doc.heightOfString(text.toUpperCase(), { width: contentWidth - 16 });

  // Left purple bar
  doc.save();
  doc.rect(x, y - 2, 4, measured + 8).fill(COLORS.purple);
  doc.restore();

  doc.fillColor(COLORS.purple).font(FONT.bold).fontSize(13);
  doc.text(text.toUpperCase(), x + 14, y, { width: contentWidth - 16, align: 'left' });

  // underline
  const endY = doc.y + 2;
  doc.moveTo(x + 14, endY).lineTo(x + 14 + 40, endY).lineWidth(1).strokeColor(COLORS.gold).stroke();
  doc.y = endY + 6;
}

function renderBullet(doc: Doc, text: string, contentWidth: number): void {
  const x = doc.page.margins.left;
  const y = doc.y;

  // Measure text height
  doc.font(FONT.regular).fontSize(11);
  const plain = text.replace(/\*\*/g, '');
  const textWidth = contentWidth - 28;
  const h = doc.heightOfString(plain, { width: textWidth, align: 'left' });

  // Background
  doc.save();
  doc.roundedRect(x, y - 3, contentWidth, h + 8, 4).fill(COLORS.bullet);
  doc.restore();

  // Gold dot
  doc.circle(x + 11, y + 7, 3).fill(COLORS.gold);

  // Text
  renderInline(doc, text, {
    x: x + 22,
    y,
    width: textWidth,
    align: 'left',
    fillColor: COLORS.text,
    fontSize: 11,
  });

  doc.y = y + h + 10;
  doc.x = x;
}

function renderParagraph(doc: Doc, text: string, contentWidth: number): void {
  const x = doc.page.margins.left;
  doc.y += 2;

  renderInline(doc, text, {
    x,
    y: doc.y,
    width: contentWidth,
    align: 'justify',
    fillColor: COLORS.text,
    fontSize: 11,
  });
  doc.y += 6;
  doc.x = x;
}
