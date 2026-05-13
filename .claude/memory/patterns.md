# Patterns đã chốt — không tranh luận lại

> Quy ước kỹ thuật đã thống nhất. Không review lại trừ khi có lý do mới.

---

## Backend (bot, api, core, astrology, ai, pdf)

**Module resolution:**
NodeNext. Imports của `.ts` files PHẢI có extension `.js` (ví dụ `export * from './types.js'`). Không "sửa" thành `.ts`.

---

## Data modeling — Shared AI cache pattern (CHỐT)

Mọi feature có AI sinh output **deterministic theo input params** (cùng input → output gần như nhau) BẮT BUỘC dùng pattern 2 bảng:

| Bảng | PK | Vai trò | Scope share |
|---|---|---|---|
| `<feature>_charts` (submission) | `id` (uuid) | Per-user history row. Lưu input fields + `birthHash`. **KHÔNG chứa AI output.** | Per-user (FK `userId`) |
| `<feature>_analyses` (cache) | `birth_hash` | AI output (markdown text hoặc JSONB structured). | **Cross-user** — N user cùng combo → 1 row |

**Hash:** `sha256(input1|input2|...).slice(0,16)` (16 hex = 64 bits, collision-safe đến hàng tỷ user). Tên column convention: `birth_hash varchar(32)`.

**Indexes bắt buộc trên `<feature>_charts`:**
- `(user_id, created_at)` — composite cho `/lich-su` query `WHERE user_id=X ORDER BY created_at DESC`.
- `(birth_hash)` — single, cho JOIN tới analyses.
- `(user_id, birth_hash)` UNIQUE — idempotent insert + dedup (1 user submit cùng combo 2 lần → 1 row).

**Indexes trên `<feature>_analyses`:** không cần thêm — PK `birth_hash` đủ.

**Server flow (`getXxx(userId, input)`):**
```ts
const birthHash = computeBirthHash(input);

const [reading, chartId] = await Promise.all([
  resolveReading(input, birthHash),   // analyses cache → Deepseek + INSERT ON CONFLICT
  ensureUserChart(userId, input, birthHash), // chart row INSERT ON CONFLICT
]);

return { id: chartId, reading };
```

`resolveReading` dùng **inflight Map theo birthHash** (KHÔNG userId) → 2 user khác nhau cùng miss đồng thời chỉ gọi Deepseek 1 lần.

**Race-safety:** `INSERT ... ON CONFLICT DO NOTHING` + `SELECT` lại để lấy row id chuẩn (nếu race với instance khác).

**Hiện đang áp dụng:**
- Tu-Vi: `charts` + `analyses` + `deep_readings` (compound PK `(birthHash, year)`).
- Tu-Tru: `bat_tu_charts` + `bat_tu_analyses` (markdown TEXT).
- Hoang-Dao: `hoang_dao_charts` + `hoang_dao_analyses` (PersonalizedReading JSONB).

**Khi KHÔNG dùng pattern này:**
- AI output phụ thuộc vào dữ liệu user-specific KHÔNG nằm trong hash (vd: real-time user state) → khó share, để per-user.
- AI output cố tình varied per call (creative writing). → bỏ cache.
- Daily/temporal global cache (như `daily_horoscope`): PK theo time-bucket (date `YYYY-MM-DD`) thay vì hash — 1 row chia sẻ toàn bộ user trong cùng bucket.

**Anti-pattern đã vấp (2026-05-13, fix bằng migration 0005):**
Ban đầu `hoang_dao_charts` lưu `reading` JSONB inline + dedup theo `(userId, signEn, gender, status, goal)`. Mỗi user mới với cùng combo → gọi Deepseek lại từ đầu. Fix: split thành `hoang_dao_charts` (chỉ submission record) + `hoang_dao_analyses` (shared cache) qua `birth_hash`. Lý do nhớ: AI output deterministic theo input, không phụ thuộc user → không có lý do để per-user.

---

## Migration & schema conventions

**Tạo migration:**
```bash
cd packages/db && pnpm exec drizzle-kit generate
```
Drizzle-kit sẽ hỏi interactive khi rename column → trả lời cẩn thận. Nếu cần data-preserving migration phức tạp (vd: backfill column từ logic SHA256), tự viết SQL trong `migrations/XXXX_name.sql` + thêm entry vào `_journal.json` + copy `0XXX_snapshot.json` từ revision trước rồi patch.

**Apply migration:**
```bash
cd packages/db && pnpm migrate
```
`src/migrate.ts` chạy `drizzle-orm/postgres-js/migrator` rồi seed `prices` + `subscription_plans` (idempotent qua `ON CONFLICT DO NOTHING`).

