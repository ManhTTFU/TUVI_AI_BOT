# Session Log — TUVIAI

> Cuối mỗi session gõ `/log`, trả lời 3 câu, Claude ghi vào đây.
> Đầu session sau mở ra xem "hôm qua làm đến đâu".

## Template

```
### YYYY-MM-DD

**Đang làm:** [feature / bug / refactor đang xử lý]
**Đến đâu rồi:** [hoàn thành X, đang Y, chưa làm Z]
**Files đã sửa:**
- path/to/file1.ts — [thay đổi gì]
- path/to/file2.tsx — [thay đổi gì]
**Blocker:** [nếu có vấn đề chưa giải quyết]
**Việc tiếp theo:** [làm gì trong session sau]
```

---

## Entries

<!-- Entry mới thêm ở TRÊN cùng -->

### 2026-05-12 — tối

**Đang làm:** 4 mảng độc lập liên quan UX + persistence cho Tứ Trụ + homepage:
(1) Thêm DB cache cho Tứ Trụ Bát Tự (song song với Tử Vi), (2) trang chi tiết `/tu-tru/[chartId]` + lịch sử merge cả 2 loại lá số, (3) toast notification khi luận AI xong cho cả Tử Vi + Tứ Trụ, (4) wire link 8 cánh cửa Huyền Học ở home page + badge "Hệ thống đang triển khai" cho 5 cánh cửa chưa có route.

**Đến đâu rồi:**
- **Cache Tứ Trụ (song song Tử Vi)**:
  - Schema: `packages/db/src/schema.ts` thêm 2 bảng `bat_tu_charts` (per-user row, FK users, chartData JSONB, birthHash) + `bat_tu_analyses` (PK birthHash, markdown TEXT). Migration `packages/db/migrations/0002_stormy_shadow_king.sql` generated bằng `pnpm exec drizzle-kit generate` (drizzle-kit phải chạy qua `pnpm exec` trong package dir, không qua root scripts). Đã apply lên Neon prod (`[migrate] xong`).
  - Hash helper `apps/web/src/lib/bat-tu-hash.ts`: `sha256(gender|DD/MM/YYYY|hour|minute).slice(0,16)` — name + birthPlace KHÔNG vào hash (chỉ context hiển thị). Phạm vi share hẹp hơn Tử Vi vì Bát Tự phụ thuộc tới phút.
  - Submit `apps/web/src/app/api/tu-tru/submit/route.ts` rewrite: insert `bat_tu_charts` row → trả `{chartId, name, gender, chart}`. Bỏ luôn nhánh lunar→solar dead code (form chỉ submit solar).
  - Analyze `apps/web/src/app/api/tu-tru/[chartId]/analyze/route.ts` NEW: auth + PRO + load chart bằng (id, userId) → check cache `bat_tu_analyses[birthHash]` → hit trả ngay với `cached: true`, miss gọi `analyzeBatTu` + `INSERT ... ON CONFLICT DO NOTHING` (chống race). Route cũ `/api/tu-tru/analyze` (truyền chart trong body) đã xoá.

- **Detail page + lịch sử merge**:
  - Extract `apps/web/src/components/tu-tru/TuTruResultView.tsx` NEW: shared component chứa `PillarsGrid` + `DayMasterPanel` + AI fetcher (`useEffect` auto-fire khi chưa có `initialMarkdown`, gọi `/api/tu-tru/<chartId>/analyze`). Nhận prop `initialMarkdown` để SSR detail page skip fetch khi cache đã hit.
  - Server detail `apps/web/src/app/tu-tru/[chartId]/page.tsx` NEW: auth + load `bat_tu_charts` (ownership hoặc admin) + preload `bat_tu_analyses.markdown` → render `<TuTruResultView initialMarkdown={...}>`. 404 `not-found.tsx` brand cream + 2 CTA.
  - Refactor `TuTruClient.tsx`: bỏ inline result block + duplicate fetchAnalysis → render `<TuTruResultView>` sau submit. Thêm link "📜 Đã lưu vào lịch sử — xem tất cả lá số" → `/lich-su`.
  - Update `/lich-su` `apps/web/src/app/lich-su/page.tsx`: query parallel `charts` + `batTuCharts` (mỗi cái limit 100), merge thành `HistoryItem[]` sort `createdAt desc`. Type badge khác màu (Tử Vi `#5a3a1a`, Tứ Trụ `#4a6c7a`). Icon: ☯ vs 四. Link `/tu-vi/<slug>` vs `/tu-tru/<chartId>`. Header counter "X lá số (Y Tử Vi · Z Tứ Trụ)". Empty state 2 CTA.

- **Toast system**:
  - `apps/web/src/components/ui/toast.tsx` NEW: custom toast singleton emitter (không thêm dep). Module-level `items` array + `listeners` Set, `push(kind, msg, ttl=4000)` emit ra subscribers. Export `toast.success/error/info`. `<Toaster />` listens via `useEffect(listeners.add(setList))`, render fixed bottom-right, 3 màu match brand (success xanh `#3a8a5e`, error chu sa `#c8361d`, info xanh núi `#4a6c7a`), animation slide-up qua `<style jsx>` keyframe.
  - Mount: `apps/web/src/app/layout.tsx` thêm `<Toaster />` cuối tree dưới `<Footer />`.
  - Fire toast: `TuviClient.tsx` + `ChartDetailClient.tsx` `fetchAnalysis/fetchDeep` → `toast.success(cached ? 'Đã có sẵn luận giải...' : 'Luận giải xong')`, catch → `toast.error(...)`. `TuTruResultView.tsx` same pattern. Bắn cho cả 3 endpoint (`/api/tuvi/[id]/analyze`, `/api/tuvi/[id]/deep-readings`, `/api/tu-tru/[id]/analyze`).

- **8 cánh cửa Huyền Học ở home**:
  - `apps/web/src/lib/home-data.ts`: type `Service` thêm `href?` + `comingSoon?`. SERVICES: tuvi → `/xem-tu-vi`, tutru → `/tu-tru-bat-tu`, xemngay → `/ngay-tot`; 5 cánh cửa còn lại (tarot/phongthuy/xemtuong/gieoque/duyenso) đánh `comingSoon: true`.
  - `apps/web/src/components/home/HomeClient.tsx`: render Link (Next.js) nếu có `href` + `!comingSoon`, else render `<div aria-disabled>` với badge `⚙ Hệ thống đang triển khai` (vàng đồng `#c89146/15` bg + đồng đậm text). Hover effect chỉ trên Link card (`hover:-translate-y-1`), disabled card `opacity-80 cursor-not-allowed`.

**Files đã sửa:**
- `packages/db/src/schema.ts` — + `batTuCharts` + `batTuAnalyses` tables + types
- `packages/db/migrations/0002_stormy_shadow_king.sql` — NEW (drizzle-kit generated)
- `apps/web/src/lib/bat-tu-hash.ts` — NEW
- `apps/web/src/app/api/tu-tru/submit/route.ts` — rewrite (save chart row, return chartId, bỏ lunar dead branch)
- `apps/web/src/app/api/tu-tru/[chartId]/analyze/route.ts` — NEW (cache lookup → AI → insert)
- `apps/web/src/app/api/tu-tru/analyze/route.ts` — DELETED
- `apps/web/src/components/tu-tru/TuTruResultView.tsx` — NEW (shared view + AI fetcher)
- `apps/web/src/components/tu-tru/TuTruClient.tsx` — refactor dùng shared view + link lịch sử
- `apps/web/src/app/tu-tru/[chartId]/page.tsx` + `not-found.tsx` — NEW (SSR detail)
- `apps/web/src/app/lich-su/page.tsx` — merge cả 2 loại lá số
- `apps/web/src/components/ui/toast.tsx` — NEW (toast singleton + Toaster)
- `apps/web/src/app/layout.tsx` — mount `<Toaster />`
- `apps/web/src/components/tu-vi/TuviClient.tsx` + `ChartDetailClient.tsx` — fire toast success/error
- `apps/web/src/lib/home-data.ts` — Service.href/comingSoon, map 3 active + 5 coming soon
- `apps/web/src/components/home/HomeClient.tsx` — render Link/disabled card với badge

