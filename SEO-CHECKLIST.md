# SEO Checklist — luangiaivanmenh.com

> Trạng thái tính đến 2026-05-19. Cập nhật khi có thay đổi.

## TL;DR

Site đã setup đầy đủ **technical SEO foundation** theo Google Search Docs:
robots.txt, sitemap.xml, structured data (JSON-LD), canonical URLs, OG/Twitter
meta, Google Analytics 4, IndexNow. Đã verify trên Google Search Console + Bing
Webmaster Tools. Còn lại: **design assets** (OG image custom 1200×630, per-zodiac
images) + **content scaling** (thêm trang dịch vụ mới, blog posts).

---

## ✅ Đã làm

### 1. `robots.txt`

**File:** `apps/web/src/app/robots.ts` (Next.js App Router auto-generate `/robots.txt`)

Live: `https://luangiaivanmenh.com/robots.txt` → HTTP 200

```
User-Agent: *
Allow: /
Disallow: /api/         ← API endpoints, không phải content
Disallow: /admin/       ← admin tools
Disallow: /vi-cua-toi   ← user wallet (private)
Disallow: /lich-su      ← user history (private)
Disallow: /dang-nhap    ← auth pages
Disallow: /tu-vi/       ← per-user chart detail (private)
Disallow: /tu-tru/      ← per-user chart detail
Disallow: /xem-tarot/[chartId]  ← per-user reading
Disallow: /hoang-dao/luan-giai  ← personalized horoscope
Disallow: /xoa-du-lieu  ← account deletion
Disallow: /_next/       ← Next.js internals

Host: https://luangiaivanmenh.com
Sitemap: https://luangiaivanmenh.com/sitemap.xml
```

### 2. `sitemap.xml`

**File:** `apps/web/src/app/sitemap.ts` (Next.js auto-generate `/sitemap.xml`)

Live: `https://luangiaivanmenh.com/sitemap.xml` → 20 URL = 8 trang tĩnh + 12 cung hoàng đạo

| URL | priority | changeFrequency |
|---|---|---|
| `/` | 1.0 | daily |
| `/xem-tu-vi`, `/xem-tarot`, `/tu-tru-bat-tu` | 0.9 | weekly |
| `/hoang-dao`, `/ngay-tot` | 0.8 | weekly/daily |
| `/hoang-dao/[12 cung]` | 0.7 | weekly |
| `/chinh-sach-bao-mat`, `/dieu-khoan-su-dung` | 0.3 | yearly |

### 3. JSON-LD Structured Data

**File:** `apps/web/src/lib/seo-schemas.ts` (helpers)
**Render:** `apps/web/src/components/seo/JsonLd.tsx` (component)

| Schema type | Trang nào | Mục đích |
|---|---|---|
| `WebSite` | mọi page (qua `layout.tsx`) | Site identity |
| `Organization` | mọi page (qua `layout.tsx`) | Brand identity |
| `Service` + `Offer` | `/xem-tu-vi`, `/xem-tarot`, `/tu-tru-bat-tu`, `/ngay-tot` | Product schema với giá VND |
| `BreadcrumbList` | mọi service + zodiac detail | Breadcrumb trong SERP |
| `CollectionPage` | `/hoang-dao` | List 12 zodiac |
| `Article` + `image` | `/hoang-dao/[slug]` (12 trang) | Article rich result với thumbnail |
| `FAQPage` | `/xem-tu-vi`, `/xem-tarot`, `/tu-tru-bat-tu`, `/ngay-tot` | FAQ rich snippet trong SERP |

**Verified qua Google Rich Result Test** — `/hoang-dao/bach-duong` pass Article schema.

### 4. Meta tags (per-page + site-wide)

**File:** `apps/web/src/app/layout.tsx` (site-wide default)

Mỗi `page.tsx` override `metadata.title` + `metadata.description` + `metadata.alternates.canonical` riêng.

- ✅ `<title>` template `%s | Vận Mệnh`
- ✅ `<meta name="description">` per-page tiếng Việt
- ✅ `<meta name="keywords">` (site-wide, Google ignore nhưng Bing có thể dùng)
- ✅ `<meta name="robots" content="index, follow">`
- ✅ `<link rel="canonical">` per-page
- ✅ `<meta property="og:*">` (title, description, url, siteName, locale, type, image, image:width, image:height, image:alt)
- ✅ `<meta name="twitter:card" content="summary_large_image">` + images

