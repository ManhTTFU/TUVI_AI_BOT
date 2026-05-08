# Decision Log — TUVIAI (Tử Vi Đẩu Số)

> Ghi lại **lý do** thay đổi business logic, không phải code.
> Code đọc từ file là biết; lý do chỉ có ở đây.

## Format mỗi entry

```
**Date:** YYYY-MM-DD
**Module:** [bot / api / web / core / astrology / ai / pdf]
**File:** path/to/file.ts
**Decision:** Đổi [CÁI GÌ]
**Reason:** Vì [LÝ DO] — phần quan trọng nhất
**Rejected alternatives:** Đã thử [X] nhưng không được vì [Y]
```

---

## Entries

<!-- Entry mới thêm ở TRÊN cùng (mới nhất đầu tiên) -->

**Date:** 2026-04-24
**Module:** web
**File:** apps/web/src/components/ParticlesBg.tsx, apps/web/src/components/ZodiacConstellations.tsx
**Decision:** Hero background dùng tsParticles (slim preset) thay cho custom canvas cũ. Thêm overlay 12 chòm sao hoàng đạo Aries → Pisces với star pattern gần đúng + symbol + tên tiếng Việt, đặt quanh perimeter hero.
**Reason:** User yêu cầu dùng tsParticles + 12 chòm sao. tsParticles có sẵn modes grab/repulse/links — rẻ effort hơn tự viết, mature, maintained. 12 chòm tách thành overlay SVG riêng (không inject vào tsParticles) vì tsParticles quản lý particles động, không phù hợp pattern cố định có tên + symbol.
**Rejected alternatives:** (1) Inject 12 constellations làm particles cố định trong tsParticles — không có API cho "nhóm + lines cố định". (2) Chỉ 12 chòm không có particles field — mất cảm giác "bầu trời động".

Package mới: `@tsparticles/engine` + `@tsparticles/react` + `@tsparticles/slim` (~3.9.x). pnpm cảnh báo "Ignored build scripts: @tsparticles/engine" — bỏ qua, không cần build script cho runtime.

---


**Date:** 2026-04-24
**Module:** web
**File:** apps/web/src/app/page.tsx
**Decision:** Thay Hero từ "Lập lá số Tử Vi Đẩu Số & luận giải bằng AI" → "Hành Trình Tâm Linh" với 3 feature card (Tử Vi / Thần Số Học / Tarot) theo Figma node 4:23. Tử Vi hoạt động (link `/xem-tu-vi`). Thần Số Học + Tarot gắn tag "Sắp ra mắt", không click được.
**Reason:** User yêu cầu thay theo design. Design positioning rộng hơn chỉ tử vi — để chuẩn bị mở rộng sản phẩm mà vẫn trung thành design.
**Rejected alternatives:** (1) Chỉ làm top hero (title + subtitle), bỏ 3 card — lệch design. (2) Render 3 card nhưng link tất cả đến `/xem-tu-vi` — lừa user vì nội dung card là thần số/tarot, không phải tử vi.

Metadata SEO (`<title>` + `<meta>`) giữ nguyên — chỉ đổi hiển thị hero. Nếu muốn mở rộng thần số/tarot thật, sửa metadata và thêm route mới.

---


**Date:** 2026-04-24
**Module:** web + packages/lichvannien
**File:** apps/web/src/components/LunarCalendar.tsx, packages/lichvannien/src/advice.ts
**Decision:** Redesign LunarCalendar theo Figma MysticVerse — section dark purple gradient, 3 cột (Hôm nay / Calendar / Vận hạn). Thêm `advice.ts` với bảng trực ngày → việc nên/kiêng + bảng Can ngày → Hỷ thần/Tài thần.
**Reason:** User yêu cầu match design Figma. Dark theme lệch khỏi brand purple/gold hiện tại nhưng chỉ trong 1 section — tương phản với Hero để làm nổi. Lịch khởi Thứ 2 (không phải CN) theo design. Tên "MysticVerse" trong Figma không áp dụng — giữ brand "Tử Vi AI".
**Rejected alternatives:** (1) Ép design vào palette brand cream/gold — sẽ mất cảm giác mystical của Figma. (2) Đổi toàn bộ trang home sang dark — quá lớn scope, phá các section khác.