**Blocker:**
- DB migrate ban đầu bị classifier deny (production write) → user explicit cho phép → chạy lại `pnpm --filter @tuvi/db migrate` OK. Câu verify `SELECT FROM information_schema.tables` tiếp đó cũng bị deny — output `[migrate] xong` không error đã đủ confirm.
- Submit Tứ Trụ trùng input → tạo `chartId` mới mỗi lần (vì `bat_tu_charts` insert per-submit), nhưng AI markdown share theo `birthHash`. Lịch sử sẽ có 2 row trùng input (giống Tử Vi). Nếu muốn dedupe per-user, cần unique index `(userId, birthHash)` + ON CONFLICT — chưa làm.

**Việc tiếp theo:**
- E2E test bằng tài khoản PRO: submit Tứ Trụ 2 lần cùng input → verify cache hit instant + toast khác giữa lần 1 (`Luận giải xong`) và lần 2 (`Đã có sẵn...`); kiểm `/lich-su` hiện đủ cả Tử Vi + Tứ Trụ sort đúng; click "Xem chi tiết" → `/tu-tru/<chartId>` render SSR với markdown sẵn không cần fetch.
- Visual check 8 cánh cửa: 3 active link đúng route, 5 coming-soon disabled rõ ràng.
- Tarot là cánh cửa "coming soon" duy nhất có sẵn data (TAROT_DECK 22 lá Major Arcana trong `home-data.ts`) — nếu mở rộng sản phẩm, ưu tiên build trang Tarot trước.
- Carry-over từ session trước: PDF endpoint chưa test, apps/bot dir locked Windows, Casso regex 5-char bankRef, Express legacy chưa remove.

---

### 2026-05-12 — chiều

**Đang làm:** Session chiều gộp 4 mảng độc lập: (1) trang `/hoang-dao` (list + detail), (2) unify color palette toàn site loại bỏ tím + rewrite `patterns.md`, (3) trang mới `/tu-tru-bat-tu` (Bát Tự Tử Bình full pipeline: form + API + AI prompt + PRO gate + 4 trụ card + markdown analysis), (4) thêm `birthPlace` cả Tử Vi + Tứ Trụ + đồng bộ form date/giờ giữa 2 trang.

**Đến đâu rồi:**
- **Trang Hoàng Đạo `/hoang-dao`**:
  - List: `apps/web/src/components/hoang-dao/HoangDaoClient.tsx` — Hero gradient sumi dark (mực tàu→bronze→đồng cổ) + sparkle vàng đồng. Grid 12 cung cream cards với element tone (Lửa→chu sa, Đất→vàng đồng, Khí→xanh núi, Nước→slate-navy).
  - Detail: `apps/web/src/components/hoang-dao/HoangDaoDetail.tsx` + `apps/web/src/app/hoang-dao/[slug]/page.tsx` — breadcrumb → hero card centered → Hôm nay text từ `HOROSCOPE` → Tổng quan paragraph → Strengths/Weaknesses 2 cột → Meta grid (sao chiếu, ngũ hành, quality, màu may mắn, số may mắn, cung hợp) → prev/next + back CTA → 3 related cards.
  - Data: `apps/web/src/lib/zodiac-detail.ts` — 12 cung mở rộng (slug, ruler, quality, lucky, compatible, strengths/weaknesses, overview 4-6 câu) + helper `getZodiacBySlug/Neighbors/Related`.
  - 404 `apps/web/src/app/hoang-dao/[slug]/not-found.tsx` brand cream.
  - Update Header nav `Hoàng Đạo` → `/hoang-dao` (trước là `/#cung` anchor).
- **Unify palette / bỏ tím**:
  - `apps/web/tailwind.config.ts` remap: `brand.purple #6B1D5E` → đồng cổ `#5a3a1a`. `brand.purpleDark #3A0F32` → mực tàu `#0f0a08`. `brand.ink #2C1729` → mực tàu. `brand.gold #D4A843` → `#c89146`. Thêm `brand.mountain #4a6c7a` + `brand.vermilion #c8361d`. Shadow soft rgba update.
  - `apps/web/src/app/globals.css` `--brand-purple` → đồng cổ. Mọi class `.btn-primary/.prose-tuvi` (dùng `brand-purple`) tự render brand qua tailwind remap.
  - `HoangDaoClient` hero `#1a0b2e/3d1d4a/2a1040` → `#0f0a08/2a1c14/5a3a1a` (warm sumi), sparkle `#fbbf24` → `#c89146`. Element `Nước` indigo `#3d4a6b` → slate-navy `#2a3a4a`.
  - `apps/web/src/components/LunarCalendar.tsx` (orphan): dusk plum gradient → sumi brand, today badge `from-fuchsia-500 to-purple-600` → `from-[#c89146] to-[#5a3a1a]`, fuchsia dot/glow → vàng đồng/chu sa.
  - `apps/web/src/components/GoodDayFinder.tsx` (orphan): `text-[#2a1040]` (4 occurrences) → `#0f0a08`.
  - Rewrite `.claude/memory/patterns.md` "Design rhythm": thêm section "Brand palette — single source of truth" với bảng 9 token + tailwind alias. Codify gradient dark chuẩn `from-[#0f0a08] via-[#2a1c14] to-[#5a3a1a]`. Anti-pattern mới: cấm `purple-*/indigo-*/violet-*/fuchsia-*` tailwind class + hex tím. Audit clean: grep `#1a0b2e|#3d1d4a|#2a1040|purple-|violet-|indigo-|fuchsia-` → 0 match.
- **Trang Tứ Trụ Bát Tự `/tu-tru-bat-tu`** (mới hoàn toàn):
  - `apps/web/src/lib/bat-tu.ts`: `calculateBatTu({year,month,day,hour,minute,birthPlace?})` → `BatTuChart` với 4 trụ (Năm/Tháng/Ngày/Giờ) + Can + Chi + ngũ hành Can/Chi + Nhật chủ. Handle hour ≥ 23 → đẩy ngày trụ sang hôm sau (Tý mở đầu ngày Can Chi mới). `formatBatTuForAI` format context cho prompt (kèm `Nơi sinh:` nếu có).
  - `packages/ai/src/prompts.ts`: thêm `BAT_TU_SYSTEM_PROMPT` + `BAT_TU_PROMPT` 7 phần theo spec user (Tứ trụ → Bản mệnh + cường nhược + dụng/kỵ thần → Tính cách → Sự nghiệp → Tài lộc → Tình duyên & hôn nhân → Tổng kết). Giả định UTC+7, không hiệu chỉnh giờ mặt trời.
  - `packages/ai/src/analyze.ts`: thêm `analyzeBatTu(context)` → markdown 1 call, max_tokens 3500, retry khi `finish_reason=length`.
  - API: `apps/web/src/app/api/tu-tru/submit/route.ts` (auth + PRO gate + lunar→solar nếu cần + compute pillars → return chart) và `/analyze/route.ts` (auth + PRO + receive chart → AI). Cả 2 trả 402 `PRO_REQUIRED` nếu chưa PRO.
  - Page: `apps/web/src/app/tu-tru-bat-tu/page.tsx` + `apps/web/src/components/tu-tru/TuTruClient.tsx`. Form: Họ tên (1 hàng) + Nơi sinh (1 hàng) + Giới tính (1 hàng) + Ngày/Tháng/Năm + Giờ Tý/Sửu/.../Hợi (1 hàng 4 cột). PRO banner nếu 402. Result: hero → Nhật chủ panel → 4 pillar card (Can+Chi+ngũ hành Can+ngũ hành Chi+âm/dương) → AI markdown analysis qua `RenderTuviContent`.
  - Update Header nav thêm "Tứ Trụ" → `/tu-tru-bat-tu`.
