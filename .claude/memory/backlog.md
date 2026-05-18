# Backlog — vấn đề tồn đọng + scaling todo

> Liệt kê các vấn đề ĐÃ BIẾT nhưng CHƯA FIX. Đọc khi cần ưu tiên việc kỹ thuật.
> Không phải bug đang gặp (xem `bugs-solved.md`); không phải việc trong session (xem `session-log.md`).

## Format mỗi entry

```
### [PRIORITY] Title

**Added:** YYYY-MM-DD
**Trigger to fix:** điều kiện kích hoạt việc fix (vd: "khi >100 PRO active")
**State:** mô tả tình trạng hiện tại + impact
**Why không fix ngay:** lý do để lại
**Options:** các cách fix có thể
**Recommendation:** option ưu tiên
```

Priority levels:
- **P0** — chặn business / production-breaking nếu để lâu
- **P1** — ảnh hưởng UX hoặc cost rõ rệt, fix khi rảnh
- **P2** — tech debt, fix khi refactor lớn liên quan
- **P3** — nice-to-have, không vội

---

## P0 — Chặn / production-critical

(Đã rotate `SUPABASE_SERVICE_ROLE_KEY` 2026-05-18. Key cũ `sb_secret_stwqM2G9...` đã revoke / sẽ revoke qua Supabase Dashboard. Key mới `sb_secret_yGcNsM78...` push lên cả `.env` local + Cloudflare prod secret. `WALLET_REALTIME_SECRET` gen fresh random + push prod. Còn 1 việc nhỏ: vào Supabase Dashboard → Secret keys → bấm ⋮ ở hàng `default` cũ → Delete để key cũ vô hiệu hoàn toàn.)

---

---

## P1 — Ảnh hưởng UX hoặc cost

### Tu-Vi concurrency 5 user / 41s

**Added:** 2026-05-13
**Trigger to fix:** Khi user đồng thời cache miss thường xuyên (>5 user mới/ngày) hoặc khi user complain "đợi lâu".

**State:**
- `AI_CONCURRENCY = 64` slot/instance, mỗi Tu-Vi submit tốn **11 calls** (6 analyze + 5 deep) → `floor(64/11) = 5 user` truly parallel với 5 birthHash khác nhau.
- Longest call (`twelvePalaces`, max_tokens 4000) ≈ 41s → user thứ 6+ phải đợi.
- **Cache đã hấp thụ 99% case** (cùng birthHash share-cross-user) → vấn đề chỉ xảy ra khi 5+ user lạ submit cùng giây.
- Stack bottleneck: [1] AI_CONCURRENCY (ta control) → [2] Deepseek RPM ~5000 → [3] Node event loop ~128 concurrent HTTP → [4] memory không phải vấn đề.

**Why không fix ngay:**
- Cache hit ~99% → bottleneck thực tế hiếm xảy ra.
- Production scale hiện tại (~0-100 PRO) không chạm trần.

**Options (rank theo effort/impact):**

| # | Tên | Effort | Impact | Note |
|---|---|---|---|---|
| 1 | Bump `AI_CONCURRENCY=128` | 0 (1 dòng env) | 5 → 11 user concurrent | Free upgrade, chạm trần Node event loop |
| 2 | Pre-warm cache (cron đêm sinh sẵn combo phổ biến) | low (1 script) | Cache hit 99.9% | Hợp cho hoang-dao (576 combo hữu hạn), không hợp cho tu-vi (vô hạn ngày sinh) |
| 3 | Streaming response (Deepseek `stream: true`) | medium | Perceived latency 41s → 5s | KHÔNG tăng throughput, chỉ giảm cảm giác đợi |
| 4 | Multi-instance horizontal scale | low (Vercel auto / nginx LB) | N × 5.8 user concurrent | Tốn chi phí hosting linear |
| 5 | Giảm số call/submission (combine sections) | medium | 11 → 7 calls → 9 user concurrent | KHÔNG khuyến nghị — mất progressive UI, risk max_tokens cắt |
| 6 | Queue + SSE async delivery | **cao** | Vô hạn queue depth | Cần Redis/BullMQ, code +3× phức tạp; làm khi >500 PRO active |

**Recommendation:**
- **Bây giờ:** Option 1 (`AI_CONCURRENCY=128` trong `.env`) + Option 2 (pre-warm hoang-dao).
- **Khi >100 PRO active:** Option 3 (streaming) + Option 4 (multi-instance).
- **Khi >500 PRO active hoặc gặp Vercel timeout 60s:** Option 6 (queue).

---

### AI cache thiếu `prompt_version` — invalidation không tự động

**Added:** 2026-05-13
**Trigger to fix:** Khi đổi prompt template (`SECTION_PROMPTS`, `BAT_TU_PROMPT`, v.v.) muốn user thấy reading mới.

**State:**
- `analyses`, `bat_tu_analyses`, `hoang_dao_analyses`, `deep_readings` cache theo `birthHash` (+ year).
- Đổi prompt template trong code → cache cũ vẫn được serve → user mới thấy reading theo prompt cũ.
- Workaround hiện tại: dev DELETE thủ công rows liên quan.

**Why không fix ngay:**
- Hiếm khi đổi prompt template (mỗi lần đổi là decision lớn, có thể manual cleanup).
- Thêm cột thay đổi mọi cache table.

