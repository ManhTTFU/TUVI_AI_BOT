---
name: run-dev
description: Chạy api + web local cho TUVIAI. Dùng khi user muốn start dev server, hoặc gặp vấn đề khi startup.
---

# Run dev (api + web)

## Khi dùng skill này

- User hỏi "chạy dự án như thế nào"
- User gặp lỗi startup
- Sau khi cài dep mới / đổi env, cần restart sạch

## Khuyến nghị: 2 terminal riêng

```bash
# Terminal 1
pnpm dev:api

# Terminal 2
pnpm dev:web
```

Lý do: `pnpm dev` chạy `pnpm -r --parallel run dev` sẽ **buffer + interleave log**, dễ tưởng service đã chết khi thật ra đang chờ.

## Ready signals (chờ đủ cả 2)

| Service | Tín hiệu ready |
|---|---|
| API  | `[api] listening on http://localhost:4100` |
| Web  | `✓ Ready in Xms` (Next.js) — lần đầu mất 10-30s compile |

## Pre-flight check

1. `pnpm install` đã chạy? (postinstall tự download fonts — nếu fonts thiếu, build PDF sẽ throw).
2. File `.env` root có `DEEPSEEK_API_KEY`?
3. File `apps/web/.env.local` có `NEXT_PUBLIC_*` trio?
4. Port 3100 + 4100 không bị chiếm bởi process khác? (check: `netstat -ano | findstr :4100`).

## Troubleshooting

### "Chỉ thấy API listening rồi dừng"
Không dừng — pnpm parallel buffer log, web đang khởi động im lặng. Dùng 2 terminal riêng.

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

Sau đó chạy lại 2 terminal.