- **birthPlace cho cả Tử Vi + Tứ Trụ**:
  - `TuviClient.tsx` thêm `birthPlace: string` vào FormState + initial + input "📍 Nơi sinh" right sau Họ tên. Pass vào `ApiBirthInfo.birthPlace` (trước hardcode `''`). Backend đã sẵn `parseBirthPayload` → `BirthInfo.birthPlace` → `chart.info` → `charts.chartData` JSON.
  - Tứ Trụ: `BatTuInput.birthPlace?` + `BatTuChart.birth.place?` + `/api/tu-tru/submit` parse + `formatBatTuForAI` chèn `Nơi sinh: ...` vào AI context. `TuTruClient` input "📍 Nơi sinh" sau Họ tên.
- **Đồng bộ form date Tứ Trụ với Tử Vi** (đợt cuối):
  - Bỏ field minute hoàn toàn. `FormState.hour` từ string "0-23" → number 0-11 (timeIndex canh giờ).
  - Layout 1 hàng 4 cột: Ngày | Tháng | Năm | Giờ Tý/Sửu/.../Hợi (dropdown với range "23:00 – 01:00" inline).
  - Convert tại submit: `civilHour = timeIndex * 2`, `minute: 0`. Backend tính hour chi qua `hourChiIndex` không đổi.
  - Default `hour: 6` = Ngọ (11-13h).

**Files đã sửa (chính):**
- `apps/web/src/components/hoang-dao/HoangDaoClient.tsx` — mới + revise palette.
- `apps/web/src/components/hoang-dao/HoangDaoDetail.tsx` — mới.
- `apps/web/src/app/hoang-dao/{page,[slug]/page,[slug]/not-found}.tsx` — mới.
- `apps/web/src/lib/zodiac-detail.ts` — mới.
- `apps/web/tailwind.config.ts` + `apps/web/src/app/globals.css` — palette remap.
- `apps/web/src/components/LunarCalendar.tsx` + `GoodDayFinder.tsx` (orphan) — neutralize purple.
- `.claude/memory/patterns.md` — rewrite design-rhythm + thêm Brand palette section.
- `apps/web/src/lib/bat-tu.ts` — mới (pillars calc).
- `packages/ai/src/prompts.ts` — thêm BAT_TU_SYSTEM + BAT_TU_PROMPT.
- `packages/ai/src/analyze.ts` — thêm `analyzeBatTu`.
- `apps/web/src/app/api/tu-tru/{submit,analyze}/route.ts` — mới.
- `apps/web/src/app/tu-tru-bat-tu/page.tsx` + `apps/web/src/components/tu-tru/TuTruClient.tsx` — mới.
- `apps/web/src/components/layout/Header.tsx` — nav order + thêm "Tứ Trụ".
- `apps/web/src/components/tu-vi/TuviClient.tsx` — thêm input Nơi sinh.

**Blocker (cả 2 mảng đều chưa close):**
- **Chưa E2E test Tứ Trụ với PRO account thật**:
  - Submit → 4 trụ render đúng? Đặc biệt boundary giờ Tý (timeIndex 0 → civilHour 0 → không đẩy ngày).
  - AI analyze 7 phần có ra đủ format `## ** •` markdown? Có gọi tên Can Chi cụ thể không hay luận chung chung?
  - Timing tổng /submit + /analyze trong 60s? Max_tokens 3500 đủ chưa truncate?
  - PRO banner / 402 flow đã verify endpoint trả 401 unauth, nhưng chưa test 402 PRO_REQUIRED với non-PRO user.
- **Chưa kiểm UI `/hoang-dao` + `/hoang-dao/[slug]` trên browser**:
  - Chỉ verify route 200 + compile clean qua curl + dev log.
  - Chưa scroll thực tế xem: tone Lửa/Đất/Khí/Nước có distinguishable không? Element symbol gradient có readable không? Breadcrumb mobile có wrap đẹp?
- Carry-over: PDF endpoint `/api/tuvi/[chartId]/pdf` chưa test thật. Apps/bot dir rỗng vẫn lock Windows. Casso regex 5-char bankRef. Express legacy chưa xoá.

**Việc tiếp theo:** (user chưa chốt — sẽ quyết đầu session sau)

---

### 2026-05-12

**Đang làm:** Session dài, gộp nhiều giai đoạn: (1) Kill dev server treo từ hôm qua (PID 2644 chạy 24h, ăn 614MB RAM + 37k CPU sec) + tạo skill `stop-dev`. (2) Admin tools — fix bug `/admin/transactions` không hiện nút Duyệt/Từ chối, thêm "Hủy gói PRO" trong `/admin/users` (có self-guard), nội dung CK auto-fill = bankRef + email. (3) Rút bankRef xuống 5 chars (`makeBankRef()` bỏ prefix, output dạng `IS0JR`). (4) Chart detail page = giống `/xem-tu-vi` result + nút Tải PDF — tạo `ChartDetailClient`, viết lại `/tu-vi/[slug]/page.tsx` đọc DB, endpoint mới `/api/tuvi/[chartId]/pdf` dùng `@tuvi/pdf`. (5) Bỏ duplicate "Toàn Bộ Đại Hạn" ở tab Tổng Quan. (6) **AI optimize 6 section: 71s → 30s** — max_tokens cap mỗi loại call, pLimit 8→16, retry backoff 8s→3s, log timing per call, split `namHienTai` thành 2 prompt parallel (main + months). (7) Fix bug "Unexpected end of JSON input" + truncate `twelvePalaces` + invalid JSON `namHienTaiMain`. (8) Thêm aspect **Gia đạo** vào năm hiện tại với context cụ thể từng cung (Phụ Mẫu / Phu Thê / Tử Tức / Huynh Đệ), nâng 4 aspect cũ từ 3-5 → 5-7 câu.

