---
name: add-analysis-section
description: Thêm một section AI mới vào bản phân tích Tử Vi (ví dụ: thêm "tài lộc" ngoài 6 section hiện có). Dùng khi user muốn mở rộng output của analyzeChart.
---

# Add new AI analysis section

## Khi dùng skill này

User nói muốn thêm một mục phân tích mới vào bản tử vi (vd: "thêm section phân tích tài lộc", "mục con cái", "mục quý nhân"). Hiện tại có 6 section: `overview, career, love, health, decade, advice`.

## Ba edit PHỐI HỢP (không được thiếu cái nào)

### 1. `packages/core/src/types.ts`

- Thêm field mới vào interface `AnalysisSections`.
- Thêm entry vào object `ANALYSIS_TITLES` với tiêu đề tiếng Việt.

### 2. `packages/ai/src/prompts.ts`

- Thêm key mới vào `SECTION_PROMPTS` với prompt tiếng Việt mô tả rõ section đó cần phân tích gì.
- Thêm key vào mảng `SECTION_ORDER` — THỨ TỰ trong mảng này quyết định thứ tự gọi Deepseek và thứ tự hiển thị trong PDF.

### 3. `apps/web/src/app/tu-vi/[slug]/page.tsx`

- Thêm key vào mảng `ANALYSIS_ORDER` — thứ tự hiển thị trên web SSR.

## Lưu ý

- Bot processing step count ("Đang xử lý · X/4") ĐỘC LẬP với số section. Không đồng bộ — xem `patterns.md`.
- Prompt mới phải ra tiếng Việt (system prompt trong `prompts.ts` đã ép tiếng Việt, chỉ cần viết user prompt tiếng Việt).
- Sau khi thêm, test bằng `pnpm dev:api` + `curl -X POST http://localhost:4000/api/tuvi/analyze` với payload mẫu để verify section mới xuất hiện trong response.

## Sau khi xong

Đề xuất user chạy `/decide` để ghi lại lý do thêm section (tại sao cần section này, rejected alternatives nếu có).