**pgcrypto sẵn sàng:** Migration runner đã `CREATE EXTENSION IF NOT EXISTS pgcrypto` → dùng được `gen_random_uuid()` cho PK default + `digest('input', 'sha256')` cho backfill hash trong SQL.

**Tên column convention:**
- Time: `created_at`, `updated_at`, `completed_at`, `expires` (Auth.js) — `timestamp { mode: 'date' }`.
- FK: `<entity>_id` text, `.references(...)` với `onDelete: 'cascade'` cho child records của user/auth.
- Hash: `birth_hash varchar(32)` (lưu 16 hex char + buffer).
- JSON: dùng `jsonb` cho structured, `text` cho markdown thuần.

**Index naming:** `<table>_<purpose>_idx` cho non-unique, `<table>_<purpose>_uniq` cho unique. Vd: `charts_user_created_idx`, `hoang_dao_charts_user_hash_uniq`.

---

**Env loading:**
Root `.env` cho bot + api (qua `tsx --env-file=../../.env`). Next.js đọc `apps/web/.env.local` riêng — update cả 2 nơi cho `NEXT_PUBLIC_*`.

**Package exports:**
Mọi `@tuvi/*` workspace expose source trực tiếp: `"main": "./src/index.ts"`. Không consume `dist/`.

**AI client:**
`openai` SDK chỉ dùng như HTTP client, `baseURL` override về Deepseek. Không bao giờ gọi `api.openai.com`.

**Mọi call Deepseek BẮT BUỘC wrap qua `aiCall(fn, label)`:**
`aiCall` từ `@tuvi/ai` = `pLimit(64)` semaphore (default, override qua `AI_CONCURRENCY`) + `withRetry` exponential backoff cho 429/5xx/network + timing log `[ai:label] Xms`. KHÔNG dùng `client.chat.completions.create` trực tiếp — bypass semaphore + không có retry → có thể flood Deepseek + fail vì transient error.

```ts
return aiCall(async () => {
  const completion = await client.chat.completions.create({ ... });
  // ... validate
  if (finishReason === 'length') {
    const err = new Error('...') as Error & { status: number };
    err.status = 500;  // mark retryable
    throw err;
  }
  return result;
}, 'feature:label');
```

**Mark retryable errors với `status = 500`:** `finish_reason === 'length'`, schema parse fail, JSON syntax error — tất cả mark retryable vì `temperature > 0` có thể fix lần sau. KHÔNG mark retryable: auth error (401), bad request (400) — fail-fast.

**Default `AI_CONCURRENCY = 64`** — cho Deepseek paid tier (không hard cap concurrent, chỉ RPM ~5000). Free tier nên `AI_CONCURRENCY=16` để tránh 429.

**Seed deterministic cho mọi call Deepseek (BẮT BUỘC):**

Mọi `client.chat.completions.create` PHẢI có `seed` derive từ cache key (`birthHash`, `dateStr`, v.v.). Lý do: cache share-cross-user chỉ "chính danh" khi regenerate ra cùng output. Không seed = cache là "đông cứng random". Có seed = cache memoize cho deterministic computation.

Helper:
```ts
import { seedFromHash } from '@tuvi/ai';
const seed = seedFromHash(birthHash); // parseInt 7 hex đầu → int
```

Khi chia parallel multi-call cho cùng input (vd `analyzeChart` 6 sections, `analyzeDeepReadings` 4 nhánh, `analyzeNamHienTai` main+months) → mỗi nhánh dùng `seed + offset` để output không "đồng pha" wording.

Khi cache key có thêm dimension (vd `deepReadings` PK = `(birthHash, year)`) → seed phải bao gồm dimension đó (`seed = seedFromHash(birthHash) + year`).

Daily horoscope không có birthHash → seed = `sha256(dateStr|groupTag).slice(0,7)` qua `seedForDailyGroup()`.

**Lưu ý độ tin cậy:** Deepseek doc ghi `seed` là "best-effort", ~95-98% reproducible trong 1 model version. Model upgrade có thể đổi output (track qua `system_fingerprint`). Đủ cho use case content generation, KHÔNG dùng cho computation đòi hỏi 100% deterministic.

---

## Frontend (web)

**Next.js version:** 14 App Router + SSR, TailwindCSS.

**transpilePackages:** Bắt buộc list mọi `@tuvi/*` package mà web import (hiện chỉ có `@tuvi/core`). Thêm package mới vào graph → thêm vào `next.config.js`.

