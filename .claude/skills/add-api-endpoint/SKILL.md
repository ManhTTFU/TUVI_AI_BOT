---
name: add-api-endpoint
description: Thêm một endpoint REST mới vào API server dưới /api/tuvi/*. Follow pattern có sẵn trong apps/api/src/routes/tuvi.ts.
---

# Add new API endpoint

## Khi dùng skill này

User muốn thêm route mới cho bot hoặc web gọi vào API (vd: `/api/tuvi/history`, `/api/tuvi/share-link`).

## Endpoints hiện có (tham khảo pattern)

- `POST /api/tuvi/calculate` — chart only
- `POST /api/tuvi/analyze` — chart + AI
- `POST /api/tuvi/pdf` — binary PDF response
- `POST /api/tuvi/full` — chart + AI + persist → `{slug, chart, analysis}`
- `GET  /api/tuvi/chart/:slug` — load persisted FullResult
- `GET  /api/tuvi/pdf/:slug` — stream persisted PDF
- `GET  /api/tuvi/canh-gio` — 12 traditional hour slots

## Quy trình

### 1. Validate input contract

Mọi POST nhận `BirthInfo` phải đi qua `parseInfo` trong `apps/api/src/routes/tuvi.ts`:
- `validateBirthDate()` — kiểm tra format ngày
- `timeIndex ∈ [0, 11]` — index canh giờ hợp lệ

Nếu endpoint mới nhận shape khác, viết validator mới cùng style (throw `Error` với message tiếng Việt, handler bắt và trả `{ error: msg }` status 400).

### 2. Thêm route

Edit `apps/api/src/routes/tuvi.ts`:
```ts
router.<method>('/<path>', async (req, res) => {
  try {
    // validate input
    // call package functions (calculateChart / analyzeChart / buildPdf)
    // return response
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});
```

### 3. Persistence (nếu cần)

Lookup dùng `slug` làm primary key (không có database). Dùng `makeChartSlug(name, birthDate)` từ `@tuvi/core`.
Persist: `saveFullResult(slug, data)` + `savePdf(slug, buffer)`.
Load: đọc từ `output/charts/<slug>.json` và `output/pdfs/<slug>.pdf`.

### 4. CORS / body size

App-level `cors()` + `express.json({ limit: '2mb' })` đã setup trong `apps/api/src/index.ts`. Payload > 2mb phải tăng limit có chủ đích, không silent.

### 5. Consumer update

- Bot gọi endpoint nào? → update `apps/bot/src/index.ts` nếu có handler mới.
- Web gọi không? → update fetch trong `apps/web/src/app/...`.

## Test

```bash
pnpm dev:api
curl -X POST http://localhost:4000/api/tuvi/<path> -H "Content-Type: application/json" -d '{...}'
```

## Sau khi xong

- Cập nhật section "API surface" trong `CLAUDE.md` nếu là endpoint public.
- `/decide` nếu route này thay đổi architecture (vd: lần đầu cần query param, lần đầu stream, v.v.).
