---
name: seo-audit
description: Audit trạng thái SEO hiện tại của luangiaivanmenh.com — verify robots/sitemap/JSON-LD/OG/GA4 health, list URL nào bị 404 / missing schema / sai dimension. Dùng khi user hỏi "check SEO", "site có vấn đề SEO không", "verify search console", "audit SEO", "kiểm tra site map", hoặc sau deploy lớn.
---

# SEO Health Audit

## Khi dùng skill này

User muốn check trạng thái SEO hiện tại. Ví dụ:
- "Audit SEO toàn site"
- "Verify schema có valid không"
- "Check sitemap còn sống không"
- "Site có lỗi SEO nào không?"
- Sau khi deploy thay đổi lớn → verify không regression

## Reference

`SEO-CHECKLIST.md` ở root liệt kê đầy đủ state SEO baseline. Skill này dùng để verify state đó CÒN ĐÚNG.

## Audit checklist — 8 mục

### 1. Robots.txt accessible

```bash
curl -sI https://luangiaivanmenh.com/robots.txt
```

**Expected:** HTTP 200, Content-Type: text/plain. Body phải có `User-Agent: *`, `Disallow: /api/`, `Sitemap: ...`.

**Fail mode:** 404/500 hoặc disallow `/` → cả site bị block. Check `apps/web/src/app/robots.ts`.

### 2. Sitemap.xml accessible + đúng URL

```bash
curl -sI https://luangiaivanmenh.com/sitemap.xml
curl -s https://luangiaivanmenh.com/sitemap.xml | grep -c '<loc>'
```

**Expected:** HTTP 200, Content-Type: application/xml. Số URL ≥ 20 (8 static + 12 zodiac).

**Fail mode:** < 20 URL → trang mới thêm chưa được include trong sitemap. Check `apps/web/src/app/sitemap.ts`.

### 3. JSON-LD schemas trên page chính

```bash
# Service + Offer + Breadcrumb + FAQ phải có cho 4 service pages
for page in xem-tu-vi xem-tarot tu-tru-bat-tu ngay-tot; do
  echo "=== $page ==="
  curl -s "https://luangiaivanmenh.com/$page" | grep -oE 'application/ld\+json">{"@context"[^<]+' | head -5
done
```

**Expected mỗi page:** 4 JSON-LD scripts (WebSite + Organization từ layout, Service/CollectionPage, BreadcrumbList, FAQPage).

**Fail mode:** Schema missing `priceCurrency` → Google reject Offer.

### 4. Google Rich Result Test

Manual test (Google không có public API):
- https://search.google.com/test/rich-results
- Test ít nhất 3 URL: `/`, `/xem-tu-vi`, `/hoang-dao/bach-duong`
- Expected output: KHÔNG có error, có thể có warning "không nghiêm trọng" cho field optional thiếu.

### 5. OG image + meta tags

```bash
curl -s https://luangiaivanmenh.com/ | grep -oE '<meta property="og:image[^>]*>'
curl -sI https://luangiaivanmenh.com/images/brand-logo.png
```

**Expected:**
- `og:image` URL accessible (HTTP 200)
- `og:image:width` + `og:image:height` set đúng (>= 600px width)
- `og:image:alt` có nội dung

**Fail mode:** `og:image` URL trả 404 → Facebook/LinkedIn share preview không có image.

### 6. Canonical URL không duplicate

```bash
# Sample 5 page, check canonical
for url in / /xem-tu-vi /xem-tarot /tu-tru-bat-tu /ngay-tot; do
  canonical=$(curl -s "https://luangiaivanmenh.com$url" | grep -oE '<link rel="canonical"[^>]*' | head -1)
  echo "$url → $canonical"
done
```

**Expected:** Mỗi page có 1 `<link rel="canonical">` riêng, KHÔNG trùng nhau.

**Fail mode:** Cùng canonical URL ở 2 page khác nhau → Google de-rank cả 2.

