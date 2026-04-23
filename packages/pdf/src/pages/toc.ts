import { COLORS } from '../colors.js';
import { FONT, type Doc } from '../render.js';

const ITEMS: Array<{ icon: string; title: string }> = [
  { icon: '✦', title: 'Tổng quan lá số' },
  { icon: '💼', title: 'Sự nghiệp & Tài lộc' },
  { icon: '❤', title: 'Tình duyên & Gia đạo' },
  { icon: '✚', title: 'Sức khỏe' },
  { icon: '◷', title: 'Vận hạn 10 năm (2025–2035)' },
  { icon: '★', title: 'Lời khuyên tổng hợp' },
];

export function renderToc(doc: Doc): void {
  const { width, height } = doc.page;

  // Page bg
  doc.save();
  doc.rect(0, 0, width, height).fill(COLORS.cream);
  doc.restore();

  // Title
  doc.fillColor(COLORS.purple).font(FONT.bold).fontSize(24);
  doc.text('MỤC LỤC', 0, 90, { align: 'center', width });

  // Accent underline
  doc.moveTo(width / 2 - 40, 130).lineTo(width / 2 + 40, 130).lineWidth(2).strokeColor(COLORS.gold).stroke();

  // Subtitle
  doc.fillColor(COLORS.textMuted).font(FONT.italic).fontSize(10);
  doc.text('Nội dung được luận giải theo 6 phần', 0, 150, { align: 'center', width });

  // Items
  const listTop = 210;
  const rowH = 60;
  const leftMargin = 80;
  const rowWidth = width - 160;

  ITEMS.forEach((item, i) => {
    const y = listTop + i * rowH;

    // Row bg
    doc.save();
    doc.roundedRect(leftMargin, y, rowWidth, rowH - 10, 8).fill(COLORS.white);
    doc.lineWidth(0.5).strokeColor(COLORS.goldLight);
    doc.roundedRect(leftMargin, y, rowWidth, rowH - 10, 8).stroke();
    doc.restore();

    // Number circle
    const circleX = leftMargin + 30;
    const circleY = y + (rowH - 10) / 2;
    doc.circle(circleX, circleY, 15).fill(COLORS.purple);
    doc
      .fillColor(COLORS.gold)
      .font(FONT.bold)
      .fontSize(14)
      .text(String(i + 1), circleX - 10, circleY - 8, { width: 20, align: 'center' });

    // Icon
    doc.fillColor(COLORS.gold).font(FONT.bold).fontSize(18);
    doc.text(item.icon, leftMargin + 60, y + 15, { width: 24, align: 'center' });

    // Title
    doc.fillColor(COLORS.text).font(FONT.bold).fontSize(13);
    doc.text(item.title, leftMargin + 95, y + 18, { width: rowWidth - 120 });
  });
}
