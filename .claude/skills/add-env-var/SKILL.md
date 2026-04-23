---
name: add-env-var
description: Thêm biến môi trường mới cho dự án TUVIAI. Tránh bẫy "bot/api đọc root .env, Next.js đọc apps/web/.env.local riêng".
---

# Add environment variable

## Khi dùng skill này

User muốn thêm biến môi trường mới (API key, URL, flag, v.v.). Có 2 mechanism load env khác nhau trong monorepo — dễ sai.

## Rule

**Biến backend-only** (bot hoặc api dùng, vd `DEEPSEEK_API_KEY`, `API_PORT`):
→ Chỉ cần thêm vào **root `.env`** (`D:\TUVIAI\.env`).
→ Bot/api load qua `tsx --env-file=../../.env`.

**Biến cần cho web/Next.js** (prefix `NEXT_PUBLIC_*` hoặc dùng server-side trong web):
→ Thêm vào **CẢ HAI** file:
  - `D:\TUVIAI\.env` (để consistency + backend cũng thấy nếu cần)
  - `D:\TUVIAI\apps\web\.env.local` (Next.js auto-load từ cwd của nó, KHÔNG đọc root .env)

## Quy trình

1. Xác định biến này thuộc loại nào (backend-only / web-needed).
2. Edit file tương ứng (1 hoặc 2 file).
3. Nếu code đọc qua `process.env.X`, add type declaration nếu repo có `env.d.ts` (hiện chưa có — bỏ qua).
4. Grep `process.env.<TÊN_CŨ>` nếu đang rename, update tất cả usage.
5. Restart dev server đang chạy (`--env-file` không watch .env, phải restart).

## Checklist xác nhận

- [ ] Biến có trong `.env` root?
- [ ] Nếu web cần → có trong `apps/web/.env.local`?
- [ ] Không commit `.env` thật (kiểm tra `.gitignore`).
- [ ] Document biến trong `CLAUDE.md` section "Env loading" nếu là biến required.

## Required vars hiện tại (tham khảo)

`TELEGRAM_BOT_TOKEN`, `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL` (optional), `DEEPSEEK_MODEL` (optional), `API_PORT`, `OUTPUT_DIR`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`.
