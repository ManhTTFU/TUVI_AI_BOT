import TelegramBot from 'node-telegram-bot-api';
import type { CallbackQuery, Message } from 'node-telegram-bot-api';
import { unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { calculateChart } from '@tuvi/astrology';
import { analyzeChart } from '@tuvi/ai';
import { buildPdf } from '@tuvi/pdf';
import { CANH_GIO, validateBirthDate } from '@tuvi/core';
import type { BirthInfo } from '@tuvi/core';
import { sessions, type Session } from './session.js';
import { confirmKeyboard, genderKeyboard, timeKeyboard } from './keyboards.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token || token === 'YOUR_TELEGRAM_BOT_TOKEN') {
  console.error('TELEGRAM_BOT_TOKEN chưa được cấu hình trong .env');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

const HTML = { parse_mode: 'HTML' as const };

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function sendHtml(chatId: number, text: string, extra: Record<string, unknown> = {}) {
  return bot.sendMessage(chatId, text, { ...HTML, ...extra });
}

function summaryText(s: Session): string {
  const genderLabel = s.gender === 'male' ? 'Nam' : 'Nữ';
  const canh = s.timeIndex !== undefined ? CANH_GIO[s.timeIndex] : undefined;
  const timeLabel = canh ? `${canh.name} (${canh.range})` : '—';
  return [
    '<b>📜 Vui lòng xác nhận thông tin:</b>',
    '',
    `• <b>Họ tên:</b> ${escapeHtml(s.name ?? '')}`,
    `• <b>Giới tính:</b> ${genderLabel}`,
    `• <b>Ngày sinh (DL):</b> ${escapeHtml(s.birthDate ?? '')}`,
    `• <b>Giờ sinh:</b> ${escapeHtml(timeLabel)}`,
    `• <b>Nơi sinh:</b> ${escapeHtml(s.birthPlace ?? '')}`,
  ].join('\n');
}

bot.setMyCommands([
  { command: 'tuvi', description: 'Xem lá số Tử Vi Đẩu Số' },
  { command: 'huy', description: 'Huỷ phiên làm việc hiện tại' },
  { command: 'start', description: 'Bắt đầu' },
  { command: 'help', description: 'Hướng dẫn sử dụng' },
]);

bot.onText(/^\/start/, async (msg) => {
  sessions.reset(msg.chat.id);
  await sendHtml(
    msg.chat.id,
    [
      '🔮  <b>TỬ VI ĐẨU SỐ AI</b>',
      '',
      'Chào mừng bạn! Bot sẽ lập lá số tử vi chi tiết dựa trên ngày giờ sinh và phân tích 6 phần: tổng quan, sự nghiệp, tình duyên, sức khỏe, đại vận 10 năm, lời khuyên.',
      '',
      'Gõ  <b>/tuvi</b>  để bắt đầu.',
    ].join('\n'),
  );
});

bot.onText(/^\/help/, async (msg) => {
  await sendHtml(
    msg.chat.id,
    [
      '<b>Hướng dẫn</b>',
      '• /tuvi — bắt đầu xem lá số',
      '• /huy — huỷ phiên hiện tại',
      '• /start — về màn hình chào',
    ].join('\n'),
  );
});

bot.onText(/^\/huy/, async (msg) => {
  sessions.reset(msg.chat.id);
  await sendHtml(msg.chat.id, '✖️ Đã huỷ phiên. Gõ /tuvi để bắt đầu lại.');
});

bot.onText(/^\/tuvi/, async (msg) => {
  const chatId = msg.chat.id;
  sessions.set(chatId, { step: 'name' });
  await sendHtml(
    chatId,
    [
      '🌙  <b>Bước 1/5 — Họ và tên</b>',
      '',
      'Vui lòng gửi <b>họ tên đầy đủ</b> (có dấu) của đương số:',
      '<i>Ví dụ: Nguyễn Văn A</i>',
    ].join('\n'),
  );
});

bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;
  const chatId = msg.chat.id;
  const s = sessions.get(chatId);

  try {
    switch (s.step) {
      case 'name':
        return handleName(chatId, msg);
      case 'birthdate':
        return handleBirthdate(chatId, msg);
      case 'place':
        return handlePlace(chatId, msg);
      default:
        return;
    }
  } catch (err) {
    console.error('[bot] message error', err);
    await sendHtml(chatId, '⚠️ Có lỗi xảy ra. Gõ /tuvi để bắt đầu lại.');
    sessions.reset(chatId);
  }
});