**Đến đâu rồi:**
- **Dev server**: kill PID 2644 + start lại sạch, Next ready 5.7s. Skill `/stop-dev` đã tạo (`.claude/skills/stop-dev/SKILL.md`) — gõ `/stop-dev` khi muốn kill cuối buổi.
- **Admin transactions fix**: `TxClient.tsx:157` filter từ `r.type === 'topup'` → `(r.type === 'topup' || r.type === 'subscription')`. Approve endpoint đã hỗ trợ cả 2 type sẵn, chỉ FE filter sai từ refactor subscription.
- **Hủy PRO**: endpoint `POST /api/admin/users/revoke-pro` — set `proUntil = null` + log tx `admin_extend` với metadata `{action: 'revoke', previousProUntil}` (reuse type vì enum không có `admin_revoke`) + publish SSE `subscription` tier=NORMAL. UsersClient có nút "Hủy PRO" cạnh "Tặng gói", chỉ render khi `isProActive(u.proUntil) && u.id !== meId`. 400 server-side guard.
- **Nội dung CK**: `WalletClient.tsx` thêm prop `userEmail`, helper `ckContent(ref) = "<bankRef> <email>"`, áp dụng cả Row + đoạn `<code>` cảnh báo.
- **bankRef 5 chars**: `makeBankRef()` giờ trả 5 char alphanumeric uppercase (2 char ts + 3 char rand), bỏ prefix. 60M tổ hợp đủ thưa, unique constraint DB bắt collision. Casso regex `[A-Z]{2,6}[A-Z0-9]{4,12}` không match được 5-char ref → khi enable Casso phải đổi regex (Casso đang OFF).
- **Chart detail page**: tách `VietnameseCenter` thành component dùng chung; `ChartDetailClient` render heading + BasicInfo + Iztrolabe + VietnameseCenter + DeepReadings + nút "Tải PDF" (disable đến khi analysis xong). `/tu-vi/[slug]/page.tsx` viết lại — server component đọc chart + analyses + deepReadings từ DB, auth-gate (owner hoặc admin), pass xuống ChartDetailClient. `not-found.tsx` brand mới cream/xanh núi/vàng đồng. `/api/tuvi/[chartId]/pdf` GET dùng `buildPdf()` từ `@tuvi/pdf`, stream Blob về FE, `Content-Disposition: attachment` filename theo tên + ngày sinh. Thêm `@tuvi/pdf` vào `apps/web/package.json` + `next.config.js transpilePackages`.
- **Bỏ duplicate Đại Hạn**: `DeepReadings.tsx:1526-1531` xóa `<DaiHan10>` trong tab Tổng Quan, giữ ở section "Đại Hạn & Tiểu Hạn" bên dưới.
- **AI optimize**: `callOneSection` cap `max_tokens: 1500`. `callJsonSection` cap per label — daiHan 3000, tieuHan 1800, twelvePalaces 4000, namHienTaiMain 3500, namHienTaiMonths 1500. `limit.ts` pLimit default 8→16, withRetry retries 4→3 + maxMs 8000→3000. `aiCall` log `[ai:label] Nms` mỗi call (success + fail). Prompts: tất cả "Ít nhất 3 tiêu đề" → "3 tiêu đề" (fix, không flex), thêm `${LENGTH_HINT}` = "Độ dài: 600-900 từ. Súc tích, không lặp ý."
- **Split namHienTai**: 2 prompt mới `NAM_HIEN_TAI_MAIN_PROMPT` (category + overview + 5 aspects + advice) và `NAM_HIEN_TAI_MONTHS_PROMPT` (chỉ 12 tháng). `analyzeNamHienTai` `Promise.all([main, months])` rồi merge. Giữ alias `NAM_HIEN_TAI_JSON_PROMPT = NAM_HIEN_TAI_MAIN_PROMPT` cho backward compat.
- **Fix JSON crash**:
  - 2 route `/analyze` + `/deep-readings` wrap try/catch quanh `analyzeChart`/`analyzeDeepReadings` → trả `502 {ok: false, error}` thay vì 500 + body rỗng. FE `res.json()` không crash nữa.
  - `twelvePalaces` truncate ở position 5761 vì cap 2500 không đủ → raise 4000 + giảm prompt "5-7 câu" → "4-5 câu mỗi cung".
  - `namHienTaiMain` invalid JSON ở position 2483 vì prompt yêu cầu wrap tục ngữ trong `"..."` (escaped quote literal) → đổi sang "viết liền câu khuyên, KHÔNG bọc dấu nháy kép". Cap raise 2000 → 2500 → 3500 (sau khi thêm Gia đạo).
  - `callJsonSection` giờ detect `completion.choices[0].finish_reason === 'length'` → throw error có `.status = 500` để withRetry tự retry. JSON parse error cũng đánh dấu retryable.
- **Gia đạo**:
  - `packages/core/src/types.ts`: thêm `family: NamHienTaiAspect` vào `NamHienTaiReading.aspects`; đổi yêu cầu text "3-5 câu" → "5-7 câu".
  - `analyze.ts buildNamHienTaiContext`: thêm 4 dòng cung gia đạo (Phụ Mẫu / Phu Thê / Tử Nữ-Tử Tức / Huynh Đệ) với sao chính + phụ.
  - `analyzeNamHienTai`: merge `family` aspect với fallback rating + text.
  - `NAM_HIEN_TAI_MAIN_PROMPT`: 4 aspect cũ 3-5 → 5-7 câu với dẫn dắt cụ thể (chia quý Q1-Q4, mức rủi ro, tháng nào nên khám sức khoẻ). Aspect `family` yêu cầu nói TỪNG NHÓM: cha mẹ (Phụ Mẫu), vợ/chồng (Phu Thê — có sinh con không), con cái (Tử Tức), anh chị em (Huynh Đệ).
  - `DeepReadings NamHienTaiDetail`: aspects array thêm card thứ 5 🏠 "Gia đạo" với fallback default.

**Files đã sửa (chính):**
- `.claude/skills/stop-dev/SKILL.md` — mới.
- `apps/web/src/app/admin/transactions/TxClient.tsx` — filter fix.
- `apps/web/src/app/admin/users/UsersClient.tsx` — nút Hủy PRO + self-guard.
- `apps/web/src/app/api/admin/users/revoke-pro/route.ts` — mới.
- `apps/web/src/app/vi-cua-toi/page.tsx` + `WalletClient.tsx` — userEmail prop + nội dung CK = bankRef+email.
- `apps/web/src/lib/money.ts` — `makeBankRef` 5 chars.
- `apps/web/src/app/api/wallet/topup-request/route.ts` — bỏ query refPrefix.
- `apps/web/src/components/tu-vi/VietnameseCenter.tsx` — mới, tách từ TuviClient.
- `apps/web/src/components/tu-vi/ChartDetailClient.tsx` — mới.
- `apps/web/src/components/tu-vi/TuviClient.tsx` — import VietnameseCenter shared.
- `apps/web/src/components/tu-vi/DeepReadings.tsx` — bỏ DaiHan10 ở tab Tổng Quan, thêm aspect Gia đạo.
- `apps/web/src/app/tu-vi/[slug]/page.tsx` — viết lại đọc DB + auth-gate.
- `apps/web/src/app/tu-vi/[slug]/not-found.tsx` — brand mới.
- `apps/web/src/app/api/tuvi/[chartId]/pdf/route.ts` — mới, build PDF stream.
- `apps/web/src/app/api/tuvi/[chartId]/analyze/route.ts` + `/deep-readings/route.ts` — wrap try/catch trả 502 JSON.
- `apps/web/package.json` + `next.config.js` — thêm `@tuvi/pdf`.
- `packages/ai/src/limit.ts` — pLimit 16, retry budget giảm, log timing.
- `packages/ai/src/analyze.ts` — split namHienTai 2 call, family fallback, JSON_MAX_TOKENS table, finish_reason='length' detect, context thêm cung gia đạo.
- `packages/ai/src/prompts.ts` — split namHienTai prompt + đổi cố định 3 tiêu đề + length hints + thêm family aspect.
- `packages/core/src/types.ts` — family aspect, "5-7 câu".

