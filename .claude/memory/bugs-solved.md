# Bugs Solved — TUVIAI

> Bug đã fix + root cause. Để lần sau gặp lại không tốn thời gian debug lại.

## Format

```
**Bug:** [mô tả ngắn]
**Symptom:** [error message / behavior quan sát được]
**Root cause:** [nguyên nhân thực sự]
**Fix:** [cách fix + file liên quan]
```

---

## Entries

<!-- Entry mới thêm ở TRÊN cùng -->

<!--
Ví dụ:

**Bug:** Next.js dev server không đọc được biến môi trường
**Symptom:** `process.env.NEXT_PUBLIC_API_BASE_URL` undefined dù đã có trong `.env` root
**Root cause:** Next.js auto-load từ `apps/web/.env.local` (cwd của nó), KHÔNG đọc `.env` root như bot/api (tsx --env-file).
**Fix:** Duplicate các `NEXT_PUBLIC_*` vào `apps/web/.env.local`. Đã ghi vào CLAUDE.md section "Env loading".

---
-->