### 5. Open Graph Image

**File:** `apps/web/public/images/brand-logo.png` (1536×1024, ratio 3:2)

Set explicit trong `layout.tsx` `metadata.openGraph.images` + `twitter.images`.

**Note:** Trước đây dùng dynamic `apps/web/src/app/opengraph-image.tsx` (Next.js Edge runtime ImageResponse 1200×630) nhưng OpenNext Cloudflare adapter không support runtime='edge' trong cùng worker → đã xoá, fallback static brand-logo.png. TODO: design custom 1200×630 (xem mục Chưa Làm).

### 6. Google Search Console

- ✅ Verified domain qua Cloudflare DNS connect
- ✅ Sitemap submitted (`/sitemap.xml`)
- ✅ Tested rich result `/hoang-dao/bach-duong` PASS Article schema

URL: https://search.google.com/search-console

### 7. Bing Webmaster Tools

- ✅ Property added (import từ Google Search Console)
- ✅ Sitemap submitted (`https://luangiaivanmenh.com/sitemap.xml`)

URL: https://www.bing.com/webmasters

### 8. IndexNow Protocol

**Script:** `scripts/notify-indexnow.ts` (chạy `pnpm indexnow`)
**Key file:** `apps/web/public/b2c4b113d010f28af75742592373bdcc82ce67ce19aacad3253f7119f0b4dce0.txt` (verify ownership)

Submit URLs tới Bing + Yandex ngay lập tức (không phải đợi periodic crawl):

```bash
pnpm indexnow   # auto-fetch sitemap → submit 20 URL
```

### 9. Google Analytics 4

**Measurement ID:** `G-1C36RSE64M`
**Component:** `<GoogleAnalytics gaId={GA_ID}>` từ `@next/third-parties/google`
**Vị trí:** `apps/web/src/app/layout.tsx` (conditional render khi `NEXT_PUBLIC_GA_ID` set)

Env vars cần set ở 3 nơi:
- `.env` root (cho local dev)
- `apps/web/.env.local` (Next.js đọc)
- `apps/web/wrangler.jsonc` `vars` section (CF Workers production)

**Custom events đã wire:**
- `page_view` — auto qua Enhanced Measurement
- `scroll`, `click`, `form_submit`, `file_download` — auto
- `purchase` — fire sau mỗi lần submit thành công, gồm `transaction_id` (chartId), `value` (VND), `currency=VND`, `items[{item_id, item_name, price, quantity}]`

**File helper:** `apps/web/src/lib/track-purchase.ts`
**Wire-in:**
- `apps/web/src/components/tu-vi/TuviClient.tsx`
- `apps/web/src/components/tu-tru/TuTruClient.tsx`
- `apps/web/src/app/xem-tarot/TarotClient.tsx`
- `apps/web/src/app/hoang-dao/luan-giai/LuanGiaiClient.tsx`

### 10. Page metadata cho từng trang

| Trang | title | description | canonical | Schema |
|---|---|---|---|---|
| `/` | Vận Mệnh — Tử Vi, Tứ Trụ, Tarot, Phong Thủy | ✅ | `/` | WebSite + Organization |
| `/xem-tu-vi` | Xem Tử Vi — Lập lá số 14 chính tinh | ✅ | `/xem-tu-vi` | Service + Offer + Breadcrumb + FAQ |
| `/xem-tarot` | Xem Tarot · Trải bài 78 lá Rider-Waite | ✅ | `/xem-tarot` | Service + Offer + Breadcrumb + FAQ |
| `/tu-tru-bat-tu` | Tứ Trụ Bát Tự — Luận giải bản mệnh | ✅ | `/tu-tru-bat-tu` | Service + Offer + Breadcrumb + FAQ |
| `/ngay-tot` | Xem Ngày Tốt — Lịch Vạn Niên | ✅ | `/ngay-tot` | Service + Breadcrumb + FAQ |
| `/hoang-dao` | 12 Cung Hoàng Đạo | ✅ | `/hoang-dao` | CollectionPage + Breadcrumb |
| `/hoang-dao/[slug]` | {Tên} ({English}) — Tính cách, vận trình | ✅ | `/hoang-dao/{slug}` | Article + image + Breadcrumb |
| `/chinh-sach-bao-mat` | (default) | ✅ | `/chinh-sach-bao-mat` | - |
| `/dieu-khoan-su-dung` | (default) | ✅ | `/dieu-khoan-su-dung` | - |