**Timing đo được (test trước fix Gia đạo):**
- `/analyze`: **29.4s** 🎯 đạt target 30s. Max section `love 22.5s`.
- `/deep-readings`: failed 500 vì JSON bugs (twelvePalaces truncate, namHienTaiMain invalid). Pre-fail: `daiHan 27.4s, tieuHan 16.4s, namHienTaiMain 13.9s, namHienTaiMonths 9.7s, twelvePalaces ~30s`. Sau fix expect ~30s.

**Blocker:**
- **Chưa E2E test lá số mới** sau khi thêm Gia đạo + raise caps + fix JSON bugs. Cần verify:
  - Aspect `family` ra đầy đủ data, đề cập đúng từng nhóm thành viên (cha mẹ / vợ chồng / con / anh em).
  - JSON không còn truncate (twelvePalaces, namHienTaiMain).
  - Timing tổng vẫn ~30s sau khi thêm aspect thứ 5 + chi tiết 5-7 câu (namHienTaiMain expect ~25-28s, vẫn dưới max của daiHan/twelvePalaces).
- **Apps/bot dir rỗng** vẫn lock Windows (carry over từ 2026-05-11).
- **PDF chưa test thật** — endpoint mới `/api/tuvi/[chartId]/pdf` chưa verify với chart có cache analysis. Có thể fonts NotoSans path không resolve đúng trong Next.js cwd.
- **Express legacy** `/api/tuvi/*` vẫn ở port 4100, cần xoá khi deploy.
- **Casso regex** `[A-Z]{2,6}[A-Z0-9]{4,12}` không match 5-char ref → khi enable Casso phải đổi (chưa critical vì Casso đang OFF).
- **`/tu-vi/[slug]` SEO**: trang giờ `robots: noindex` (cá nhân, auth-gate). Trước có canonical + og:title cho share — đã bỏ. Nếu muốn share lá số public cần thêm cờ public riêng.

**Việc tiếp theo:** (user tự quyết)

---

### 2026-05-11

**Đang làm:** Session rất dài (gần 8 tiếng), gộp 4 giai đoạn lớn: (1) Polish AI/UI tử vi — gộp Diễn Cầm Luận Giải vào tab Tổng Quan, thêm prompt năm hiện tại cá nhân hóa + tục ngữ VN, replace chart vẽ tay bằng `react-iztro` + CSS overrides theme brand. (2) Performance — parallel hoá AI calls + p-limit semaphore + retry exponential backoff + cache theo birth-hash trên đĩa, tổng thời gian từ ~50s xuống ~12s. (3) **Loại bỏ Telegram bot** + dọn dẹp. (4) **Database + Auth + Payment foundation** (cực lớn) — Neon Postgres + Drizzle ORM (12 bảng), Auth.js v5 với Google + Facebook OAuth + Email magic link, hệ thống ví/topup/admin với SSE realtime, sau đó **refactor sang subscription PRO/NORMAL** (4 gói: 20k/tháng, 50k/nửa năm, 100k/năm, 500k/trọn đời) thay model per-chart cũ.

**Đến đâu rồi:**
- Xong AI personalization năm hiện tại: prompt JSON-mode `NAM_HIEN_TAI_JSON_PROMPT` với 5 yếu tố cá nhân (năm Can Chi vs năm sinh / cung tiểu hạn / đại hạn đang chạy / Mệnh+chủ / nạp âm + ngũ hành cục). Schema: category + overview + 4 aspects + 12 tháng + 3-5 lời khuyên (KÈM tục ngữ VN có thật trong ngoặc kép, không bịa câu mới).
- Xong react-iztro: install package, dynamic import (ssr:false), bỏ `LaSo/PalaceCell/CenterCard/CELL_POS` (~140 dòng), thay bằng `<Iztrolabe>` + overlay center tiếng Việt riêng (vì center palace của react-iztro hardcode tiếng Trung 五行局/四柱/...). CSS overrides ở `iztrolabe-overrides.css`: map vars iztro → palette brand (mực tàu/xanh núi/chu sa/vàng đồng), ẩn center palace gốc, bỏ hover focus đổi màu card, text xám → đen (`--iztro-color-text:#0f0a08`).
- Xong parallel AI: `Promise.all` 6 section + 4 deep, `pLimit(8)` semaphore (override qua env `AI_CONCURRENCY`), `withRetry` 4 lần exponential backoff 600ms→8s + jitter cho 429/5xx + network. Cache đĩa trong `output/cache/<hash>.{analysis,deep}.json` theo hash `sha256(gender|birthDate|timeIndex).slice(0,16)`.
- Xong remove bot: kill background process, xoá `apps/bot/{src,package.json,tsconfig.json}` (dir rỗng Windows lock chưa xoá được), gỡ scripts `dev:bot/start:bot` khỏi root package.json, update CLAUDE.md + skill `run-dev` (3 terminal → 2 terminal), gỡ 112 npm package liên quan bot.
- Xong DB + Auth foundation: package `@tuvi/db` mới (Drizzle + postgres-js), schema 12 bảng (Auth.js core: users/accounts/sessions/verificationTokens; domain: charts/analyses/deepReadings; payment: transactions/bankConfig/prices; subscription mới: subscriptionPlans/subscriptionPurchases). Migration 0000 + 0001 đã apply lên Neon (ap-southeast-1 Singapore). Auth.js v5 với Drizzle adapter, session strategy `database`, callback inject `role`/`balanceVnd`/`proUntil`/`tier` mỗi request. Google OAuth + Facebook OAuth + Email magic link tự bật/tắt theo env.
- Xong UI ví + admin: `/dang-nhap` (Google + Facebook buttons), `/vi-cua-toi` (picker 4 gói + QR + bank ref + history), `/lich-su` (chart history user), `/admin/users` (list + toggle role + tặng gói modal), `/admin/transactions` (duyệt/từ chối topup), `/admin/bank-config` (form bank + upload QR). UserMenu trong Header show tier `PRO·{days}d` hoặc `NORMAL`.
- Xong charge logic: `/api/tuvi/submit` check `isProActive(proUntil)` thay vì trừ balance, trả 402 `PRO_REQUIRED` nếu chưa PRO. Gói cộng dồn (`max(now, current) + duration`), lifetime ghi đè `pro_until = 9999-12-31`.
- Xong SSE realtime: `/api/wallet/stream` (in-process pub/sub `lib/sse-bus.ts`, heartbeat 25s), publish event `subscription`/`balance`/`topup-completed` từ approve/credit/extend endpoints. UserMenu + WalletClient subscribe singleton EventSource. Thêm `<SessionProvider refetchInterval={60} refetchOnWindowFocus>` làm safety net khi SSE drop.
- Xong Casso adapter (off): `lib/casso.ts` reconcile transactions theo bankRef trong description, `/api/casso/webhook` check `Secure-Token` header, gated bởi `CASSO_ENABLED=true`.
- Xong legal pages: `/chinh-sach-bao-mat` + `/xoa-du-lieu` chuẩn bị cho Facebook Live mode khi deploy production.
- Fix nhiều bug: (a) MissingCSRF khi gọi `signIn()` từ server action → đổi sang client-side `signIn` từ `next-auth/react`. (b) Google OAuth Client ID bị cắt cụt trong .env (39 chars thay vì 72), user paste thiếu `.apps.googleusercontent.com`. (c) Facebook "Invalid Scopes: email" warning → thêm explicit `authorization.params.scope = 'public_profile,email'`. (d) Next.js không load root `.env` → thêm `dotenv.config({path: '../../.env'})` ở `next.config.js`. (e) `useSession()` cache → gọi `update()` trong SSE callback.

