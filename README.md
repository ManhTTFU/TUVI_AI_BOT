# Tử Vi Đẩu Số – Telegram Bot + API + SSR Website

Hệ thống hoàn chỉnh gồm:

- **apps/bot** — Telegram Bot (node-telegram-bot-api) hỏi thông tin người dùng, tính lá số bằng `iztro`, gọi Deepseek phân tích 6 phần, gửi PDF về Telegram.
- **apps/api** — Express + TypeScript, API dùng chung cho bot & web.
- **apps/web** — Next.js (App Router SSR) chuẩn SEO, form xem tử vi, trang kết quả `/tu-vi/[slug]`.
- **packages/core** — types & slug helper dùng chung.
- **packages/astrology** — wrapper `iztro` sinh lá số.
- **packages/ai** — Deepseek client (OpenAI compatible) + prompts.
- **packages/pdf** — PDFKit builder + font Noto Sans Tiếng Việt.

## 1. Yêu cầu

- Node.js ≥ 20
- pnpm (có sẵn với Corepack: `corepack enable`)

## 2. Cấu hình

Copy `.env.example` → `.env` và điền:

```
TELEGRAM_BOT_TOKEN=...
DEEPSEEK_API_KEY=...
```

## 3. Cài đặt

```bash
pnpm install
```

Script `postinstall` sẽ tự động tải font Noto Sans vào `./fonts`.

Nếu mạng không tải được, có thể chạy lại bất kỳ lúc nào:

```bash
pnpm download-fonts
```

## 4. Chạy dev (song song)

```bash
pnpm dev
```

Hoặc từng app:

```bash
pnpm dev:api   # http://localhost:4000
pnpm dev:web   # http://localhost:3000
pnpm dev:bot   # Telegram long-polling
```

Chạy nhanh không qua workspace:

```bash
npx tsx apps/bot/src/index.ts
npx tsx apps/api/src/index.ts
```

## 5. Endpoints

- `POST /api/tuvi/calculate` — input info → lá số
- `POST /api/tuvi/analyze`   — input chart → 6 phần phân tích
- `POST /api/tuvi/pdf`       — input info → PDF buffer
- `POST /api/tuvi/full`      — full pipeline (calculate + analyze + pdf + lưu `output/charts/[slug].json`)

## 6. Web SEO

- `/` landing — meta + JSON-LD + FAQ
- `/xem-tu-vi` — form giống bot
- `/tu-vi/[slug]` — SSR render kết quả
- `/sitemap.xml`, `/robots.txt`

## 7. Cấu trúc

```
tuvi-system/
├── apps/
│   ├── bot/
│   ├── api/
│   └── web/
├── packages/
│   ├── core/
│   ├── astrology/
│   ├── ai/
│   └── pdf/
├── fonts/
├── output/
├── scripts/
├── .env
└── package.json
```

## 8. Lưu ý

- Bot dùng `parse_mode: HTML`.
- Session lưu trong `Map` (in-memory).
- PDF được cleanup sau khi gửi xong.
- Lá số lưu tại `output/charts/<slug>.json` để website SSR render lại kết quả.
"# TUVI_AI_BOT" 
