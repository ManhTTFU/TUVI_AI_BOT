---
name: seo-change-price
description: Đổi giá 1 dịch vụ (Tử Vi/Tarot/Tứ Trụ/Hoàng Đạo) và đồng bộ qua 5 layer (DB, cache, Service schema JSON-LD, GA4 purchase event, UI). Dùng khi user nói "đổi giá tử vi từ 40k thành 50k", "update price", "tăng giá tarot", hoặc thay đổi `prices` table.
---

# Change service price (5-layer sync)

## Khi dùng skill này

User muốn đổi giá 1 dịch vụ. Ví dụ:
- "Đổi giá tử vi 40k → 50k"
- "Tăng phí tarot lên 10k"
- "Update giá tứ trụ thành 8k"

Giá xuất hiện ở 5 layer độc lập, BẮT BUỘC sync cả 5 nếu không sẽ có discrepancy giữa user-charged amount (DB) vs UI display (FE) vs SEO schema (Google SERP) vs GA4 analytics (revenue report).

## 5 nơi cần sync

### 1. Database `prices` table (source of truth)

```sql
UPDATE prices SET amount_vnd = <new_amount> WHERE action = '<service>';
```

Hoặc qua admin UI nếu có. Service action codes:
- `'analyze'` = Tử Vi 40k (legacy: dùng cho cả Tu Tru/Tarot vì tất cả đang fallback DEFAULT_READING_PRICE_VND = 5000)
- Hiện chỉ có 1 row `action='analyze'` — nếu cần per-service price, thêm row mới + update `getReadingPriceVnd()` để query theo action param.

### 2. In-process cache (auto-refresh sau 60s)

**File:** `apps/web/src/lib/wallet.ts:getReadingPriceVnd()`

Cache TTL 60s, sau đó tự đọc DB. Không cần làm gì — đợi 60s là code thấy giá mới.

Nếu cần ép invalidate ngay: restart worker (`wrangler deploy` hoặc tự kill isolate).

### 3. Service schema JSON-LD (hard-coded ở page.tsx)

**Files:** `apps/web/src/app/<service>/page.tsx`

Sửa field `priceVnd` trong `serviceSchema()` call:

```tsx
<JsonLd data={serviceSchema({
  // ...
  priceVnd: 50000,   // ← đổi từ 40000
})} />
```

4 trang có giá:
- `apps/web/src/app/xem-tu-vi/page.tsx` (priceVnd: 40000)
- `apps/web/src/app/xem-tarot/page.tsx` (priceVnd: 5000)
- `apps/web/src/app/tu-tru-bat-tu/page.tsx` (priceVnd: 5000)
- `apps/web/src/app/ngay-tot/page.tsx` (KHÔNG có priceVnd — free service)

**Lý do hard-code:** Google Service schema yêu cầu Offer.price là string cố định, không thể dynamic per-request. Trade-off: schema có thể lag DB nếu admin đổi giá runtime mà chưa redeploy code.

### 4. GA4 purchase event tracker

**File:** `apps/web/src/lib/track-purchase.ts`

Sửa `PRICE_VND`:

```tsx
const PRICE_VND: Record<PurchaseService, number> = {
  'tu-vi': 50000,    // ← đổi
  // ...
};
```

**Lý do hard-code:** FE không hit DB mỗi submit để query giá. GA4 dùng giá này để tính `value` trong purchase event → đổ vào GA4 Monetization report.

Tradeoff giống mục 3 — chấp nhận GA4 track giá cũ tới khi redeploy. Acceptable cho trend analytics.

### 5. UI toast / form display (auto từ server response)

**Files:** `apps/web/src/components/<service>/<Service>Client.tsx`

UI đọc `data.chargedVnd` từ server response → KHÔNG cần sửa. Toast tự hiển thị giá mới.

```tsx
toast.success(`Đã lập lá số — trừ ${formatVnd(data.chargedVnd)}`);
```

Chỉ sửa nếu có hard-coded fallback price trong client component (vd: optimistic UI khi server chưa response). Grep `const PRICE = ` trong FE client để check.

```bash
grep -rn "const PRICE = " apps/web/src/components apps/web/src/app
```

Nếu có, update giá ở đó luôn (KHÔNG xoá fallback — giữ làm optimistic for slow network).

## Quy trình

1. **Lấy số tiền mới + service** từ user. Confirm trước khi làm.
2. **UPDATE DB** (mục 1).
3. **Edit code** (mục 3 + 4 + 5 nếu cần).
4. **Typecheck:**
   ```bash
   pnpm --filter @tuvi/web exec tsc --noEmit
   ```
5. **Commit:**
   ```bash
   git add apps/web/src/app/<service>/page.tsx apps/web/src/lib/track-purchase.ts
   git commit -m "price: <service> X → Y VND"
   ```
6. **Push:** User push qua git để CF Workers Builds tự deploy.
7. **Verify post-deploy:**
   - Mở https://luangiaivanmenh.com/<service> → submit form thử → verify charge = giá mới
   - Schema check: `curl -s https://luangiaivanmenh.com/<service> | grep -oE '"price":"<new_amount>"'`
   - GA4 Realtime → submit → verify `purchase` event có `value: <new_amount>`

## Anti-patterns

1. **Chỉ update DB mà không update code** — schema + GA4 sẽ track giá cũ, user-facing nhất quán nhưng SEO/analytics sai.
2. **Update code mà không update DB** — schema show giá mới nhưng user vẫn bị charge giá cũ → user complain.
3. **Đổi `priceCurrency` thành non-VND** — Google reject Service.Offer schema.
4. **Hard-code giá ở >1 nơi trong FE** — duplicate state. Single source of truth là `PRICE_VND` trong `track-purchase.ts`.

## Sau khi xong

- Update `SEO-CHECKLIST.md` nếu có thay đổi structural (vd: thêm action code mới).
- `/decide` nếu đây là chiến lược pricing thay đổi lớn (vd: switch từ flat fee sang tier).