**Files đã sửa (chính, không liệt kê hết — ~80 file):**
- `packages/db/{schema.ts,client.ts,migrate.ts,promote-admin.ts,drizzle.config.ts}` — package mới.
- `packages/db/migrations/0000_mushy_silver_centurion.sql` + `0001_outgoing_toxin.sql`.
- `packages/ai/src/{limit.ts mới, analyze.ts parallel, prompts.ts thêm NAM_HIEN_TAI_JSON_PROMPT}`.
- `packages/core/src/types.ts` — thêm `NamHienTaiReading`, `NamCategory`, `MonthLabel`, `NamHienTaiAspect`, mở rộng `DeepReadingsData.namHienTai`.
- `apps/web/src/auth.ts` — Auth.js v5 config + 3 provider conditional + callback inject session.
- `apps/web/src/lib/{birth.ts mới, tier.ts mới, money.ts mới, sse-bus.ts mới, casso.ts mới, api.ts đọc từ DB}`.
- `apps/web/src/app/api/{auth/[...nextauth], wallet/*, admin/*, tuvi/submit, tuvi/[chartId]/{analyze,deep-readings}, casso/webhook}` — tất cả endpoints mới.
- `apps/web/src/app/{dang-nhap, vi-cua-toi, lich-su, admin/{users,transactions,bank-config}, chinh-sach-bao-mat, xoa-du-lieu}/*` — UI pages mới.
- `apps/web/src/components/{layout/{UserMenu mới, Header thêm mobile menu auth}, providers/AuthProvider mới, tu-vi/{TuviClient refactor + VietnameseCenter overlay, DeepReadings move AnalysisCards vào tab + advice with tục ngữ}}`.
- `apps/web/src/styles/iztrolabe-overrides.css` — mới.
- `apps/web/next.config.js` — thêm `dotenv.config` + `transpilePackages` mở rộng.
- `apps/api/src/{routes/tuvi.ts, store.ts}` — thêm cache file, legacy không dùng nữa từ FE.
- `CLAUDE.md` — viết lại API surface (Next.js là chính, Express legacy), thêm section Auth+Payment architecture.
- `.env.example` — thêm khối Database, Auth, Google, Facebook, Email, Casso.

**Blocker:**
- **Test E2E chưa làm**: lập lá số PRO → AI analyze + deep, cache hit lần 2, share giữa user cùng ngày sinh, đều chưa verify với form thật.
- **Realtime navbar update**: vẫn có thể chưa fire trong vài case edge (HMR dev mode reset sse-bus listener Map). Đã có 3 safety net (SSE + refetchInterval 60s + window focus) nhưng chưa stress test.
- **Facebook Live mode**: yêu cầu 4 thứ (icon 1024px, privacy URL public, data deletion URL public, category) → phải deploy production trước. 2 legal page đã có sẵn, chờ deploy. Dev mode chỉ login được account owner + test users.
- **Apps/bot dir rỗng**: Windows giữ file handle, `rmdir` báo busy. Phải restart máy hoặc đóng IDE nắm folder đó. Không ảnh hưởng vì pnpm-workspace.yaml `apps/*` không match dir rỗng.
- **Bot Google Cloud account user**: bị close (đã đăng nhập lại bằng account khác `tuanmanh97x@gmail.com`).
- **Express API legacy**: `/api/tuvi/*` cũ vẫn còn ở port 4100 nhưng FE không dùng nữa. Cần dọn khi deploy production để giảm attack surface.
- **PDF generation**: route `/api/tuvi/pdf` ở Express vẫn tham chiếu filesystem cũ, không sync với DB. `/tu-vi/[slug]` page link tới `${API_BASE_URL}/api/tuvi/pdf/${slug}` → sẽ 404 cho chart mới lập từ Next.js flow.
- **/tu-vi/[slug] page**: dùng thiết kế cũ (purple/gold brand-old), không sync với rebrand Diễn Cầm. Cần redesign hoặc redirect.

**Việc tiếp theo:**
- Test E2E full flow: đăng nhập (Google/Facebook) → /vi-cua-toi mua "Gói Tháng 20k" → admin duyệt → navbar realtime PRO → /xem-tu-vi lập lá số thật → verify AI 6 section + 4 deep readings + advice tục ngữ + lá số render Iztrolabe + center tiếng Việt + balance trừ đúng (subscription model: KHÔNG trừ tiền, chỉ check tier).
- Update `/tu-vi/[slug]` page sang brand mới (Diễn Cầm cream/xanh núi/vàng đồng), bỏ link Telegram/PDF tạm thời cho đến khi wire lại PDF qua Next.js.
- Wire PDF generation lại: hoặc move `@tuvi/pdf` vào Next.js route, hoặc dispatch background job. PDF lưu Cloudflare R2 hoặc Vercel Blob khi deploy.
- Deploy production stack: Vercel (Next.js) + Neon (đã có) + custom domain + Cloudflare R2 (PDF/QR) + Sentry (error tracking). Cần `.env.production` riêng với `NEXTAUTH_URL=https://domain.com`, Google OAuth thêm redirect production, Facebook thêm production URL.
- Sau khi deploy: upload Facebook app icon 1024×1024, điền 2 URL legal vào Basic Settings, switch Live mode → user thật login được.
- Optional: gửi `tier` field trong SSE event để UserMenu chip update không phải round-trip qua `update()`.
- Cleanup: xoá `apps/api` legacy (sau khi PDF migration xong), gỡ `prices` table (deprecated), drop bảng `analyses`/`deep_readings` filesystem cache code trong store.ts.

---

### 2026-05-08

**Đang làm:** (1) Rebuild toàn bộ UI "Diễn Cầm Tam Thế" từ source HTML/JSX user gửi qua từng turn — home (ZodiacRing, LucDieu, Horoscope, Articles), ngay-tot (Calendar + DeepReading + FindDay), xem-tu-vi (form + lá số 4×4 + AI), Header/Footer reusable. (2) Wire form xem-tu-vi sang API thật (iztro `/calculate` + 6-section AI `/analyze`) — bỏ `buildLaSo` demo random. (3) Endpoint mới `/api/tuvi/deep-readings` JSON-mode Deepseek cho 12 đại hạn / 6 năm tiểu hạn / 12 cung — wire vào DeepReadings component. (4) Auto-trigger toàn bộ AI khi submit form (không còn nút "Xin luận giải" riêng).

