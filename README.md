# Diễn Cầm Tam Thế — Tử Vi Đẩu Số AI

Hệ thống xem Tử Vi Đẩu Số bằng AI cá nhân hoá, kèm ví/đăng ký gói PRO.

- **apps/web** — Next.js 14 App Router (port 3100), tất cả route user-facing + API auth/wallet/admin/tuvi.
- **apps/api** — Express (port 4100, legacy, vẫn chạy nhưng FE không gọi nữa).
- **packages/db** — Drizzle ORM + Postgres schema, migrations, promote-admin CLI.
- **packages/ai** — Deepseek client + 6-section prompt + parallel + p-limit + retry.
- **packages/astrology** — Wrapper iztro → ChartData chuẩn hoá.
- **packages/core** — types, slug, label tiếng Việt.
- **packages/pdf** — PDFKit + Noto Sans.
- **packages/lichvannien** — Lịch âm Hồ Ngọc Đức + can chi + hoàng đạo.

---

## 1. Yêu cầu

- Node.js ≥ 20
- pnpm (`corepack enable`)
- Tài khoản Neon (Postgres free) — https://neon.tech
- Tài khoản Google Cloud (OAuth) — https://console.cloud.google.com
- Tài khoản Facebook Developer (OAuth) — https://developers.facebook.com (tuỳ chọn)
- API key Deepseek — https://platform.deepseek.com

---

## 2. Cài đặt nhanh

```bash
pnpm install               # cài deps + auto download Noto Sans
cp .env.example .env       # copy template env
# → điền các giá trị theo các section dưới đây
pnpm --filter @tuvi/db migrate   # tạo schema + seed 4 gói PRO
pnpm dev                   # chạy api (4100) + web (3100)
```

Sau khi đăng nhập lần đầu qua Google/Facebook, promote tài khoản đầu tiên thành admin:

```bash
cd packages/db
pnpm exec tsx --env-file=../../.env src/promote-admin.ts your-email@gmail.com
```

---

## 3. Setup Neon (Postgres database)

1. Đăng ký tài khoản tại https://neon.tech
2. Tạo project mới:
   - **Region**: AWS Asia Pacific (Singapore) — gần VN, latency ~30-50ms
   - **Postgres version**: 17 (mặc định)
3. Sau khi tạo, copy **Connection string** ở mục "Connect your app manually"
4. Paste vào `.env`:
   ```env
   DATABASE_URL=postgresql://neondb_owner:<password>@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   DB_POOL_MAX=10
   ```
5. Chạy migration:
   ```bash
   pnpm --filter @tuvi/db migrate
   ```
   Sẽ tạo 12 bảng + seed 4 gói (monthly 20k / semi_annual 50k / annual 100k / lifetime 500k).

---

## 4. Setup Google OAuth login

### 4.1 Dev (localhost)

1. Vào https://console.cloud.google.com (đăng nhập tài khoản Google còn hoạt động — KHÔNG dùng account đã bị suspend).

2. **Tạo project mới**:
   - Dropdown chọn project góc trên → **New Project**
   - Tên: `TUVI` (hoặc gì cũng được) → **Create**

3. **OAuth consent screen** (lần đầu mới cần):
   - Menu trái → **APIs & Services** → **OAuth consent screen**
   - User type: **External** → **Create**
   - Điền:
     - App name: `Diễn Cầm Tam Thế`
     - User support email: email của bạn
     - Developer contact email: email của bạn
   - Bấm **Save and Continue** qua các bước Scopes / Test users (skip mặc định) → **Back to Dashboard**

4. **Tạo OAuth Client ID**:
   - Menu trái → **APIs & Services** → **Credentials**
   - **+ CREATE CREDENTIALS** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `TUVI Web`
   - **Authorized JavaScript origins** — Add URI:
     ```
     http://localhost:3100
     ```
   - **Authorized redirect URIs** — Add URI:
     ```
     http://localhost:3100/api/auth/callback/google
     ```
   - Bấm **CREATE**

5. **Lưu credentials vào `.env`**:
   ```env
   GOOGLE_CLIENT_ID=741527513075-xxxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxx
   ```
   **Lưu ý**: Client ID đầy đủ ~72 ký tự, kết thúc bằng `.apps.googleusercontent.com`. Đảm bảo paste TOÀN BỘ, không bị cắt cụt.

6. Restart web để load env mới: `Ctrl+C` rồi `pnpm dev:web`.