async function handleName(chatId: number, msg: Message) {
  const name = (msg.text ?? '').trim();
  if (name.length < 2) {
    await sendHtml(chatId, '⚠️ Họ tên quá ngắn, vui lòng nhập lại.');
    return;
  }
  const s = sessions.get(chatId);
  s.name = name;
  s.step = 'gender';
  sessions.set(chatId, s);
  await sendHtml(
    chatId,
    [`🌙  <b>Bước 2/5 — Giới tính</b>`, '', 'Vui lòng chọn giới tính:'].join('\n'),
    { reply_markup: genderKeyboard },
  );
}

async function handleBirthdate(chatId: number, msg: Message) {
  const raw = (msg.text ?? '').trim();
  if (!validateBirthDate(raw)) {
    await sendHtml(chatId, '⚠️ Ngày không hợp lệ. Định dạng đúng: <b>DD/MM/YYYY</b> (vd: 15/08/1995).');
    return;
  }
  const s = sessions.get(chatId);
  s.birthDate = raw;
  s.step = 'time';
  sessions.set(chatId, s);
  await sendHtml(
    chatId,
    [`🌙  <b>Bước 4/5 — Giờ sinh</b>`, '', 'Vui lòng chọn canh giờ sinh:'].join('\n'),
    { reply_markup: timeKeyboard() },
  );
}

async function handlePlace(chatId: number, msg: Message) {
  const place = (msg.text ?? '').trim();
  if (place.length < 2) {
    await sendHtml(chatId, '⚠️ Nơi sinh quá ngắn, vui lòng nhập lại.');
    return;
  }
  const s = sessions.get(chatId);
  s.birthPlace = place;
  s.step = 'confirm';
  sessions.set(chatId, s);
  await sendHtml(chatId, summaryText(s), { reply_markup: confirmKeyboard });
}

bot.on('callback_query', async (q: CallbackQuery) => {
  const chatId = q.message?.chat.id;
  if (!chatId || !q.data) return;
  const s = sessions.get(chatId);

  try {
    if (q.data.startsWith('gender:')) {
      const g = q.data.split(':')[1] as 'male' | 'female';
      s.gender = g;
      s.step = 'birthdate';
      sessions.set(chatId, s);
      await bot.answerCallbackQuery(q.id);
      await sendHtml(
        chatId,
        [
          `🌙  <b>Bước 3/5 — Ngày sinh dương lịch</b>`,
          '',
          'Vui lòng gửi ngày sinh theo định dạng <b>DD/MM/YYYY</b>:',
          '<i>Ví dụ: 15/08/1995</i>',
        ].join('\n'),
      );
      return;
    }

    if (q.data.startsWith('time:')) {
      const idx = Number(q.data.split(':')[1]);
      if (!Number.isInteger(idx) || idx < 0 || idx > 11) {
        await bot.answerCallbackQuery(q.id, { text: 'Giờ không hợp lệ' });
        return;
      }
      s.timeIndex = idx;
      s.timeName = CANH_GIO[idx].name;
      s.step = 'place';
      sessions.set(chatId, s);
      await bot.answerCallbackQuery(q.id);
      await sendHtml(
        chatId,
        [
          `🌙  <b>Bước 5/5 — Nơi sinh</b>`,
          '',
          'Vui lòng gửi <b>nơi sinh</b> (tỉnh / thành phố):',
          '<i>Ví dụ: Hà Nội</i>',
        ].join('\n'),
      );
      return;
    }

    if (q.data === 'confirm:redo') {
      sessions.reset(chatId);
      await bot.answerCallbackQuery(q.id);
      await sendHtml(chatId, '🔄 Đã xoá phiên. Gõ /tuvi để nhập lại từ đầu.');
      return;
    }

    if (q.data === 'confirm:yes') {
      await bot.answerCallbackQuery(q.id);
      await runPipeline(chatId, s);
      return;
    }
  } catch (err) {
    console.error('[bot] callback error', err);
    await bot.answerCallbackQuery(q.id, { text: 'Đã xảy ra lỗi' });
    await sendHtml(chatId, '⚠️ Có lỗi xảy ra. Gõ /tuvi để bắt đầu lại.');
    sessions.reset(chatId);
  }
});

