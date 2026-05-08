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
