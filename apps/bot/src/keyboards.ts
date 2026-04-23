import { CANH_GIO } from '@tuvi/core';
import type { InlineKeyboardMarkup } from 'node-telegram-bot-api';

export const genderKeyboard: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      { text: '👨  Nam', callback_data: 'gender:male' },
      { text: '👩  Nữ', callback_data: 'gender:female' },
    ],
  ],
};

export function timeKeyboard(): InlineKeyboardMarkup {
  const buttons = CANH_GIO.map((g) => ({
    text: `${g.name}  ${g.range}`,
    callback_data: `time:${g.index}`,
  }));
  const rows: Array<Array<(typeof buttons)[number]>> = [];
  for (let i = 0; i < buttons.length; i += 2) {
    rows.push(buttons.slice(i, i + 2));
  }
  return { inline_keyboard: rows };
}

export const confirmKeyboard: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      { text: '✅  Xác nhận', callback_data: 'confirm:yes' },
      { text: '✏️  Nhập lại', callback_data: 'confirm:redo' },
    ],
  ],
};
