// GA4 purchase event tracker.
//
// Fire sau khi user submit chart thành công (response 200 từ submit/personalize
// route). Dùng chartId (server-generated UUID) làm transaction_id → GA4 dedup
// tự động nếu user reload page với cùng chartId.
//
// Giá hard-coded ở FE — match với `prices` table default. Nếu admin đổi giá
// runtime qua UPDATE bảng prices, GA4 sẽ track giá cũ (acceptable: GA4 dùng
// cho trend revenue, không phải accounting).
'use client';
import { sendGAEvent } from '@next/third-parties/google';

export type PurchaseService = 'tu-vi' | 'tu-tru' | 'tarot' | 'horoscope';

const PRICE_VND: Record<PurchaseService, number> = {
  'tu-vi': 40000,
  'tu-tru': 5000,
  tarot: 5000,
  horoscope: 5000,
};

const ITEM_NAME: Record<PurchaseService, string> = {
  'tu-vi': 'Luận giải Tử Vi Đẩu Số',
  'tu-tru': 'Luận giải Tứ Trụ Bát Tự',
  tarot: 'Trải bài Tarot',
  horoscope: 'Tử vi Hoàng Đạo cá nhân hoá',
};

export function trackPurchase(service: PurchaseService, transactionId: string) {
  sendGAEvent('event', 'purchase', {
    transaction_id: transactionId,
    value: PRICE_VND[service],
    currency: 'VND',
    items: [
      {
        item_id: service,
        item_name: ITEM_NAME[service],
        price: PRICE_VND[service],
        quantity: 1,
      },
    ],
  });
}