---

## ⏳ Chưa làm / TODO

### 🟡 Manual setup (user thao tác)

| Việc | Trạng thái | Thời gian |
|---|---|---|
| Google Search Console: Request indexing thủ công cho trang quan trọng | Pending | 5 phút |
| Bing Webmaster: Live URL test + Request indexing trang chủ | Pending | 5 phút |
| Cốc Cốc Webmaster Tools (search engine VN) | Chưa setup | 10 phút |
| Yandex Webmaster (đã get URL qua IndexNow, chưa verify domain) | Optional | 10 phút |

### 🟢 Design assets cần thiết kế

| Việc | Hiện tại | Mục tiêu | Ưu tiên |
|---|---|---|---|
| OG image custom **1200×630** (Facebook lý tưởng 1.91:1) | brand-logo.png 1536×1024 (3:2) | PNG 1200×630 brand sumi gradient + text "Vận Mệnh" | Trung |
| Per-zodiac image cho 12 trang `/hoang-dao/[slug]` | Mọi cung dùng chung brand-logo.png | 12 ảnh riêng (Aries lửa, Taurus bull...) ≥1200px wide | Thấp |
| OG image cho từng service page (per-page variant) | Đều dùng brand-logo.png | 4 ảnh riêng cho `/xem-tu-vi`, `/xem-tarot`, `/tu-tru-bat-tu`, `/ngay-tot` | Thấp |

**Cách thiết kế OG 1200×630:**
- Figma/Canva → export PNG 1200×630
- Drop vào `apps/web/public/images/og-1200x630.png`
- Update `apps/web/src/app/layout.tsx` `metadata.openGraph.images[0].url` = `/images/og-1200x630.png`, `width: 1200, height: 630`
- Sau khi deploy, vào Facebook Sharing Debugger "Scrape Again" để FB clear cache

### 🔴 Content scaling

| Việc | Lý do | Effort |
|---|---|---|
| **Blog/Article section** (`/blog/[slug]`) với 10-20 bài về tử vi, tarot, phong thủy | Long-tail keyword traffic + backlink magnet. Site hiện chỉ có 8 trang tĩnh + 12 cung — quá ít content cho Google rank cao | Cao (cần content writer) |
| **Per-zodiac article schema sâu hơn**: thêm "compatible signs" (cung hợp/khắc), "monthly forecast" | Increase time-on-page + internal linking | Trung |
| **Schema `Review` + `AggregateRating`** nếu thêm user testimonials | Show stars trong SERP | Cần collect data trước |

### 🟢 Performance & Core Web Vitals

| Metric | Status hiện tại | Target |
|---|---|---|
| LCP (Largest Contentful Paint) | Chưa đo | < 2.5s |
| CLS (Cumulative Layout Shift) | Chưa đo | < 0.1 |
| INP (Interaction to Next Paint) | Chưa đo | < 200ms |

**Test:** https://pagespeed.web.dev/ → nhập `https://luangiaivanmenh.com`

Hiện đã có optimize cơ bản: Next.js Image, font preconnect Google Fonts, lazy-load GA4 qua `@next/third-parties`.

### 🟢 Misc nice-to-have

- `manifest.json` (PWA) — share icon Android home screen
- `<meta name="theme-color">` — Chrome address bar màu brand
- `apple-touch-icon` đã có (`apps/web/src/app/apple-icon.png`) ✅
- Internal linking density — Header/Footer có thể thêm cross-link giữa services
- Schema `Speakable` nếu muốn voice-search

---

## 📋 Playbook: Thêm Page Mới

Khi thêm trang dịch vụ mới (vd: `/phong-thuy-bat-trach`), làm 5 việc sau:

### 1. Tạo `page.tsx` với metadata đầy đủ

