# Patterns đã chốt — không tranh luận lại

> Quy ước kỹ thuật đã thống nhất. Không review lại trừ khi có lý do mới.

---

## Backend (bot, api, core, astrology, ai, pdf)

**Module resolution:**
NodeNext. Imports của `.ts` files PHẢI có extension `.js` (ví dụ `export * from './types.js'`). Không "sửa" thành `.ts`.

**Env loading:**
Root `.env` cho bot + api (qua `tsx --env-file=../../.env`). Next.js đọc `apps/web/.env.local` riêng — update cả 2 nơi cho `NEXT_PUBLIC_*`.

**Package exports:**
Mọi `@tuvi/*` workspace expose source trực tiếp: `"main": "./src/index.ts"`. Không consume `dist/`.

**AI client:**
`openai` SDK chỉ dùng như HTTP client, `baseURL` override về Deepseek. Không bao giờ gọi `api.openai.com`.

---

## Frontend (web)

**Next.js version:** 14 App Router + SSR, TailwindCSS.

**transpilePackages:** Bắt buộc list mọi `@tuvi/*` package mà web import (hiện chỉ có `@tuvi/core`). Thêm package mới vào graph → thêm vào `next.config.js`.

---

## Vietnamese content

Tất cả user-facing copy (bot messages, web UI, PDF) là tiếng Việt. Code/comment vẫn dùng tiếng Anh. Label tiếng Việt đã chuẩn hóa trong `packages/core` (`PALACE_LABELS_VI`, `CANH_GIO`, `ANALYSIS_TITLES`) — không hardcode lại ở chỗ khác.

---

## Bot step numbering

2 scheme tách biệt, KHÔNG merge:
- Input phase: "Bước 1/5 … 5/5" (nhập name, gender, date, time, place)
- Processing phase: "Đang xử lý · 1/4 … 4/4" (chart → AI → PDF → send)

Số 4 ở processing độc lập với số section AI (6) — đừng đồng bộ.