### 4.2 Production

Khi deploy lên domain thật (vd `https://diencam.vn`):

1. Vào lại Google Cloud Console → **APIs & Services** → **Credentials** → click OAuth Client ID đã tạo → **Edit**.

2. **Thêm** (KHÔNG xoá localhost — giữ để dev vẫn dùng được):
   - **Authorized JavaScript origins**:
     ```
     https://diencam.vn
     ```
   - **Authorized redirect URIs**:
     ```
     https://diencam.vn/api/auth/callback/google
     ```

3. **Bấm SAVE.**

4. Trong production env (vd Vercel Environment Variables):
   ```env
   NEXTAUTH_URL=https://diencam.vn
   GOOGLE_CLIENT_ID=<giống dev>
   GOOGLE_CLIENT_SECRET=<giống dev>
   ```

5. **Publish OAuth consent screen** (nếu chưa):
   - Vào **OAuth consent screen** → trạng thái **Testing** → bấm **PUBLISH APP** → confirm.
   - Sau khi publish, bất kỳ user Google nào cũng login được (không cần thêm test users).
   - Với app chỉ dùng default scopes (`profile`, `email`, `openid`) → KHÔNG cần Google verification, có thể publish ngay.

---

## 5. Setup Facebook OAuth login (tuỳ chọn)

### 5.1 Dev (localhost)

1. Vào https://developers.facebook.com/apps → **Create App**.

2. **Use case**: chọn **"Authenticate and request data from users with Facebook Login"** → **Next**.

3. **App type**: **Consumer** → **Next**.

4. **App details**:
   - Name: `Diễn Cầm Tam Thế`
   - Contact email: email Facebook của bạn
   - → **Create app** (có thể yêu cầu xác nhận password FB)

5. **Bỏ qua các yêu cầu production** (Xác minh doanh nghiệp, Xét duyệt ứng dụng, App Review) — chỉ cần cho production, không bắt buộc lúc dev.

6. **Lấy App credentials**:
   - Sidebar trái → **App settings** → **Basic**
   - Copy **App ID** (~16 chữ số)
   - **App secret**: bấm **Show** → nhập lại password FB → copy

7. **Set OAuth redirect URI**:
   - Sidebar trái → **Use cases** → click vào use case "Authenticate and request data..." → **Customize**
   - Tab/section **Settings** trong use case → tìm field **"Valid OAuth Redirect URIs"**
   - **Lưu ý**: Trong dev mode, Facebook tự động cho phép `http://localhost` mà không cần thêm. Có thể paste:
     ```
     http://localhost:3100/api/auth/callback/facebook
     ```
   - Đảm bảo các toggle ON:
     - ✓ **Client OAuth Login**
     - ✓ **Web OAuth Login**
     - ✗ Force HTTPS (OFF cho localhost)
   - **Save Changes**

8. **Lưu credentials vào `.env`**:
   ```env
   FACEBOOK_CLIENT_ID=<App ID>
   FACEBOOK_CLIENT_SECRET=<App Secret>
   ```

9. Restart web.

10. **Test login** với tài khoản Facebook chính chủ developer (owner của app). Account khác phải được add vào **App roles** (admin/dev/tester) mới login được trong dev mode.

### 5.2 Production

Khi deploy lên domain thật, để **bất kỳ user Facebook nào** cũng login được, phải switch app sang **Live mode**. Yêu cầu:

1. **Thêm production redirect URI** vào use case Xác thực → Settings → Valid OAuth Redirect URIs (giữ cả localhost):
   ```
   https://diencam.vn/api/auth/callback/facebook
   ```

2. **App settings → Basic** điền 4 field bắt buộc cho Live mode:
   - **App Icon**: upload file PNG 1024×1024
   - **Privacy Policy URL**: `https://diencam.vn/chinh-sach-bao-mat` (đã có sẵn route trong codebase)
   - **User Data Deletion**: chọn "Data Deletion Instructions URL" → `https://diencam.vn/xoa-du-lieu` (đã có)
   - **Category**: chọn 1 (vd "Lifestyle" hoặc "Education")

3. **Switch Live mode**:
   - Header app dashboard → toggle **"In Development"** → **"Live"** → confirm.

4. **Permissions** (default scopes không cần app review):
   - `public_profile` + `email` — Standard Access, hoạt động ngay khi Live.
   - Nếu cần permissions cao cấp hơn (Pages, Ads, Business...) → cần submit App Review + Business Verification (cần giấy phép kinh doanh).

