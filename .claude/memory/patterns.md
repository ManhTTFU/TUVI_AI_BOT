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