```tsx
// apps/web/src/app/<route>/page.tsx
import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { serviceSchema, breadcrumbSchema, faqSchema } from '@/lib/seo-schemas';

export const metadata: Metadata = {
  title: '<Tên trang ngắn>',                  // <60 ký tự
  description: '<Mô tả 150-160 ký tự tiếng Việt, dùng keyword tự nhiên>',
  alternates: { canonical: '/<route>' },      // KHÔNG quên — duplicate canonical = SEO disaster
};

const FAQS = [
  { q: 'Câu hỏi 1?', a: 'Trả lời 1...' },
  // 4-6 Q&A là sweet spot — đủ rich snippet, không spam
];

export default function Page() {
  return (
    <>
      <JsonLd data={serviceSchema({
        name: '<Tên dịch vụ>',
        description: '<Mô tả dài>',
        path: '/<route>',
        serviceType: '<Astrology Reading | BaZi Reading | ...>',
        priceVnd: 5000,                       // nếu có giá; bỏ field nếu free
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

### 2. Update `sitemap.ts`

```tsx
// apps/web/src/app/sitemap.ts
const staticRoutes = [
  { path: '/', priority: 1.0, changeFrequency: 'daily' },
  ...
  { path: '/<route>', priority: 0.9, changeFrequency: 'weekly' },  // ← thêm
];
```

### 3. Update `robots.ts` nếu cần disallow

```tsx
// apps/web/src/app/robots.ts
disallow: [
  '/api/',
  ...
  '/<route>/[id]',   // ← nếu trang có per-user detail page, disallow nó
],
```

### 4. Wire GA4 purchase event (nếu trang có charge tiền)

Trong FE client component:

```tsx
import { trackPurchase, type PurchaseService } from '@/lib/track-purchase';

// Sau khi submit success:
trackPurchase('<your-service-id>', data.chartId);
```

Mở `apps/web/src/lib/track-purchase.ts` add:
- `PurchaseService` type union (thêm `'phong-thuy'`)
- `PRICE_VND['<service>']`
- `ITEM_NAME['<service>']`

### 5. Submit qua IndexNow + Search Console

Sau khi deploy thành công:

```bash
pnpm indexnow   # auto submit toàn bộ sitemap, bao gồm URL mới
```

Vào Google Search Console → URL Inspection → nhập URL mới → **Request indexing**.

---

## 📋 Playbook: Thêm Content File (image, PDF, video)

### Image cho trang (vd: zodiac illustration)

1. **Drop vào** `apps/web/public/images/<slug>.<ext>` (PNG cho transparent, JPG cho photo)
2. **Dimension tối thiểu Google rich result:**
   - Article image: ≥1200px wide, ratio 16:9 hoặc 4:3 hoặc 1:1
   - OG image: 1200×630 (ratio 1.91:1) lý tưởng
3. **Format:** PNG nếu cần transparent / có text crisp; JPG nếu photo nhiều màu (file nhỏ hơn)
4. **Optimization:** chạy https://squoosh.app/ giảm file size, hoặc commit raw rồi để CF auto-optimize

### Pass image vào Article schema

```tsx
<JsonLd data={articleSchema({
  title: '...',
  description: '...',
  path: '/...',
  image: '/images/<slug>.png',   // ← truyền explicit thay vì dùng default brand-logo
})} />
```

### PDF/document file

1. Drop vào `apps/web/public/docs/<name>.pdf`
2. Nếu muốn Google index PDF: thêm link `<a href="/docs/...">` vào page nào đó (Google chỉ index PDF có inbound link)
3. PDF KHÔNG vào sitemap.xml mặc định — chỉ thêm nếu là content quan trọng

---

## 📋 Playbook: Đổi giá dịch vụ

Khi đổi giá (vd: Tử Vi 40k → 50k):

1. **Database:** `UPDATE prices SET amount_vnd = 50000 WHERE action = 'analyze';`
2. **Cache:** 60s sau code tự đọc giá mới (cache trong-process, xem `apps/web/src/lib/wallet.ts:getReadingPriceVnd`)
3. **Schema Service.Offer:** sửa `priceVnd` ở `apps/web/src/app/xem-tu-vi/page.tsx` (vì Service schema hard-code)
4. **GA4 purchase event:** sửa `PRICE_VND` ở `apps/web/src/lib/track-purchase.ts`
5. **Toast UI:** không cần sửa (đọc từ `chargedVnd` server trả)

---

## 🔧 Test commands

```bash
# Verify robots.txt accessible
curl -sI https://luangiaivanmenh.com/robots.txt