**Font:** Toàn bộ web dùng **SF Pro Display** (load qua `@import 'https://fonts.cdnfonts.com/css/sf-pro-display'` trong `globals.css`). Tailwind config map cả `sans` lẫn `serif` → SF Pro Display, nên các heading đang dùng `font-serif` vẫn render SF Pro (phân biệt bằng `font-weight`/`text-size` thôi, không phải bằng family). Fallback stack: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Segoe UI", system-ui, sans-serif` — máy Apple dùng SF native, Windows/Android dùng CDN woff2.

**PDF fonts KHÔNG đổi:** `@tuvi/pdf` vẫn dùng Noto Sans TTF (Regular/Bold/Italic) vì PDFKit cần TTF + Noto Sans render tốt dấu tiếng Việt trong file output. Đừng thay SF Pro vào PDF.

**Toast notification:**
Hệ thống toast custom ở `apps/web/src/components/ui/toast.tsx` (singleton emitter, không phụ thuộc package nào). Import `{ toast }` từ đó, gọi `toast.success(msg)` / `toast.error(msg)` / `toast.info(msg)`. `<Toaster />` mount sẵn trong root layout.

**Khi nào fire toast:**
- **Submit form** (POST `/api/*/submit`, topup-request, admin actions, v.v.): success → `toast.success('Đã ...')`, error → `toast.error('Thất bại: ...')`. Mục đích cho user feedback ngay khi action hoàn tất, không phải đợi hết flow.
- **Async background fetch** (AI analyze, deep readings, dữ liệu phụ load sau): success → `toast.success('... xong')`, error → `toast.error('Lỗi ...')`. Đặc biệt quan trọng với AI vì user không biết khi nào xong.
- **KHÔNG dùng `toast.info`** cho việc thông thường — nó dễ thành noise. Chỉ dùng khi có thông báo trung tính cần user biết (vd: "Bạn vừa logout do hết session").

**Toast message rule:**
Báo **kết quả thực sự**, không expose internal state. Không phân biệt cache hit / cache miss trong message — đối với user, cả 2 đều là "luận giải xong". Ví dụ: dùng `'Luận giải Tử Vi xong'` thay vì `cached ? 'Đã có sẵn...' : 'Luận giải xong'`. Backend trả `cached: true/false` cứ trả (debug + analytics), nhưng FE đừng leak ra UI text. Nguyên tắc: user không cần biết tech detail của hệ thống cache.

---

## Brand palette — single source of truth

**TUYỆT ĐỐI KHÔNG dùng tím / indigo / violet / fuchsia / plum** trên toàn site. Trước có giai đoạn "sakura dusk twilight" mượn indigo `#1a0b2e/3d1d4a/2a1040` — đã loại bỏ 2026-05-12. Mọi section mới chỉ chọn màu từ palette dưới đây.

| Token             | Hex       | Vai trò                                    |
| ----------------- | --------- | ------------------------------------------ |
| Mực tàu           | `#0f0a08` | text chính, dark gradient stop sâu nhất    |
| Mực xám           | `#4a3a30` | text phụ, subtitle, body trên cream        |
| Đồng cổ           | `#5a3a1a` | accent ấm, heading nhấn, gradient stop ấm  |
| Bronze trung gian | `#2a1c14` | dark gradient stop giữa mực tàu ↔ đồng cổ  |
| Vàng đồng         | `#c89146` | border, chip, glow, CTA gradient           |
| Vàng đồng light   | `#e9d4b6` | cream gradient stop, text trên dark bg     |
| Cream             | `#fbf3e2` | bg trang chính, card bg                    |
| Xanh núi          | `#4a6c7a` | accent mát, link, secondary heading nhấn   |
| Chu sa            | `#c8361d` | cảnh báo, badge nguy hiểm, accent nóng     |

Tailwind alias đã remap (xem `tailwind.config.ts`):
- `brand-purple` → `#5a3a1a` (đồng cổ) — alias legacy, KHÔNG dùng cho code mới.
- `brand-ink/purpleDark` → `#0f0a08`. `brand-gold` → `#c89146`. `brand-cream` → `#fbf3e2`. `brand-mountain` → `#4a6c7a`. `brand-vermilion` → `#c8361d`.

Mọi component nên dùng **hex trực tiếp** từ bảng trên (`bg-[#fbf3e2]`, `text-[#5a3a1a]`...) chứ không bịa màu mới hoặc dùng tailwind palette mặc định (purple-*, indigo-*, fuchsia-* — CẤM).

---

## Design rhythm giữa các section

**2 section liền kề: kết nối tonal, khác biệt về medium.** Không lặp ảnh (mất rhythm, pha loãng concept), nhưng cũng KHÔNG bắt buộc tương phản tone — dễ gây cảm giác "2 trang khác nhau dán vào nhau, không liên quan".

