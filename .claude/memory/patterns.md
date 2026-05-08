# Patterns đã chốt — không tranh luận lại

> Quy ước kỹ thuật đã thống nhất. Không review lại trừ khi có lý do mới.

---

## Backend (bot, api, core, astrology, ai, pdf)

**Module resolution:**
NodeNext. Imports của `.ts` files PHẢI có extension `.js` (ví dụ `export * from './types.js'`). Không "sửa" thành `.ts`.

**Env loading:**
Root `.env` cho bot + api (qua `tsx --env-file=../../.env`). Next.js đọc `apps/web/.env.local` riêng — update cả 2 nơi cho `NEXT_PUBLIC_*`.

**Package exports:**
Mọi `@tuvi/*` workspace expose source trực tiếp: `"main": "./src/index.ts"`. Không consume `dist/`.

**AI client:**
`openai` SDK chỉ dùng như HTTP client, `baseURL` override về Deepseek. Không bao giờ gọi `api.openai.com`.

---

## Frontend (web)

**Next.js version:** 14 App Router + SSR, TailwindCSS.

**transpilePackages:** Bắt buộc list mọi `@tuvi/*` package mà web import (hiện chỉ có `@tuvi/core`). Thêm package mới vào graph → thêm vào `next.config.js`.

**Font:** Toàn bộ web dùng **SF Pro Display** (load qua `@import 'https://fonts.cdnfonts.com/css/sf-pro-display'` trong `globals.css`). Tailwind config map cả `sans` lẫn `serif` → SF Pro Display, nên các heading đang dùng `font-serif` vẫn render SF Pro (phân biệt bằng `font-weight`/`text-size` thôi, không phải bằng family). Fallback stack: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "Segoe UI", system-ui, sans-serif` — máy Apple dùng SF native, Windows/Android dùng CDN woff2.

**PDF fonts KHÔNG đổi:** `@tuvi/pdf` vẫn dùng Noto Sans TTF (Regular/Bold/Italic) vì PDFKit cần TTF + Noto Sans render tốt dấu tiếng Việt trong file output. Đừng thay SF Pro vào PDF.

---

## Design rhythm giữa các section

**2 section liền kề: kết nối tonal, khác biệt về medium.** Không lặp ảnh (mất rhythm, mất identity, pha loãng concept), nhưng cũng KHÔNG bắt buộc tương phản tone (vd warm→cool) vì dễ gây cảm giác "2 trang khác nhau dán vào nhau, không liên quan".

**Rule đúng khi render section mới / swap bg:**
1. **Different medium** — section trước dùng ảnh? → section này dùng gradient/solid. Trước dùng gradient? → section này có thể dùng ảnh hoặc gradient khác rõ rệt.
2. **Connected tonal palette** — bg section sau phải "trích" được từ palette section trước. VD Hero dùng ảnh sakura hoàng hôn (pink/peach/plum) → LunarCalendar dùng gradient dusk/twilight (deep indigo → plum → deep purple) có tông cùng gia đình, cảm giác "cùng 1 thế giới lúc trời tối dần".
3. **UI colors complementary với bg** — nếu bg là pink sakura, UI (badge/card/button) dùng GOLD/CREAM/DEEP-INDIGO thay vì pink thêm nữa (pink-on-pink = low contrast + "chìm"). Tham khảo ukiyo-e Nhật: vàng bạc + deep indigo/plum trên nền pink/peach → sang, cổ điển, nổi.
4. **Section identity qua role**:
   - Hero = cảm xúc/ấn tượng → ảnh artistic, UI gold accent
   - Công cụ/tra cứu = không gian suy ngẫm → gradient dusk/twilight, UI white/gold accent
   - CTA cuối = quyết liệt → solid dark hoặc gradient strong

**Ví dụ hiện có trong home page (tham khảo):**
- Hero: ảnh `sakura-yuhi.jpg` (sakura hoàng hôn) + UI gold/white/deep-indigo
- LunarCalendar: gradient `from-[#1a0b2e] via-[#3d1d4a] to-[#2a1040]` (dusk palette extract từ sakura-yuhi) + glow amber/fuchsia → same world, khác medium
- Card "Ngày đã chọn" trong LunarCalendar: Pinterest bg riêng → nhịp thứ 3, không trùng Hero

**Anti-pattern đã vấp:**
- Dùng `bg-rose-*/pink-*` cho UI chip/card/button trên nền ảnh sakura pink → UI "chìm" vào ảnh, text khó đọc, cảm giác màu mè thay vì sang. Fix: gold + white + deep indigo.
- 2 section liền kề cùng 1 ảnh bg → user cảm "đơn điệu". Fix: đổi 1 sang gradient.
- Section sau tương phản mạnh tone (cool indigo sau khi warm pink) mà KHÔNG extract màu → "không liên quan". Fix: gradient cool-ish nhưng palette trích từ ảnh warm trước đó (plum/deep-purple/mauve).

**Khi có thêm section mới — checklist:**
- Section ngay trước trong `page.tsx` dùng bg gì? Ảnh hay gradient?
- Palette section trước gồm màu gì? (Đọc ảnh hoặc gradient stops)
- Section mới extract 2-3 màu từ palette đó, dùng medium khác.
- UI color = complementary với bg (bg warm → UI gold/cream/deep-indigo; bg cool → UI warm accent).
- Test: scroll toàn trang → mỗi section phải rõ identity nhưng vẫn "cùng 1 bộ phim".

---

## Vietnamese content

Tất cả user-facing copy (bot messages, web UI, PDF) là tiếng Việt. Code/comment vẫn dùng tiếng Anh. Label tiếng Việt đã chuẩn hóa trong `packages/core` (`PALACE_LABELS_VI`, `CANH_GIO`, `ANALYSIS_TITLES`) — không hardcode lại ở chỗ khác.

---

## Bot step numbering

2 scheme tách biệt, KHÔNG merge:
- Input phase: "Bước 1/5 … 5/5" (nhập name, gender, date, time, place)
- Processing phase: "Đang xử lý · 1/4 … 4/4" (chart → AI → PDF → send)

Số 4 ở processing độc lập với số section AI (6) — đừng đồng bộ.