# Verify sitemap.xml accessible + đúng số URL
curl -s https://luangiaivanmenh.com/sitemap.xml | grep -c '<loc>'

# Submit URLs tới Bing + Yandex
pnpm indexnow

# Extract JSON-LD từ HTML response để verify schema
curl -s https://luangiaivanmenh.com/xem-tu-vi | grep -oE 'application/ld\+json">{[^<]+'

# Verify OG image accessible
curl -sI https://luangiaivanmenh.com/images/brand-logo.png

# Verify GA4 fires
# F12 → Network → filter: google-analytics.com → load page → check request có `tid=G-1C36RSE64M`
```

## 📖 Related Docs

- **[SEO-REQUEST-INDEXING.md](./SEO-REQUEST-INDEXING.md)** — Hướng dẫn step-by-step Request indexing trên Google Search Console + Bing Webmaster
- **`.claude/skills/seo-add-page/SKILL.md`** — Playbook thêm page mới
- **`.claude/skills/seo-change-price/SKILL.md`** — Đổi giá dịch vụ
- **`.claude/skills/seo-audit/SKILL.md`** — Audit SEO health

## 🔗 External Tools

- **Google Search Console:** https://search.google.com/search-console
- **Google Rich Result Test:** https://search.google.com/test/rich-results
- **Google PageSpeed:** https://pagespeed.web.dev/
- **Bing Webmaster:** https://www.bing.com/webmasters
- **Facebook Sharing Debugger:** https://developers.facebook.com/tools/debug/
- **Twitter Card Validator:** https://cards-dev.twitter.com/validator
- **LinkedIn Post Inspector:** https://www.linkedin.com/post-inspector/
- **Schema.org Validator:** https://validator.schema.org/
- **GA4 Dashboard:** https://analytics.google.com/ (Property: Luangiaivanmenh.com `G-1C36RSE64M`)

---

## 🚨 SEO Anti-patterns — KHÔNG làm

1. **Duplicate canonical URL** giữa 2 page khác nhau → Google de-rank cả 2. Mỗi `page.tsx` PHẢI có `alternates.canonical` riêng.
2. **Disallow `/` trong robots.txt** dù chỉ tạm thời → toàn bộ site mất khỏi index. Test kỹ trước khi merge bất kỳ thay đổi `robots.ts`.
3. **noindex meta tag** ở trang content → tương đương ẩn page khỏi Google.
4. **Render content qua client JS only** với SPA mode → Googlebot khó crawl. Site hiện dùng SSR Next.js — đừng convert sang CSR.
5. **Auto-redirect HTTPS → HTTP** hay www ↔ non-www không nhất quán → Google không biết canonical version, split link juice.
6. **OG image < 600×315** → Facebook/Twitter từ chối show preview.
7. **JSON-LD trong client component** (sau hydration) → Googlebot chưa thấy schema khi crawl HTML đầu. PHẢI render trong server component (page.tsx) qua `<JsonLd>`.
8. **Service schema bị mất `priceCurrency`** → Google reject Offer schema. Luôn pair `price` + `priceCurrency: 'VND'`.

---

## 📊 Monitoring

**Hàng tuần:**
- GA4 → Reports → Acquisition → Traffic source ratio
- GSC → Performance → Total clicks/impressions/CTR trend
- GSC → Indexing → kiểm tra có URL nào bị "Excluded" / "Crawled but not indexed"

**Hàng tháng:**
- Rich Result Test lại 1-2 trang để verify schema còn valid (Google đôi khi cập nhật schema spec)
- PageSpeed Insights kiểm tra Core Web Vitals
- Backlink check qua Bing Webmaster (free) — nếu thấy backlink từ site spam, disavow

**Khi deploy code:**
- Sau mỗi deploy có thay đổi URL/sitemap → chạy `pnpm indexnow` để Bing+Yandex tự crawl
- Nếu thêm trang mới → vào GSC URL Inspection → Request indexing
