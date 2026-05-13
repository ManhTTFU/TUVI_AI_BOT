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

**Bug:** Daily horoscope 12 cung bị cắt giữa JSON do `max_tokens`
**Symptom:** `Error: Deepseek bị cắt do max_tokens (daily-horoscope)` — `finish_reason === 'length'` khi gọi Deepseek sinh JSON 12 cung × 2 câu tiếng Việt trong 1 call. Bump 2500 → 4000 vẫn cắt.
**Root cause:** Tiếng Việt sau BPE tokenize ~2-3 tokens/từ (cao hơn EN). 12 cung × 2 câu × ~30 từ × 2.5 token + JSON overhead có thể vọt lên ~2000-3000 tokens với buffer Deepseek tự thêm. Quan trọng hơn: prompt "tối đa 2 câu" không phải hard constraint — model vẫn có thể viết dài, một câu trượt là cả JSON sau đó bị cắt → unrecoverable.
**Fix:** Tách thành 2 call song song × 6 cung qua `Promise.all`. Mỗi call `max_tokens: 2500` (dư ~3x), parallel nên thời gian không tăng (~7s). File: `apps/web/src/lib/daily-horoscope-server.ts` — thêm `SIGNS_GROUP_1/2`, `callDeepseekGroup(dateStr, signs)`, orchestrator `callDeepseek` merge 2 group + validate đủ 12.

**Lesson chung — Vietnamese token math:**
- Tiếng Việt sau BPE Deepseek ≈ **2.5-3 tokens/từ** (cao hơn EN do dấu).
- Markdown overhead (`##`, `**...**`, `•`, newlines) thêm ~100-200 tokens cho output có 4 sections + 10-15 bullets.
- Công thức an toàn: `max_tokens = từ_target × 3 + 300 buffer + 100% safety margin`.
  - 500 từ markdown → cần ~3500-4000 max_tokens (không phải 1500).
  - 1000 từ markdown → cần ~6000-7000 max_tokens.
- Model THƯỜNG viết hơi quá target (prompt "500 từ" → output thực 550-650 từ).

**2 chiến lược khi đụng giới hạn:**
- **Output là narrative liền mạch** (1 reading cá nhân hóa) → KHÔNG split được, bump max_tokens với công thức trên. Case: `horoscope-personalize-server.ts` (1500 → 4000).
- **Output là JSON array N entry độc lập** (12 cung daily) → SPLIT parallel ưu việt hơn bump. Robust hơn (mỗi nhánh dễ fit), nhanh hơn (parallel), trade-off 2× API call nhưng cache 1×/ngày là không đáng kể. Case: `daily-horoscope-server.ts` (1 call 4000 → 2 call × 2500).

---

<!--
Ví dụ:

**Bug:** Next.js dev server không đọc được biến môi trường
**Symptom:** `process.env.NEXT_PUBLIC_API_BASE_URL` undefined dù đã có trong `.env` root
**Root cause:** Next.js auto-load từ `apps/web/.env.local` (cwd của nó), KHÔNG đọc `.env` root như bot/api (tsx --env-file).
**Fix:** Duplicate các `NEXT_PUBLIC_*` vào `apps/web/.env.local`. Đã ghi vào CLAUDE.md section "Env loading".

---
-->