Về data: bảng việc nên/kiêng theo 12 sao Ngọc Hạp là bản rút gọn. Hỷ thần theo Can ngày là bảng truyền thống phổ biến. Đây là "Phase 3 rút gọn" để fill panel phải của design — chưa phải full Ngọc Hạp Thông Thư.

---


**Date:** 2026-04-24
**Module:** packages/lichvannien + web
**File:** packages/lichvannien/src/hoang-dao.ts, apps/web/src/components/LunarCalendar.tsx
**Decision:** Phase 2 lịch vạn niên — thêm 12 sao Ngọc Hạp (hoàng đạo / hắc đạo) + 6 giờ hoàng đạo. Grid ô ngày hiển thị viền xanh (hoàng) / đỏ (hắc). Panel: chip "HOÀNG/HẮC ĐẠO · Trực [tên sao]" + list 6 giờ hoàng đạo với chi + range + tên sao.
**Reason:** Dùng nguyên lý chung 1 công thức `startChi = ((chiBase - 2) mod 6) * 2` áp cả ngày (base=chi tháng) lẫn giờ (base=chi ngày). Thay vì 2 bảng tra riêng, chỉ cần 1 hàm `getStar` + 1 mảng 12 sao. Verify bằng 12 chi ngày so với bảng sách Ngọc Hạp — khớp 100% (ngày Tý: Tý/Sửu/Mão/Ngọ/Thân/Dậu; ngày Tỵ: Sửu/Thìn/Ngọ/Mùi/Tuất/Hợi; v.v.).
**Rejected alternatives:** (1) 2 lookup tables 12×12 hardcode — dễ sai copy, không generalize. (2) Tách "sao Bảo Quang / Kim Đường" cho 2 tháng đặc biệt theo 1 số biến thể sách — MVP bỏ qua, dùng "Thiên Đức" chuẩn nhất.

Sau Phase 2 còn thiếu (Phase 3): việc nên làm / kiêng kỵ theo trực ngày, section "Xem ngày tốt" lọc ngày hoàng đạo theo tháng + loại việc.

---


**Date:** 2026-04-24
**Module:** web + packages/lichvannien (mới)
**File:** packages/lichvannien/src/solar-lunar.ts, apps/web/src/components/LunarCalendar.tsx
**Decision:** Tạo package `@tuvi/lichvannien` tự implement thuật toán Hồ Ngọc Đức (solar ↔ lunar) + bảng can chi, thay vì dùng npm package (`lunar-javascript`, `solarlunar`, v.v.). Nhúng `<LunarCalendar />` vào home page giữa Hero và ValueSection.
**Reason:** Các lib npm phổ biến dùng TZ +8 (Trung Quốc) → lệch 1 ngày ở biên tháng âm so với VN. Hồ Ngọc Đức là chuẩn vàng cho VN (TZ +7), ~200 dòng code, public domain. Verify 6 ngày lịch sử (17/2/2026, 10/10/1954, 30/4/1975, 2/9/1945, 1/1/2000, 14/2/2010) khớp 100%.
**Rejected alternatives:** (1) `lunar-javascript` — text Trung Quốc phải map, bảng kiêng kỵ khác VN. (2) `solarlunar` — TZ +8 sai 1 ngày ở biên. (3) `vietnamese-lunar-calendar` npm — chỉ có convert, không có can chi/hoàng đạo, phải bổ sung sau → effort gần bằng tự viết.

Scope Phase 1: hiển thị ngày âm + can chi năm/tháng/ngày. Phase 2 (sau): hoàng đạo/hắc đạo + giờ hoàng đạo dùng bảng tra "Ngọc Hạp Thông Thư". Phase 3: section "Xem ngày tốt" lọc theo loại việc.

---


<!--
Ví dụ:

**Date:** 2026-04-23
**Module:** ai
**File:** packages/ai/src/prompts.ts
**Decision:** Tách 1 prompt lớn thành 6 section riêng (overview, career, love, health, decade, advice)
**Reason:** Deepseek timeout với prompt dài > 4k tokens. Chia nhỏ cho phép onProgress feedback UI.
**Rejected alternatives:** Tăng max_tokens — vẫn timeout phía network, không giải quyết được UX chờ 60s không biết gì.

---
-->
