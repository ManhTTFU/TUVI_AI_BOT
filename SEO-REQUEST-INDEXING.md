# Request Indexing — Hướng dẫn manual cho Google + Bing

> Cách bảo search engine "crawl URL này NGAY" thay vì đợi periodic re-fetch (3-7 ngày).
> Dùng sau khi: deploy page mới, sửa content lớn, fix bug SEO.

## Khi nào dùng

✅ **Nên Request indexing:**
- Page mới deploy → muốn Google/Bing biết NGAY
- Page cũ vừa update content lớn (thêm FAQ, đổi giá, redesign)
- Vừa fix bug SEO (canonical sai, schema invalid) → confirm search engine thấy bản fix

❌ **Không nên Request indexing:**
- Page mới deploy < 10 phút (CDN chưa propagate → Live test có thể fail)
- Spam cùng URL nhiều lần (không tăng priority, có thể bị ban quota)
- Page chưa đủ "tốt" để được rank cao (Request indexing chỉ trigger crawl, không nâng rank)

---

## Google Search Console (GSC) — 7 bước

### Bước 1 — Mở GSC

URL: https://search.google.com/search-console

Đăng nhập bằng Google account đã verify property `luangiaivanmenh.com`.

### Bước 2 — Chọn property

Dropdown góc trên bên trái → chọn `https://luangiaivanmenh.com`.

### Bước 3 — Mở URL Inspection

2 cách:

**Cách A (nhanh):** Click ô search lớn trên top bar (icon kính lúp 🔍) → paste URL → Enter

**Cách B:** Sidebar trái → mục **"URL Inspection"** → click → paste URL → Enter

URL paste FULL với `https://`:
```
https://luangiaivanmenh.com/<route-moi>
```

### Bước 4 — Đợi Google check (~10-30s)

Google check URL có trong index chưa. 2 trường hợp:

**A. URL chưa được index:**
```
URL is not on Google
```
hoặc tiếng Việt:
```
URL không có trên Google
```
→ Đúng kỳ vọng, tiếp Bước 5.

**B. URL đã index:**
```
URL is on Google
```
→ Vẫn có thể Request indexing để re-crawl phiên bản mới (vd: page có content update).

### Bước 5 — Click "Request indexing"

Button **"Request indexing"** ở giữa trang (icon mũi tên cong + chữ).

Google chạy **Live test** (~30-60s):
- Check `robots.txt` cho phép crawl không
- Check URL trả HTTP 200 không
- Check page có `noindex` meta không
- Check structured data có valid không

### Bước 6 — Confirm message

Sau Live test pass:

```
Indexing requested
URL added to a priority crawl queue. Submitting a page multiple times
will not change its queue position or priority. Visit URL Inspection
in a few hours/days.
```

hoặc:

```
Đã yêu cầu lập chỉ mục
URL đã được thêm vào hàng đợi thu thập dữ liệu ưu tiên...
```

→ Google ưu tiên crawl trong **24-72h** (không instant).

### Bước 7 — Verify sau 1-3 ngày

Quay lại URL Inspection cùng URL. Nếu thấy:
```
URL is on Google
```
→ Đã index thành công. Verify trong SERP:
```
site:luangiaivanmenh.com/<route>
```
trong Google search box. URL hiện ra = OK.

---

## Bing Webmaster Tools — process tương đương

URL: https://www.bing.com/webmasters

1. Sign in → chọn property `luangiaivanmenh.com`
2. Sidebar → **URL Inspection**
3. Paste URL full HTTPS → **Inspect**
4. Tab **"Live URL"** → check site accessible
5. Button **"Request indexing"** → confirm

**Khác Google:**
- Bing quota cao hơn (~10000 URL/ngày)
- Bing có thể tự pull qua IndexNow API → ưu tiên dùng `pnpm indexnow` (bulk submit cả sitemap, không phải click từng URL)

---

## Quota & limit

| Engine | Quota Request indexing | Bulk alternative |
|---|---|---|
| Google Search Console | ~10 URL/property/ngày | Không có. Phải submit từng URL manual |
| Bing Webmaster | ~10000 URL/property/ngày | IndexNow API (1 call submit 20 URL) |
| Yandex Webmaster | ~30 URL/ngày | IndexNow API |

→ Nếu deploy 1 batch nhiều URL (vd: thêm 10 blog post cùng lúc), ưu tiên:
- **IndexNow** (`pnpm indexnow`) cho Bing + Yandex — bulk 20 URL/call
- **GSC** chỉ Request indexing 1-2 URL quan trọng nhất

---

## Lỗi thường gặp & fix

### ❌ "URL is not available to Google"

**Nguyên nhân:** robots.txt block, page redirect lạ, hoặc 4xx/5xx response.

**Fix:**
1. Check robots.txt: `curl -s https://luangiaivanmenh.com/robots.txt`
2. Check page HTTP status: `curl -sI https://luangiaivanmenh.com/<route>`
3. Nếu redirect: verify chain redirect không quá 2 hop, không loop
4. Chạy skill `seo-audit` để check toàn bộ SEO state

### ❌ "Indexing request rejected — quota exceeded"

**Nguyên nhân:** GSC giới hạn ~10 Request indexing/property/ngày.

**Workaround:**
- Đợi 24h → reset quota
- Dùng IndexNow (`pnpm indexnow`) cho Bing trong lúc chờ
- Quota share toàn property, ưu tiên URL quan trọng nhất

### ❌ "Submitted URL has crawl issue"

**Nguyên nhân:** Page render lỗi, structured data invalid, hoặc JavaScript fail.

**Fix:**
1. Click **"Test live URL"** trong GSC
2. Sau Live test → click **"View tested page"** → tab **"Screenshot"** xem Google render gì
3. Tab **"More info"** → **"JavaScript console messages"** → xem error
4. Common issue: client-side rendering quá nặng → Google timeout. Fix: move content sang SSR.

### ❌ Page index nhưng không xuất hiện trong SERP sau 7 ngày

**Nguyên nhân:** Index ≠ rank. Google judge content kém → không show ranking cao.

**KHÔNG fix bằng Request indexing thêm.** Improve content:
- Tăng độ sâu nội dung (>500 từ, structure rõ với H2/H3)
- Thêm FAQ schema (đã có helper `faqSchema()`)
- Internal link từ trang khác trỏ vào
- Build backlink từ site khác (off-page SEO)

---

## Workflow chuẩn sau deploy

Mỗi lần deploy có URL mới:

```
1. Code commit + push → CF Workers Builds tự deploy (~3-5 phút)
   │
2. Verify deploy: curl -sI https://luangiaivanmenh.com/<route> → HTTP 200
   │
3. Submit IndexNow (Bing + Yandex): pnpm indexnow
   │
4. GSC Request indexing (Google) — chỉ 1-2 URL quan trọng nhất
   │
5. (Optional) Bing Webmaster Request indexing — backup nếu IndexNow chưa pickup
   │
6. Sau 24-72h: verify qua "site:luangiaivanmenh.com/<route>" trong Google search
```

Bị động không action gì: Google + Bing sẽ crawl trong **3-7 ngày** qua periodic re-fetch sitemap.

---

## Reference

- **SEO Checklist toàn site:** [`SEO-CHECKLIST.md`](./SEO-CHECKLIST.md)
- **Skill add page mới:** `.claude/skills/seo-add-page/SKILL.md` (Bước 5)
- **Skill audit SEO:** `.claude/skills/seo-audit/SKILL.md`
- **Google docs:** https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
- **Bing docs:** https://www.bing.com/webmasters/help/url-inspection-9bcd6c8f