**Options:**
1. **Thêm cột `prompt_version int` vào mọi cache table**, query thêm `WHERE prompt_version = CURRENT`. Bump constant khi đổi prompt → cache miss → tự sinh lại.
2. **Include version trong hash:** `birthHash = sha256(PROMPT_VERSION || gender || birthDate ...)`. Bump version → hash đổi → cache key đổi → tự nhiên miss.
3. **Manual DELETE script:** giữ schema đơn giản, dev viết script clean cache khi cần.

**Recommendation:** Option 2 (hash-based) khi áp dụng — clean nhất, không thêm column. Áp dụng khi có lần đầu cần thực sự bump prompt.

---

## P2 — Tech debt, fix khi refactor lớn

### `prices` table LEGACY zero reference

**Added:** 2026-05-13
**Trigger to fix:** Khi cleanup schema hoặc audit unused tables.

**State:**
- `prices` table (action enum + amount_vnd) — model per-chart cũ.
- Grep code: **0 reference** ngoài migrate seed.
- Migrate vẫn seed (idempotent) — giữ table có rows nhưng không ai đọc.

**Why không fix ngay:**
- Không hại — chỉ tốn 3 row + 1 index.
- DROP cần migration cẩn thận (rollback khó nếu sai).

**Options:**
1. DROP table + remove seed code + xoá enum `chart_action`.
2. Để nguyên, comment lại trong schema "DEPRECATED, do not query".

**Recommendation:** Option 1 trong migration sạch sẽ tiếp theo (gộp với fix khác).

---

### `hoang_dao_charts` có thể không cần lưu denormalized (sign_en, gender, status, goal)

**Added:** 2026-05-13
**Trigger to fix:** Khi normalize schema hoặc khi storage tăng.

**State:**
- Hiện `hoang_dao_charts` lưu cả 4 input + birthHash. Denormalized cho history listing (`/lich-su` không phải JOIN).
- Có thể chỉ lưu birthHash + JOIN sang `hoang_dao_analyses` để decode params từ analyses... nhưng analyses cũng không lưu params (chỉ reading).
- Nếu muốn fully normalized: thêm `hoang_dao_combos (hash PK, sign_en, gender, status, goal)` rồi `hoang_dao_charts (id, userId, comboHash)`.

**Why không fix ngay:**
- Storage saving marginal (4 small columns × N row).
- Denormalization cho history query là tradeoff hợp lý.

**Options:**
1. Để nguyên (denormalized).
2. Normalize 3 bảng (charts + combos + analyses). 3-way JOIN cho history.

**Recommendation:** Option 1 — giữ hiện tại. Chỉ normalize khi storage thực sự là vấn đề.

---

### `transactions` không có composite `(user_id, created_at)`

**Added:** 2026-05-13
**Trigger to fix:** Khi user history wallet load chậm hoặc admin listing chậm.

**State:**
- Hiện có `tx_user_idx (user_id)` + `tx_status_idx (status)`.
- Query `WHERE user_id = X ORDER BY created_at DESC LIMIT 50` phải sort sau filter.
- Charts table đã được optimize tương tự ở migration 0005.

**Why không fix ngay:**
- User thường có <50 transaction → sort nhanh.
- Khi nhiều thì mới cần.

**Options:**
1. Migration thêm `(user_id, created_at DESC)` composite. Drop `tx_user_idx` (composite cover được single-column case).

**Recommendation:** Option 1 trong migration cleanup tiếp theo.

---

## P3 — Nice-to-have

### Wrap `daily-horoscope-server.ts` với `aiCall` đã fix nhưng có thể thêm metric

**Added:** 2026-05-13
**Trigger to fix:** Khi muốn observability tốt hơn.

**State:**
- Đã wrap aiCall (session 2026-05-13).
- Log hiện tại chỉ `[ai:label] Xms` qua console.
- Không có aggregate metrics (avg latency, error rate, retry count).

**Options:**
1. Tích hợp Prometheus / OpenTelemetry exporter.
2. Log vào DB table `ai_call_logs` (label, ms, status, retry_count, created_at).
3. Dùng Vercel Analytics nếu deploy đó.

**Recommendation:** Option 2 khi có vấn đề performance cần debug; Option 1 khi production thực sự.

---

### AI output non-deterministic trong rare edge case (cache miss với seed nhưng GPU race)

**Added:** 2026-05-13
**Trigger to fix:** Khi user complain hoặc audit reading inconsistency.

**State:**
- Sau Option C apply: seed deterministic + cache. ~99% case là 100% consistent (cache hit).
- ~1% edge case (cache miss đồng thời, GPU non-det, model upgrade): ~95-98% giống.

**Why không fix ngay:**
- User không cảm nhận khác biệt 2-5% wording.
- Fix 100% deterministic cần distributed lock (Postgres advisory hoặc Redis lock).

**Options:**
1. **Advisory lock theo birthHash** khi cache miss:
   ```sql
   SELECT pg_advisory_xact_lock(hashtext(birthHash));
   ```
   Chỉ 1 connection gọi Deepseek tại 1 thời điểm cho 1 hash. Connection khác đợi → cache hit khi commit.
2. Để nguyên — chấp nhận 2-5% drift trong edge case.

**Recommendation:** Option 2 — không đáng phức tạp hoá code.

---