**Đến đâu rồi:**
- Xong UI rebuild: Header/Footer dùng cho mọi route qua root layout, BodyBackground qua `next/image` + `src/assets/` (user tự swap `bg-sumi-mountain.jpg`), HomeClient + NgayTotClient + TuviClient với hydration-safe state (defer `new Date()` qua useEffect). Cormorant Garamond import vào globals.css.
- Xong palette migration toàn site qua sed 1 phát: mực tàu `#0f0a08`, mực xám `#4a3a30`, xanh núi `#4a6c7a` (accent chính, thay đồng cổ `#6e4520`), chu sa `#c8361d` (badge cảnh báo), vàng đồng `#c89146` (border), giữ đồng cổ làm gradient stop button.
- Xong wire API thật: form validate name/year/month/day, lunar→solar brute-force qua `solarToLunar` từ `@tuvi/lichvannien`, gender map `nam→male`, mệnh palette match iztro field names (`Tử Nữ` ≠ `Tử Tức`).
- Xong DeepReadings TSX: 8 sub-component (BasicInfo, TongQuanLaSo, CareerWealth, LoveFamily, Health, DaiHan10, TieuHanNam, CungAccordion, NamHienTaiDetail, Advice, ReadingCard, StarsRow). Tab "Tổng Quan" / "Năm Hiện Tại". DaiHan10 dùng `palace.decadal.range` thật từ iztro; TieuHanNam dùng `palace.ages.includes(age)` (chuẩn tiểu hạn truyền thống).
- Xong AI deep-readings: 3 prompt JSON-mode (`DAI_HAN_JSON_PROMPT`, `TIEU_HAN_JSON_PROMPT`, `TWELVE_PALACES_JSON_PROMPT`) trả `{ periods }`, `{ years }`, `{ palaces }`. Server merge với meta tự build (fallback nếu AI lệch tên cung). Tuần tự ~30-60s.
- Xong auto-trigger UX: `generate()` await `/calculate` (~vài trăm ms) → `setChart` ngay → fire-and-forget `/analyze` + `/deep-readings` parallel. User thấy lá số ngay, AI sections show loader rồi swap khi xong. Bỏ 2 button "Xin luận giải".
- Default port `lib/env.ts` 4000→4100, 3000→3100 khớp setup chạy thật.
- TuviForm cũ (gọi /full) orphan, không xoá — giữ làm reference khi muốn wire PDF.

**Files đã sửa:**
- `apps/web/src/components/home/HomeClient.tsx` — mới, full home Diễn Cầm.
- `apps/web/src/components/ngay-tot/NgayTotClient.tsx` — mới, lịch vạn niên + find day + deep reading (window.claude fallback).
- `apps/web/src/components/tu-vi/TuviClient.tsx` — mới, form + lá số 4×4 + AnalysisCards + auto-trigger AI parallel.
- `apps/web/src/components/tu-vi/DeepReadings.tsx` — mới, 8 sub-section + AI fallback swap khi `deep` prop có data.
- `apps/web/src/components/layout/{Header,Footer,BodyBackground}.tsx` + `index.ts` — reusable layout, Header có `usePathname()` cho active link.
- `apps/web/src/app/{layout,page,xem-tu-vi/page,ngay-tot/page}.tsx` — rebrand metadata "Diễn Cầm Tam Thế", Header/Footer ở root layout cho mọi route.
- `apps/web/src/lib/home-data.ts` — mới, typed data (SERVICES, ZODIAC, HOROSCOPE, LUC_DIEU, LUC_DIEU_TONE, ARTICLES, TAROT_DECK).
- `apps/web/src/lib/env.ts` — bump default ports.
- `apps/web/src/app/globals.css` — `@import` Cormorant Garamond + body bg solid `#fbf3e2` (BodyBackground component overlay riêng).
- `apps/web/src/assets/bg-*.jpg` — 11 ảnh user drop vào (sumi-mountain, magnolia-birds, sakura-lake, koi-dragon, ...).
- `packages/core/src/types.ts` — thêm `DaiHanReading`, `TieuHanReading`, `TwelvePalaceReading`, `DeepReadingsData`.
- `packages/ai/src/prompts.ts` — thêm 3 prompt JSON-mode.
- `packages/ai/src/analyze.ts` — thêm `analyzeDaiHan`, `analyzeTieuHan`, `analyzeTwelvePalaces`, combined `analyzeDeepReadings` (sequential, có onProgress).
- `apps/api/src/routes/tuvi.ts` — thêm `POST /api/tuvi/deep-readings`, fix TS strict portability cho `tuviRouter` (annotate `ExpressRouter`).
- `CLAUDE.md` — sửa web port 3000→3100, thêm `@tuvi/lichvannien` vào monorepo layout + `transpilePackages`.

**Blocker:**
- Chưa test E2E Deepseek với form thật — chỉ verify TSC sạch + route 200 + API hot-reload + endpoint reachable. Không biết JSON-mode response có đúng schema 100% chưa, không biết rate-limit khi 3 calls deep + 6 calls analyze chạy đồng thời.
- iztro field `palace.name` trả "Tử Nữ" còn chỗ khác (PALACE_LABELS_VI trong core, prompt cũ) dùng "Tử Tức" — đã xử lý bằng cách check cả 2 khi findPalace, thêm cả 2 key vào CUNG_META, prompt JSON dạy AI accept cả 2 — chưa verify AI có nhất quán.
- `apps/web/data.js` cũ user mở trong IDE → đã xoá sau khi convert sang `home-data.ts`. Component cũ orphan: `TuviForm.tsx`, `LunarCalendar.tsx`, `GoodDayFinder.tsx`, `ParticlesBg.tsx`, `ZodiacConstellations.tsx` — không xoá để dùng lại nếu cần.

**Việc tiếp theo:**
- Test E2E: submit form thật trên `/xem-tu-vi`, đợi 30-60s, kiểm tra:
  1. AnalysisCards render đủ 6 section markdown.
  2. DeepReadings sau khi load: 12 đại hạn có reading khớp `index/ageStart`, 6 năm tiểu hạn khớp `year`, 12 cung khớp `name` (đặc biệt "Tử Nữ"/"Tử Tức").
  3. Nếu Deepseek trả JSON sai schema → log raw text, tinh chỉnh prompt (thêm "PHẢI trả JSON theo schema, không thêm trường khác").
- Wire `NamHienTaiDetail` (4 aspects + 12 months) sang AI — hiện vẫn deterministic. Có thể gộp vào endpoint `/deep-readings` hoặc thêm endpoint riêng.
- Wire DeepReading trong `/ngay-tot` sang Deepseek thật (hiện chỉ throw → fallback). Tạo endpoint `/api/tuvi/ngay-tot/luangiai` (`add-api-endpoint` skill).
- Optional: nút download PDF + persist slug — wire `/api/tuvi/full` để có shareable URL.
- Commit khi xong test E2E. Bundle: "Rebuild Diễn Cầm UI + wire iztro/Deepseek + DeepReadings AI". Trước commit chạy `/decide` cho 2 quyết định lớn (rebrand sang Diễn Cầm + auto-trigger AI thay button thủ công).

---



**Đang làm:** Polish design home page — font SF Pro Display toàn site, Hero + LunarCalendar bg/palette theo hướng Japan sakura, section mới "Xem Ngày Tốt".