async function runPipeline(chatId: number, s: Session): Promise<void> {
  if (s.step === 'processing') return;
  if (
    !s.name ||
    !s.gender ||
    !s.birthDate ||
    s.timeIndex === undefined ||
    !s.birthPlace
  ) {
    await sendHtml(chatId, '⚠️ Thiếu thông tin. Gõ /tuvi để bắt đầu lại.');
    sessions.reset(chatId);
    return;
  }

  s.step = 'processing';
  sessions.set(chatId, s);

  const statusMsg = await sendHtml(
    chatId,
    '⏳  <b>Đang xử lý · 1/4</b> — Lập lá số tử vi đẩu số...',
  );
  const statusId = statusMsg.message_id;

  const updateStatus = async (html: string) => {
    try {
      await bot.editMessageText(html, {
        chat_id: chatId,
        message_id: statusId,
        parse_mode: 'HTML',
      });
    } catch {}
  };

  const info: BirthInfo = {
    name: s.name,
    gender: s.gender,
    birthDate: s.birthDate,
    timeIndex: s.timeIndex,
    timeName: CANH_GIO[s.timeIndex].name,
    birthPlace: s.birthPlace,
  };

  let pdfPath: string | null = null;
  try {
    const chart = calculateChart(info);

    await updateStatus(
      [
        '⏳  <b>Đang xử lý · 2/4</b> — Phân tích lá số bằng AI...',
        '<i>(Quá trình này có thể mất 1–2 phút)</i>',
      ].join('\n'),
    );

    const analysis = await analyzeChart(chart, {
      onProgress: async (step, total, key) => {
        await updateStatus(
          [
            `⏳  <b>Đang xử lý · 2/4</b> — Phân tích AI (${step}/${total})`,
            `<i>Đang luận: ${escapeHtml(key)}</i>`,
          ].join('\n'),
        );
      },
    });

    await updateStatus('⏳  <b>Đang xử lý · 3/4</b> — Tạo file PDF...');
    const pdfBuf = await buildPdf({ chart, analysis });
    pdfPath = join(tmpdir(), `tuvi-${chatId}-${Date.now()}.pdf`);
    await writeFile(pdfPath, pdfBuf);

    await updateStatus('⏳  <b>Đang xử lý · 4/4</b> — Gửi file về Telegram...');
    const caption = [
      '🔮  <b>LÁ SỐ TỬ VI ĐẨU SỐ</b>',
      '',
      `• <b>Họ tên:</b> ${escapeHtml(info.name)}`,
      `• <b>Giới tính:</b> ${info.gender === 'male' ? 'Nam' : 'Nữ'}`,
      `• <b>Ngày sinh:</b> ${escapeHtml(info.birthDate)}  (Giờ ${escapeHtml(info.timeName)})`,
      `• <b>Mệnh chủ:</b> ${escapeHtml(chart.soul)}  —  <b>Thân chủ:</b> ${escapeHtml(chart.body)}`,
      `• <b>Ngũ hành cục:</b> ${escapeHtml(chart.fiveElementsClass)}`,
      '',
      '<i>Tài liệu chỉ mang tính tham khảo văn hóa – tinh thần.</i>',
    ].join('\n');

    await bot.sendDocument(
      chatId,
      pdfPath,
      { caption, parse_mode: 'HTML' },
      { filename: `tu-vi-${info.name}.pdf`, contentType: 'application/pdf' },
    );

    await updateStatus('✅  Hoàn tất! File PDF đã được gửi ở tin bên dưới.');
  } catch (err) {
    console.error('[bot] pipeline error', err);
    const msg = (err as Error).message || 'Lỗi không xác định';
    await updateStatus(
      [
        '❌  <b>Đã xảy ra lỗi khi xử lý</b>',
        `<code>${escapeHtml(msg)}</code>`,
        '',
        'Vui lòng gõ /tuvi để thử lại.',
      ].join('\n'),
    );
  } finally {
    if (pdfPath) {
      try {
        await unlink(pdfPath);
      } catch {}
    }
    sessions.reset(chatId);
  }
}

bot.on('polling_error', (err) => {
  console.error('[bot] polling_error', err.message);
});

process.on('unhandledRejection', (err) => {
  console.error('[bot] unhandledRejection', err);
});

console.log('[bot] started (polling mode)');