5. **Production env**:
   ```env
   FACEBOOK_CLIENT_ID=<giống dev>
   FACEBOOK_CLIENT_SECRET=<giống dev>
   ```

**Note**: Auth.js v5 trong `apps/web/src/auth.ts` đã set explicit `scope: 'public_profile,email'`. KHÔNG đổi sang advanced scopes nếu chưa có Business Verification.

---

## 6. Setup Auth.js (NextAuth v5)

Sinh `AUTH_SECRET` (random 32 bytes base64):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Paste vào `.env`:

```env
AUTH_SECRET=<paste output>
NEXTAUTH_URL=http://localhost:3100         # production: https://diencam.vn
```

`NEXTAUTH_URL` BẮT BUỘC khi deploy production để callback OAuth hoạt động đúng.

---

## 7. Cấu hình env đầy đủ

Xem `.env.example` cho template đầy đủ. Tóm tắt nhóm env:

| Nhóm | Biến |
|---|---|
| AI | `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `DEEPSEEK_MODEL`, `AI_CONCURRENCY` |
| Database | `DATABASE_URL`, `DB_POOL_MAX` |
| Auth | `AUTH_SECRET`, `NEXTAUTH_URL` |
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Facebook OAuth | `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` |
| Email magic link (tuỳ chọn) | `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`, `EMAIL_FROM` |
| Casso (off mặc định) | `CASSO_ENABLED`, `CASSO_API_KEY`, `CASSO_WEBHOOK_SECRET` |
| API + Web | `API_PORT`, `API_BASE_URL`, `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SITE_URL`, `OUTPUT_DIR` |

**Lưu ý kỹ thuật**: `apps/web/next.config.js` tự load root `.env` qua `dotenv.config()` — không cần duplicate biến vào `apps/web/.env.local`.

---

## 8. Chạy dev

```bash
pnpm dev          # api + web parallel
# hoặc 2 terminal riêng:
pnpm dev:api      # http://localhost:4100
pnpm dev:web      # http://localhost:3100
```

Mỗi lần đổi `.env`, phải Ctrl+C + restart (tsx + Next.js không hot-reload env vars).

---

## 9. Gói PRO và payment flow

### Gói (seeded sẵn trong DB)

| Gói | Giá | Thời hạn |
|---|---|---|
| Tháng | 20.000đ | 30 ngày |
| Nửa năm | 50.000đ | 180 ngày |
| Năm | 100.000đ | 365 ngày |
| Trọn đời | 500.000đ | ∞ |

### Flow nạp gói

1. User vào `/vi-cua-toi` → chọn gói → tạo lệnh → server sinh **bankRef** (`VTV12K3X7`).
2. User chuyển khoản theo QR + thông tin bank do admin cấu hình.
3. Admin vào `/admin/transactions` → bấm **Duyệt** giao dịch pending.
4. Server atomic: extend `users.pro_until` theo `duration_days` của gói + insert `subscription_purchases` + publish SSE event.
5. User tab nhận SSE realtime → navbar update `NORMAL` → `PRO · 30d` ngay.

Admin có thể **tặng gói** miễn phí qua `/admin/users` → "Tặng gói" modal (amount=0, type=`admin_extend`).

---

## 10. Admin setup lần đầu

1. **Login** lần đầu qua Google/Facebook trên `/dang-nhap`.

2. **Promote admin** qua CLI:
   ```bash
   cd packages/db
   pnpm exec tsx --env-file=../../.env src/promote-admin.ts your-email@gmail.com
   ```

3. **Reload** trang để session refresh → header xuất hiện badge "ADMIN" + 2 link đỏ trong dropdown.

4. **Cấu hình bank** ở `/admin/bank-config`:
   - Tên ngân hàng, số tài khoản, chủ TK
   - Upload ảnh QR (PNG/JPG <500KB)
   - Prefix bank ref (mặc định `VTV`)

5. **Test full flow**: nạp gói → duyệt → xem realtime PRO update.

---

## 11. Deploy production (đề xuất stack)

| Service | Hosting |
|---|---|
| Next.js | Vercel (free tier) |
| Postgres | Neon (free 0.5GB → đủ vài ngàn user) |
| Domain | tuỳ chọn — Cloudflare/Namecheap |
| QR upload | Vercel Blob hoặc Cloudflare R2 |
| Error tracking | Sentry (free 5k events/tháng) |

Sau deploy, cập nhật:
- `NEXTAUTH_URL` → URL production
- Google OAuth → add production redirect URI
- Facebook → switch Live mode (xem section 5.2)
- Vercel env vars (giống `.env` nhưng KHÔNG check vào git)

---

## 12. Endpoints chính

**Auth.js** (`apps/web/src/app/api/auth/*`)
- `GET|POST /api/auth/*` — signin/signout/callback/session

**Tử Vi** (auth required)
- `POST /api/tuvi/submit` — kiểm tier PRO + tính chart + lưu DB
- `POST /api/tuvi/<chartId>/analyze` — AI luận 6 phần (cache theo birthHash)
- `POST /api/tuvi/<chartId>/deep-readings` — AI luận đại hạn + 12 cung + năm hiện tại (cache theo `(birthHash, year)`)

**Wallet**
- `POST /api/wallet/topup-request` — tạo lệnh mua gói
- `GET /api/wallet/transactions` — lịch sử
- `GET /api/wallet/stream` — SSE realtime balance/subscription

**Admin** (role=admin)
- `POST /api/admin/credit` — cộng/trừ tiền (legacy balance)
- `POST /api/admin/users/extend` — tặng gói PRO
- `POST /api/admin/users/role` — toggle admin
- `POST /api/admin/transactions/approve` — duyệt mua gói
- `POST /api/admin/transactions/reject`
- `POST /api/admin/bank-config` — set thông tin bank
- `POST /api/admin/bank-config/upload-qr` — upload QR image

**Casso** (off)
- `POST /api/casso/webhook` — auto reconcile (set `CASSO_ENABLED=true` để bật)

---

## 13. Cấu trúc

```
TUVIAI/
├── apps/
│   ├── api/                  # Express legacy (port 4100)
│   └── web/                  # Next.js 14 (port 3100) — primary
│       └── src/app/
│           ├── api/          # All API routes
│           ├── admin/        # Admin pages (users/transactions/bank-config)
│           ├── dang-nhap/    # Login page
│           ├── vi-cua-toi/   # Wallet + plan picker
│           ├── lich-su/      # Chart history per user
│           ├── xem-tu-vi/    # Submit form (PRO required)
│           └── tu-vi/[slug]/ # SSR chart detail
├── packages/
│   ├── core/                 # types, slug, labels VN
│   ├── astrology/            # iztro wrapper
│   ├── ai/                   # Deepseek + parallel + p-limit + retry
│   ├── pdf/                  # PDFKit
│   ├── lichvannien/          # Lịch âm Hồ Ngọc Đức
│   └── db/                   # Drizzle schema + migrations
├── fonts/                    # Noto Sans
├── output/                   # Legacy filesystem cache (deprecated)
└── .env                      # Root env (loaded by both api + web)
```

---

## 14. Troubleshooting

| Vấn đề | Cách fix |
|---|---|
| `MissingCSRF` khi click Google/Facebook | Đã dùng client-side `signIn()` từ `next-auth/react` — không gọi từ server action |
| Google `OAuth client was not found` 401 | Client ID bị cắt cụt trong `.env`. Phải là 72 ký tự, kết thúc `.apps.googleusercontent.com` |
| Facebook "Invalid Scopes: email" | Warning chỉ với developer, không block. Đã set explicit `scope: 'public_profile,email'` trong auth.ts |
| Web không load env mới | Restart `pnpm dev:web` — Next.js không hot-reload env |
| Realtime balance không update | Đã có SSE + refetchInterval 60s + refetchOnWindowFocus. Nếu vẫn không update → check `/api/wallet/stream` connection trong DevTools Network |
| `EADDRINUSE` port 3100/4100 | `taskkill /F /PID <pid>` (Windows) — find PID qua `netstat -ano \| findstr :3100` |
| Migration `pgcrypto already exists` | Bình thường, idempotent — bỏ qua warning |

---

## 15. Memory files (Claude Code)

- `.claude/memory/decisions.md` — decision log (lý do business logic)
- `.claude/memory/patterns.md` — quy ước kỹ thuật đã chốt
- `.claude/memory/bugs-solved.md` — bug history
- `.claude/memory/session-log.md` — nhật ký session (gõ `/log`)

Slash commands:
- `/decide <quyết định>` — ghi decision log
- `/log` — cập nhật session log
- `/why <câu hỏi>` — tra decision log + git history