**Đến đâu rồi:**
- Xong font system: `@import SF Pro Display` từ cdnfonts, tailwind map cả `sans` lẫn `serif` → SF Pro (không đụng ~20 file `font-serif` sẵn có). PDF giữ Noto Sans TTF (PDFKit cần, render dấu Việt tốt hơn).
- Web dev restart cũ không kill được (permission), spin server mới trên `:3001` — CSS bundle verify dùng SF Pro Display đúng.
- Download 2 ảnh: `/images/sakura-yuhi.jpg` (Ambientha, variant landscape 2425×825) + `/images/day-card-bg.jpg` (Pinterest 750×421) vào `public/images/`.
- Hero + LunarCalendar trải qua nhiều vòng iteration: bg ảnh sakura → bỏ overlay tím → palette pink/rose → đổi sang gold/white/deep-indigo (complementary với pink bg — ukiyo-e). LunarCalendar từ sakura bg → gradient night-sky indigo → cuối cùng gradient dusk `#1a0b2e→#3d1d4a→#2a1040` (extract palette từ sakura-yuhi, cùng thế giới twilight).
- Card "Ngày đã chọn" trong LunarCalendar: Pinterest bg + text căn giữa + gradient overlay `slate-900/65 via-/20 to-/70` đồng tone slate-900 với 2 panel bên cạnh + drop-shadow mạnh cho số ngày 7xl.
- Particles palette từ purple→pink→gold (links gold `#fbbf24`).
- Phase 3 full xong: `<GoodDayFinder />` — 8 loại việc (cưới hỏi, khai trương, xuất hành, động thổ, nhập trạch, cầu tài, ký kết, thi cử), bg washi cream `#f5ebd9→#f0e2c8→#ead5b3`, lọc ngày hoàng đạo trong tháng match `STAR_ADVICE.nen` với keyword của việc, empty state + count, scroll max-h 560px.
- 2 lần rewrite `patterns.md` section "Design rhythm": lần đầu sai ("luôn contrast warm↔cool"), lần sau đúng ("connected tonal, differentiate medium, UI complementary với bg") + anti-pattern pink-on-pink đã vấp.

**Files đã sửa:**
- `apps/web/src/app/globals.css` — `@import SF Pro Display` + biến `--font-sans` với fallback stack.
- `apps/web/tailwind.config.ts` — `fontFamily.sans` + `serif` cùng map SF Pro Display.
- `apps/web/src/app/page.tsx` — Hero bg đổi nhiều lần (sakura → rose → gold palette), FeatureCard palette gold/indigo, import + render `<GoodDayFinder />`.
- `apps/web/src/components/LunarCalendar.tsx` — bg dusk gradient, card "Ngày đã chọn" Pinterest bg + centered text + slate overlay.
- `apps/web/src/components/ParticlesBg.tsx` — palette gold/cream, link gold.
- `apps/web/src/components/ZodiacConstellations.tsx` — label `fontFamily: 'serif'` → `'inherit'`.
- `apps/web/src/components/GoodDayFinder.tsx` — mới, 8 work types, filter form trái + list results phải.
- `apps/web/public/images/sakura-yuhi.jpg` — mới (Ambientha landscape banner).
- `apps/web/public/images/day-card-bg.jpg` — mới (Pinterest).
- `.claude/memory/patterns.md` — thêm pattern Font + Design rhythm (rewrite 1 lần).

**Blocker:**
- Không kill được web dev cũ trên `:3000` (permission denied), phải chạy song song `:3001`. Dev server ban đầu vẫn render font/bg cũ; user mở `:3001` để xem version mới.

**Việc tiếp theo:**
- User tự Ctrl+C dev server cũ `:3000` khi dọn.
- Redesign `ValueSection` / `HowSection` / `FaqSection` / `Footer` / `Navbar` theo cùng rhythm (extract palette từ section kề, medium khác) — hiện còn tone brand cream/gold cũ, chưa đồng bộ với Japan sakura palette phía trên.
- Tune `GoodDayFinder`: thêm "giờ hoàng đạo" chi tiết 1 click xem nhiều hơn? Thêm "hướng xuất hành"? Filter theo ngày âm?
- Chưa commit — bundle "font SF Pro + Japan sakura redesign + GoodDayFinder" khi user muốn.

---

### 2026-04-24

**Đang làm:** Thêm Lịch Vạn Niên vào home + redesign Hero theo Figma + interactive particles bg.

**Đến đâu rồi:**
- Xong Phase 1 lịch vạn niên: package `@tuvi/lichvannien` port thuật toán Hồ Ngọc Đức (solar ↔ lunar TZ +7) + can chi năm/tháng/ngày. Verify 6 ngày lịch sử khớp 100%.
- Xong Phase 2: bảng 12 sao Ngọc Hạp (hoàng đạo / hắc đạo) + 6 giờ hoàng đạo. Verify bảng giờ khớp sách 100%.
- Xong Phase 3 rút gọn: `advice.ts` với STAR_ADVICE (nên/kiêng theo trực ngày) + DIRECTIONS_BY_CAN (Hỷ thần/Tài thần).
- Redesign `<LunarCalendar />` theo Figma node 1:5 (layout 3 cột dark purple, card "Hôm nay" gradient fuchsia, calendar emerald/rose tones, panel Vận hạn 4 row).
- Redesign Hero theo Figma node 4:23: "Hành Trình Tâm Linh" + 3 feature card (Tử Vi active, Thần Số Học + Tarot tag "Sắp ra mắt") + CTA "Bắt Đầu Ngay".
- Hero bg: lần 1 dùng custom canvas, sau chuyển sang `tsParticles` (slim preset) với hover grab + repulse. Overlay `<ZodiacConstellations />` với 12 chòm sao SVG cố định quanh perimeter (Aries → Pisces, star pattern gần đúng + symbol + tên VN).

**Files đã sửa:**
- `packages/lichvannien/*` — package mới (solar-lunar.ts, can-chi.ts, hoang-dao.ts, advice.ts, day-info.ts, index.ts, package.json, tsconfig.json).
- `apps/web/src/components/LunarCalendar.tsx` — mới, 3-col layout theo Figma.
- `apps/web/src/components/ParticlesBg.tsx` — mới, tsParticles wrapper.
- `apps/web/src/components/ZodiacConstellations.tsx` — mới, 12 chòm SVG overlay.
- `apps/web/src/app/page.tsx` — Hero redesign + import/layout thay đổi.
- `apps/web/next.config.js` — thêm `@tuvi/lichvannien` vào `transpilePackages`.
- `apps/web/package.json` — workspace dep + 3 package tsparticles.
- `.claude/memory/decisions.md` — 5 entry mới (Phase 1/2, calendar redesign, hero redesign, tsParticles).

**Blocker:**
- Download bg PNG từ Figma MCP bị sandbox chặn (`localhost:3845` untrusted). User cần export thủ công từ Figma nếu muốn bg image đúng 100%. CSS + particles hiện tại đã gần, không phải blocker cứng.

**Việc tiếp theo:**
- Export bg PNG từ Figma (thủ công hoặc allow Bash rule cho `curl http://localhost:3845/*`), wire vào CSS `background-image`.
- Phase 3 đầy đủ: section "Xem ngày tốt" theo loại việc (cưới hỏi / khai trương / xuất hành / động thổ / nhập trạch) — filter list ngày hoàng đạo trong tháng theo star mapping.
- Redesign các section còn lại nếu có: ValueSection, HowSection, Footer, Navbar theo Figma.
- Tune particles (mật độ / màu line / chỉ grab hay cả repulse) theo feedback user nếu có.
- Chưa commit — khi ổn định thì commit bundle feature Lịch Vạn Niên + Hero redesign.

---

### 2026-04-23

**Đang làm:** (không có hoạt động code trong session này)
**Đến đâu rồi:** Session chủ yếu chạy `/log` để ghi nhận — không có `today-changes.tmp`, không phải git repo nên không có diff/commit để tổng hợp.
**Files đã sửa:** (không)
**Blocker:** (không)
**Việc tiếp theo:** Session sau xác định feature/bug cụ thể trước khi bắt đầu chỉnh code, dùng `/decide` khi chốt thay đổi business logic.