**Rule đúng khi render section mới / swap bg:**
1. **Different medium** — section trước dùng ảnh? → section này dùng gradient/solid. Trước dùng gradient? → section này có thể dùng ảnh hoặc gradient khác rõ rệt (cream solid, dark sumi, washi).
2. **Connected tonal palette** — chọn 2-3 màu từ Brand palette trên, tạo gradient warm (`#0f0a08 → #2a1c14 → #5a3a1a`) hoặc cream tonal (`#fbf3e2 → #e9d4b6`). Bg section sau phải nằm trong cùng family với section trước (cùng warm sumi, hoặc cùng cream washi).
3. **UI complementary với bg**:
   - Bg dark (mực tàu/đồng cổ) → UI vàng đồng `#c89146` + cream `#e9d4b6/fbf3e2` + xanh núi `#4a6c7a` accent.
   - Bg cream → UI đồng cổ `#5a3a1a` heading + vàng đồng `#c89146` border + xanh núi `#4a6c7a` link + chu sa `#c8361d` cảnh báo.
4. **Section identity qua role**:
   - Hero = ấn tượng → gradient sumi dark hoặc ảnh artistic, UI vàng đồng + cream.
   - Công cụ/tra cứu = không gian suy ngẫm → cream solid hoặc washi gradient (`#f5ebd9 → #ead5b3`), UI đồng cổ + vàng đồng.
   - CTA cuối = quyết liệt → solid mực tàu hoặc gradient đồng cổ→mực tàu.

**Gradient dark chuẩn (dùng thay cho dusk plum cũ):**
```
from-[#0f0a08] via-[#2a1c14] to-[#5a3a1a]
```
Glow phụ: `bg-[#c89146]/25` (vàng đồng) + `bg-[#c8361d]/20` (chu sa) blur. Sparkle radial: `#c89146` + `#e9d4b6`.

**Ví dụ hiện có (tham khảo):**
- Home Hero: ảnh `sakura-yuhi.jpg` (chỉ ảnh — KHÔNG kéo màu pink/plum của ảnh xuống UI) + UI vàng đồng + cream + đồng cổ.
- HoangDao Hero: gradient sumi dark brand chuẩn + sparkle vàng đồng + heading cream + accent vàng đồng. Grid bên dưới: cream cards trên BodyBackground (different medium).
- LunarCalendar (orphan): đã remap về sumi dark brand. Today badge gradient `#c89146 → #5a3a1a`, glow vàng đồng + chu sa.

**Anti-pattern đã vấp:**
- Hero ảnh sakura pink → LunarCalendar gradient indigo/plum để "extract dusk palette" → toàn site lệch sang tím. Fix: bỏ tím, chỉ extract WARM (đồng cổ/mực tàu/vàng đồng) — đây là brand sumi-mountain, không phải sakura twilight.
- Dùng `bg-rose-*/pink-*` UI trên bg ảnh sakura pink → UI chìm. Fix: vàng đồng + cream + đồng cổ.
- 2 section liền kề cùng 1 ảnh bg → đơn điệu. Fix: 1 ảnh + 1 gradient/solid.
- Dùng tailwind palette mặc định (`purple-600`, `fuchsia-500`, `indigo-700`) "cho nhanh" → phá unified palette. Fix: chỉ hex từ Brand palette.

**Khi có thêm section mới — checklist:**
- Section ngay trước dùng medium nào? Ảnh / gradient / solid?
- Section mới chọn 2-3 màu từ Brand palette, dùng medium khác.
- UI color complementary: bg dark → UI sáng (vàng đồng/cream); bg cream → UI đậm (đồng cổ/mực tàu).
- KIỂM TRA: không có hex tím/indigo/violet/fuchsia/plum + không có tailwind class `purple-*/indigo-*/violet-*/fuchsia-*`.
- Test: scroll toàn trang → mỗi section rõ identity nhưng vẫn "cùng 1 bộ phim sumi-mountain".

---

## Vietnamese content

Tất cả user-facing copy (bot messages, web UI, PDF) là tiếng Việt. Code/comment vẫn dùng tiếng Anh. Label tiếng Việt đã chuẩn hóa trong `packages/core` (`PALACE_LABELS_VI`, `CANH_GIO`, `ANALYSIS_TITLES`) — không hardcode lại ở chỗ khác.

---

## Bot step numbering

2 scheme tách biệt, KHÔNG merge:
- Input phase: "Bước 1/5 … 5/5" (nhập name, gender, date, time, place)
- Processing phase: "Đang xử lý · 1/4 … 4/4" (chart → AI → PDF → send)

Số 4 ở processing độc lập với số section AI (6) — đừng đồng bộ.
