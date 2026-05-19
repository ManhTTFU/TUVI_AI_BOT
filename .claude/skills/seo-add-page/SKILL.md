---
name: seo-add-page
description: Thêm 1 page mới vào site Next.js với đầy đủ SEO setup (metadata, JSON-LD schemas, sitemap entry, robots rule, GA4 purchase tracking nếu charge tiền). Dùng khi user yêu cầu "thêm trang", "tạo route mới", "page mới cho dịch vụ X", hoặc khi mở 1 trang dịch vụ/blog/landing mới chưa từng có.
---

# Add new page with full SEO

## Khi dùng skill này

User mở 1 route mới chưa từng có trong `apps/web/src/app/`. Ví dụ:
- `/phong-thuy-bat-trach` — service mới
- `/blog/[slug]` — blog/article section
- `/landing-promo` — landing page chiến dịch
- `/kham-pha-cung-hoang-dao/[slug]` — category page mới

Mục tiêu: route mới được Google/Bing index ngay, có rich snippet (Service/Article/FAQ schema), tracked qua GA4.

## Reference

Đọc `SEO-CHECKLIST.md` ở root nếu muốn context đầy đủ về SEO stack của site.

## Quy trình 5 bước

### Bước 1 — Tạo `page.tsx` với metadata + JSON-LD

Template cho service page (có giá tiền):

```tsx
// apps/web/src/app/<route>/page.tsx
import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { serviceSchema, breadcrumbSchema, faqSchema } from '@/lib/seo-schemas';
import YourClient from '@/components/<feature>/YourClient';

export const metadata: Metadata = {
  title: '<Tên trang ngắn>',                  // <60 ký tự — hiển thị tab + SERP
  description: '<Mô tả 150-160 ký tự, dùng keyword tự nhiên>',
  alternates: { canonical: '/<route>' },      // BẮT BUỘC — duplicate canonical = SEO disaster
};

const FAQS = [
  { q: '<Câu hỏi tự nhiên user search?>', a: '<Trả lời 50-200 từ, tiếng Việt tự nhiên>' },
  // 4-6 Q&A — đủ rich snippet, không spam
];

export default function Page() {
  return (
    <>
      <JsonLd data={serviceSchema({
        name: '<Tên dịch vụ>',
        description: '<Mô tả dài>',
        path: '/<route>',
        serviceType: '<Astrology Reading | BaZi Reading | Tarot Reading | Astrological Calendar>',
        priceVnd: 5000,                       // bỏ field nếu free
      })} />
      <JsonLd data={breadcrumbSchema([
        { name: 'Trang chủ', path: '/' },
        { name: '<Tên trang>', path: '/<route>' },
      ])} />
      <JsonLd data={faqSchema(FAQS)} />
      <YourClient />
    </>
  );
}
```

Template cho article page (blog post, content):

```tsx
import { articleSchema, breadcrumbSchema } from '@/lib/seo-schemas';

<JsonLd data={articleSchema({
  title: '<Tiêu đề>',
  description: '<Mô tả 150-200 ký tự>',
  path: '/<route>',
  image: '/images/<slug>.png',  // optional — override default brand-logo.png. Nên ≥1200px wide.
})} />
```

### Bước 2 — Update `sitemap.ts`

File: `apps/web/src/app/sitemap.ts`

```tsx
const staticRoutes = [
  // ... existing entries
  { path: '/<route>', priority: 0.9, changeFrequency: 'weekly' as const },
];
```

Quy ước priority:
- `/` = 1.0
- Service chính (xem-tu-vi, xem-tarot) = 0.9
- Sub-page / list (hoang-dao) = 0.8
- Detail page ([slug]) = 0.7
- Legal/policy = 0.3

### Bước 3 — Update `robots.ts` (nếu có per-user detail)

File: `apps/web/src/app/robots.ts`

Nếu trang mới có per-user detail page private (vd: `/<route>/[id]` user-specific), thêm vào disallow:

```tsx
disallow: [
  '/api/',
  // ... existing
  '/<route>/',  // ← disallow detail page nếu private
],
```

KHÔNG disallow root `/<route>` nếu nó là public landing.

### Bước 4 — Wire GA4 purchase event (nếu charge tiền)

Nếu trang submit form trả tiền (qua `chargeReading`), wire GA4 purchase event.

#### 4a. Update `apps/web/src/lib/track-purchase.ts`

```tsx
export type PurchaseService = 'tu-vi' | 'tu-tru' | 'tarot' | 'horoscope' | '<your-service>';  // ← thêm

const PRICE_VND: Record<PurchaseService, number> = {
  // ... existing
  '<your-service>': 5000,                 // ← thêm
};

const ITEM_NAME: Record<PurchaseService, string> = {
  // ... existing
  '<your-service>': '<Tên hiển thị>',     // ← thêm
};
```

#### 4b. Trong FE client component, sau submit success:

```tsx
import { trackPurchase } from '@/lib/track-purchase';

// Sau khi setResult(...) / setChart(...):
trackPurchase('<your-service>', data.chartId as string);
```

### Bước 5 — Submit sau khi deploy

**KHÔNG cần re-submit sitemap manual ở GSC/Bing dashboard.** Sitemap.xml tự sinh từ
`sitemap.ts` mỗi request — sau deploy, `https://luangiaivanmenh.com/sitemap.xml`
đã có URL mới. Google + Bing tự periodic re-fetch (~3-7 ngày).

Muốn crawl nhanh hơn → action proactive sau khi CF Workers Builds deploy (~3-5 phút):

**A. IndexNow (Bing + Yandex)** — 1 lệnh tự động:

```bash
pnpm indexnow   # submit toàn bộ sitemap → Bing + Yandex crawl trong 24h
```

**B. Google Search Console** — Request indexing manual (quota ~10 URL/ngày):
- https://search.google.com/search-console → URL Inspection → nhập URL mới → **Request indexing**.

**C. Bing Webmaster** — Request indexing manual (backup):
- https://www.bing.com/webmasters → URL Inspection → nhập URL mới → **Request indexing**.

Timeline expected:
- Bing/Yandex (qua IndexNow): crawl trong **6-24h**.
- Google (qua Request indexing): crawl trong **24-72h**.
- Bị động không action gì: cả 2 sẽ crawl trong **3-7 ngày** qua periodic re-fetch sitemap.

## Test

```bash
# Verify route accessible
curl -sI https://luangiaivanmenh.com/<route>

# Verify JSON-LD render đúng
curl -s https://luangiaivanmenh.com/<route> | grep -oE 'application/ld\+json">{[^<]+' | head -5

# Verify sitemap có URL mới
curl -s https://luangiaivanmenh.com/sitemap.xml | grep -i '<route>'

# Verify Google rich result
# Mở https://search.google.com/test/rich-results → nhập URL mới
```

## Anti-patterns — KHÔNG làm

1. **Quên `alternates.canonical`** — Google có thể coi page là duplicate, de-rank.
2. **JSON-LD trong client component** (sau hydration) — Googlebot chưa thấy schema khi crawl HTML đầu. PHẢI render trong server component (page.tsx).
3. **Tự đặt `priceCurrency` khác `'VND'`** — Service schema bị reject.
4. **Disallow root `/<route>` trong robots.ts** — nguyên page mất khỏi index.
5. **FAQ schema có content khác visible page** — Google penalty (FAQ schema phải match visible UI).

## Sau khi xong

- Update `SEO-CHECKLIST.md` section "Page metadata cho từng trang" để thêm row mới (mục #10).
- Nếu route thay đổi architecture (vd: dynamic per-locale, ISR cache, edge runtime) → chạy `/decide` ghi vào decision log.