### 7. GA4 tracking active

```bash
curl -s https://luangiaivanmenh.com/ | grep -oE 'G-1C36RSE64M' | head -3
```

**Expected:** Tag ID `G-1C36RSE64M` xuất hiện trong HTML (qua `@next/third-parties/google` script).

**Verify thực sự fire:**
- F12 DevTools → Network → filter `google-analytics.com/g/collect`
- Load https://luangiaivanmenh.com → thấy request với `tid=G-1C36RSE64M&en=page_view` = OK

### 8. IndexNow key file

```bash
curl -sI https://luangiaivanmenh.com/b2c4b113d010f28af75742592373bdcc82ce67ce19aacad3253f7119f0b4dce0.txt
```

**Expected:** HTTP 200, body chứa chính cái filename (key value).

**Fail mode:** 404 → Bing/Yandex reject IndexNow submit (api.indexnow.org trả 422).

## Audit quick run — 1 command tổng hợp

```bash
echo "=== robots ===" && curl -sI https://luangiaivanmenh.com/robots.txt | head -1 && \
echo "=== sitemap URL count ===" && curl -s https://luangiaivanmenh.com/sitemap.xml | grep -c '<loc>' && \
echo "=== OG image ===" && curl -sI https://luangiaivanmenh.com/images/brand-logo.png | head -1 && \
echo "=== GA4 ===" && curl -s https://luangiaivanmenh.com/ | grep -oE 'G-1C36RSE64M' | head -1 && \
echo "=== IndexNow key ===" && curl -sI https://luangiaivanmenh.com/b2c4b113d010f28af75742592373bdcc82ce67ce19aacad3253f7119f0b4dce0.txt | head -1
```

Nếu tất cả 5 mục trả HTTP 200 / có giá trị expected → SEO healthy.

## Cảnh báo thường gặp

### Warning Google Rich Result: "Trường image bị thiếu"

Article schema thiếu field `image`. Đã fix bằng default fallback `brand-logo.png` ở `seo-schemas.ts:articleSchema()`. Nếu vẫn warning → check cache CDN, scrape lại sau 1-2h.

### Warning Google Rich Result: "Author không có URL"

Article schema thiếu `author.url`. Hiện đặt `author: PROVIDER` (= organization). Nếu Google strict hơn, cần thêm `url` field — sửa `seo-schemas.ts:articleSchema()`.

### Bing "Discovered but not crawled"

Bing chưa kịp crawl URL mới (queue chậm). Đợi 24-72h, hoặc click "Request indexing" trong Bing Webmaster URL Inspection.

### Facebook "We can't access the image"

OG image bị Cloudflare block bot Facebook (rare). Check CF firewall rules. Hoặc URL OG image trả 4xx — chạy mục 5 ở trên.

## Khi audit fail — hành động

1. **Schema invalid:** mở `apps/web/src/lib/seo-schemas.ts`, fix helper, rerun typecheck `pnpm --filter @tuvi/web exec tsc --noEmit`.
2. **Sitemap thiếu URL:** mở `apps/web/src/app/sitemap.ts`, thêm entry. Test local `pnpm dev:web` rồi curl.
3. **OG 404:** verify image file exists trong `apps/web/public/images/`, hoặc đổi `metadata.openGraph.images[0].url` ở `layout.tsx`.
4. **GA4 không fire:** check `NEXT_PUBLIC_GA_ID` env var set ở 3 nơi (root `.env`, `apps/web/.env.local`, `apps/web/wrangler.jsonc` vars).
5. **Robots block sai:** sửa `apps/web/src/app/robots.ts`, deploy ngay (mỗi giờ delay = SEO loss).

## Tài liệu tham khảo

- Google Search Docs: https://developers.google.com/search/docs
- Schema.org Validator: https://validator.schema.org/
- Bing Webmaster: https://www.bing.com/webmasters
