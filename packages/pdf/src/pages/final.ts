import { COLORS } from '../colors.js';
import { FONT, type Doc } from '../render.js';

export function renderFinal(doc: Doc, name: string): void {
  const { width, height } = doc.page;

  doc.save();
  doc.rect(0, 0, width, height).fill(COLORS.cream);
  doc.restore();

  // Decorative top
  doc.save();
  doc.rect(0, 0, width, 10).fill(COLORS.purple);
  doc.rect(0, 10, width, 2).fill(COLORS.gold);
  doc.restore();

  // Heart / seal
  doc.fillColor(COLORS.gold).font(FONT.bold).fontSize(32);
  doc.text('✦', 0, 140, { align: 'center', width });

  doc.fillColor(COLORS.purple).font(FONT.bold).fontSize(22);
  doc.text('Lời kết', 0, 190, { align: 'center', width });

  doc.moveTo(width / 2 - 30, 228).lineTo(width / 2 + 30, 228).lineWidth(1).strokeColor(COLORS.gold).stroke();

  // Disclaimer
  const boxLeft = 70;
  const boxWidth = width - 140;
  doc.fillColor(COLORS.text).font(FONT.italic).fontSize(11);
  const disclaimer =
    'Nội dung trong bản luận giải được soạn dựa trên lá số Tử Vi Đẩu Số và có sự hỗ trợ của trí tuệ nhân tạo. Tài liệu này mang tính tham khảo về văn hóa – tinh thần, không thay thế cho tư vấn y khoa, pháp lý hoặc tài chính chuyên nghiệp. Mọi quyết định quan trọng, mong quý đương số cân nhắc kỹ và tham vấn chuyên gia phù hợp.';
  doc.text(disclaimer, boxLeft, 260, { width: boxWidth, align: 'justify', lineGap: 4 });

  // Wishes block
  const wishY = 430;
  doc.save();
  doc.roundedRect(boxLeft, wishY, boxWidth, 140, 10).fill(COLORS.white);
  doc.lineWidth(0.8).strokeColor(COLORS.gold);
  doc.roundedRect(boxLeft, wishY, boxWidth, 140, 10).stroke();
  doc.restore();

  doc.fillColor(COLORS.purple).font(FONT.bold).fontSize(14);
  doc.text(`Kính chúc ${name || 'đương số'}:`, boxLeft + 20, wishY + 20, {
    width: boxWidth - 40,
    align: 'center',
  });

  doc.fillColor(COLORS.text).font(FONT.regular).fontSize(11);
  const wishes = [
    'Tâm an – Trí sáng – Thân khang kiện.',
    'Sự nghiệp hanh thông, tài lộc vững bền.',
    'Gia đạo thuận hòa, duyên lành tròn đầy.',
    'Phúc đức viên mãn, vạn sự cát tường.',
  ];
  wishes.forEach((line, i) => {
    doc.text(`✦  ${line}`, boxLeft + 20, wishY + 55 + i * 18, {
      width: boxWidth - 40,
      align: 'center',
    });
  });

  // Footer signature
  doc.fillColor(COLORS.textMuted).font(FONT.italic).fontSize(9);
  doc.text(
    '— Phụ tinh tại thiên, hành sự tại nhân —',
    0,
    height - 80,
    { width, align: 'center' },
  );
}
