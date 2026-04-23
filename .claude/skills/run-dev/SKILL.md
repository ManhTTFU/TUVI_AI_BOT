---
name: run-dev
description: Chạy bot + api + web local cho TUVIAI. Dùng khi user muốn start dev server, hoặc gặp vấn đề khi startup.
---

# Run dev (bot + api + web)

## Khi dùng skill này

- User hỏi "chạy dự án như thế nào"
- User gặp lỗi startup
- Sau khi cài dep mới / đổi env, cần restart sạch

## Khuyến nghị: 3 terminal riêng

```bash
# Terminal 1
pnpm dev:api

# Terminal 2
pnpm dev:bot

# Terminal 3
pnpm dev:web
```

Lý do: `pnpm dev` chạy `pnpm -r --parallel run dev` sẽ **buffer + interleave log**, dễ tưởng service đã chết khi thật ra đang chờ.

## Ready signals (chờ đủ cả 3)

| Service | Tín hiệu ready |
|---|---|
| API  | `[api] listening on http://localhost:4000` |
| Bot  | `[bot] started (polling mode)` |
| Web  | `✓ Ready in Xms` (Next.js) — lần đầu mất 10-30s compile |

## Pre-flight check

1. `pnpm install` đã chạy? (postinstall tự download fonts — nếu fonts thiếu, build PDF sẽ throw).
2. File `.env` root có `TELEGRAM_BOT_TOKEN` + `DEEPSEEK_API_KEY`?
3. File `apps/web/.env.local` có `NEXT_PUBLIC_*` trio?
4. Port 3000 + 4000 không bị chiếm bởi process khác? (check: `netstat -ano | findstr :4000`).

## Troubleshooting

### "Chỉ thấy API listening rồi dừng"
Không dừng — pnpm parallel buffer log, bot/web đang khởi động im lặng. Dùng 3 terminal riêng.

### Bot 409 Conflict
Có instance bot khác đang polling cùng token. Kill hết process node cũ:
```bash
taskkill //F //IM node.exe
```

### Next.js compile chậm / stuck
Xoá cache rồi chạy lại:
```bash
rm -rf apps/web/.next apps/web/node_modules/.cache
```

### Fonts missing khi build PDF
```bash
pnpm download-fonts
```

### Env thay đổi không có hiệu lực
`tsx --env-file` KHÔNG watch `.env`. Phải Ctrl+C rồi chạy lại. Next.js cũng không hot-reload env ở `.env.local`.

## Clean rebuild (khi nghi ngờ state bẩn)

```bash
# Xoá build cache, GIỮ node_modules và output/
rm -rf apps/web/.next apps/web/node_modules/.cache node_modules/.cache
rm -rf packages/*/dist apps/*/dist
```

Sau đó chạy lại 3 terminal.
