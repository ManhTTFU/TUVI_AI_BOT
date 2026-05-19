---
name: run-dev
description: Chạy web dev local cho TUVIAI. Dùng khi user muốn start dev server, hoặc gặp vấn đề khi startup.
---

# Run dev (web only)

## Khi dùng skill này

- User hỏi "chạy dự án như thế nào"
- User gặp lỗi startup
- Sau khi cài dep mới / đổi env, cần restart sạch

## Lệnh chạy

```bash
pnpm dev:web    # hoặc pnpm dev (alias cùng script)
```

**Ghi chú:** Express API (`apps/api`) đã thành legacy, KHÔNG còn script `dev:api` ở root package.json. Frontend chỉ dùng Next.js routes dưới `/api/*` trong `apps/web`. Khi nào thực sự cần chạy Express (debug legacy endpoint) → `pnpm --filter @tuvi/api dev` trực tiếp.

## Ready signal

| Service | Tín hiệu ready |
|---|---|
| Web  | `✓ Ready in Xms` (Next.js) — lần đầu mất 5-30s compile |

## Pre-flight check

1. `pnpm install` đã chạy? (postinstall tự download fonts — nếu fonts thiếu, build PDF sẽ throw).
2. File `.env` root có `DEEPSEEK_API_KEY` + `DATABASE_URL` + `AUTH_SECRET` + Supabase block?
3. File `apps/web/.env.local` có `NEXT_PUBLIC_*` (Supabase URL + anon key)?
4. Port 3100 không bị chiếm? (check: `netstat -ano | findstr :3100`).

## Troubleshooting

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
Next.js không hot-reload env ở `.env.local`. Phải Ctrl+C rồi chạy lại.

## Clean rebuild (khi nghi ngờ state bẩn)

```bash
# Xoá build cache, GIỮ node_modules và output/
rm -rf apps/web/.next apps/web/node_modules/.cache node_modules/.cache
rm -rf packages/*/dist apps/*/dist
```

Sau đó `pnpm dev:web` lại.
