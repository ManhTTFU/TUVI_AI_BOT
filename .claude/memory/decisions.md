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

**Date:** 2026-05-18
**Module:** web (realtime push)
**File:** apps/web/src/lib/realtime-server.ts (mới), apps/web/src/lib/realtime-client.ts (mới), apps/web/src/components/providers/WalletRealtimeBridge.tsx (mới), apps/web/src/lib/wallet.ts, apps/web/src/auth.ts, apps/web/src/components/providers/AuthProvider.tsx, .env, apps/web/.env.local, apps/web/wrangler.jsonc
**Decision:** Thay polling/optimistic-only bằng **Supabase Realtime Broadcast** làm pub/sub bus push balance cross-tab + cross-device. Neon vẫn là source of truth duy nhất; Supabase KHÔNG lưu data, chỉ làm WebSocket fan-out stateless.
**Reason:** (1) SSE thật KHÔNG hoạt động trên Cloudflare Workers (mỗi request có thể vào isolate khác, in-process pub/sub `Map<userId, Set<Response>>` không share state). Đã thử + xoá `/api/wallet/stream` từ trước. (2) Polling `/api/wallet/balance` không tiện cho admin approve topup khi user đang mở trang khác — user không biết để F5. (3) Durable Objects giải pháp native nhưng tăng chi phí $5 base + DO complexity; Supabase free tier (200 concurrent, 2M msg/tháng) phủ MVP miễn phí. (4) Migrate Neon → Supabase Postgres tốn migration step + lock-in DB; chỉ thêm Supabase Realtime giữ Neon nguyên = risk thấp nhất.

Architecture:
- Server: `publishWalletEvent(userId, payload)` ở `realtime-server.ts` gọi `supabase.channel(name).send({type:'broadcast'})`. Wire vào trong `chargeReading`/`creditBalance`/`debitBalance` (wallet.ts) — KHÔNG add publish call thủ công vào route. Mọi tương lai route gọi 3 hàm này tự động có push.
- Client: 1 bridge component `WalletRealtimeBridge` mount inside `SessionProvider`, subscribe channel từ `session.user.walletChannel`, dispatch event vào local `wallet-sse.ts` bus → `UserMenu`/`WalletClient` (đã subscribe) update UI mà không phải thay đổi.
- Channel name = `wallet:` + HMAC-SHA256(userId, WALLET_REALTIME_SECRET).slice(0,16) — không enumerate được dù anon key public. HMAC compute trong `walletChannelFor()` ở `realtime-server.ts`, expose qua session callback (`session.user.walletChannel`) để client nhận sẵn.
- Failure mode: publish lỗi → swallow log. Source-of-truth ở Neon, F5 / navigate / `GET /api/wallet/balance` đều correct. Realtime chỉ là UX layer.

**Rejected alternatives:**
1. **Cloudflare Durable Objects:** native nhất, không phụ thuộc service ngoài, nhưng +$5/tháng + DO class + binding + deploy flow phức tạp hơn. Để dành cho khi có feature cần persistent state (chat, live collab).
2. **Polling `/api/wallet/balance` mỗi 10s khi tab focus:** cheap nhưng tốn DB hit + không catch event sub-10s. Chấp nhận được nhưng UX không "tức thời" như push.
3. **Migrate Neon → Supabase Postgres + dùng "Postgres Changes" listener:** đập tốn migration nhiều bảng, vendor lock-in DB. Không có lợi ích đáng kể so với Broadcast.
4. **Channel name = plain userId:** anon key public → ai có anon key + user id có thể subscribe balance event. HMAC + secret server giải được mà chỉ 5 dòng code.
5. **Publish call thủ công ở từng route (5+ chỗ):** dễ quên khi thêm flow mới (vd: admin tool, batch credit). Wrap vào wallet.ts = 1 điểm thay đổi cho mọi mutation tương lai.
6. **Bỏ in-tab optimistic `emitOptimisticBalance` (chỉ dùng Supabase):** trade-off 200-500ms delay sau action vì roundtrip server→Supabase→browser. Giữ optimistic + Supabase chồng lên (state idempotent, setState same value không re-render).

Cost: free tier Supabase Pro (200 concurrent connection, 2M message/tháng) thừa cho MVP. Risk: prod cần > 200 user online cùng lúc — bump $25/tháng Pro = 500 concurrent.

Key rò rỉ: `SUPABASE_SERVICE_ROLE_KEY` đã paste qua chat → backlog P0 rotate trước khi deploy prod (xem `backlog.md`).

---

**Date:** 2026-05-14
**Module:** db + web (full-stack billing refactor)
**File:** packages/db/migrations/0008_wallet_pay_per_use.sql, packages/db/src/schema.ts, packages/db/src/migrate.ts, apps/web/src/lib/wallet.ts (mới), apps/web/src/auth.ts, apps/web/src/app/api/wallet/topup-request/route.ts, apps/web/src/app/api/admin/transactions/approve/route.ts, apps/web/src/app/api/{tuvi,tu-tru,tarot}/submit/route.ts, apps/web/src/app/api/horoscope/personalize/route.ts, apps/web/src/app/vi-cua-toi/*, apps/web/src/components/layout/UserMenu.tsx, apps/web/src/components/{tu-vi,tu-tru,hoang-dao}/*Client.tsx, apps/web/src/app/{xem-tarot,hoang-dao/luan-giai}/*Client.tsx, apps/web/src/app/admin/users/*, apps/web/src/lib/casso.ts, apps/web/src/lib/wallet-sse.ts; **xoá** apps/web/src/lib/tier.ts
**Decision:** Bỏ hoàn toàn model subscription PRO/NORMAL (monthly/semi_annual/annual/lifetime) đã chạy từ migration 0001, chuyển sang model wallet pay-per-use: user nạp tối thiểu 20k, mỗi lần luận giải (Tử Vi / Tứ Trụ / Tarot / Hoàng Đạo cá nhân hóa) trừ 5k, real-time qua SSE.
**Reason:** (1) User yêu cầu — model subscription tier không hợp với hành vi tiêu dùng "thỉnh thoảng xem 1 lá số". (2) Pay-per-use minh bạch: user thấy mỗi action trừ bao nhiêu, không lo "không dùng hết gói". (3) Casso reconcile đơn giản hơn — match bankRef + số tiền → cộng balance, không phải match plan.

Architecture:
- `users.balance_vnd bigint NOT NULL DEFAULT 0` — cache denormalized của ledger. Backfill migration 0008 từ SUM(transactions completed) loại topup/admin_credit/refund/charge. **Subscription txs cũ KHÔNG cộng vào balance** vì đã "tiêu" sang proUntil — coi như sunk cost.
- Source of truth vẫn là `transactions` table. Mọi mutation balance đi qua `chargeReading()` / `creditBalance()` / `debitBalance()` ở `apps/web/src/lib/wallet.ts`. Atomic: `UPDATE ... WHERE balance >= price RETURNING balance` → check + deduct trong 1 SQL statement, chống race 2 request concurrent đồng thời (chỉ user vừa đủ tiền với 1 charge mới deduct được, request 2 throws InsufficientBalanceError).
- Drop tables: `subscription_plans`, `subscription_purchases`. Drop column `users.pro_until`. Drop enum type `plan`. **GIỮ** enum values `'subscription'` và `'admin_extend'` trong `tx_type` vì Postgres không drop được value khi còn row dùng (history txs từ user trả gói cũ vẫn cần audit).
- Bảng `prices` repurposed: 1 row `action='analyze'` = 5000đ. Code đọc qua `getReadingPriceVnd()` với cache in-process 60s — admin có thể UPDATE bảng để đổi giá runtime mà không redeploy.
- Session payload: bỏ `proUntil` + `tier`, thay bằng `balanceVnd`. Auth.js v5 callback đọc DB mỗi request nên balance trong session luôn fresh (chỉ stale tới khi reload session — SSE bù real-time delta).
- SSE event: bỏ `'subscription'`, dùng `'balance'` với payload `{balanceVnd, delta, reason, service?}`. Reason ∈ topup | admin_credit | refund | charge | admin_debit.
- FE: header (`UserMenu`) hiển thị số dư realtime, đỏ khi < 5k với CTA "Nạp ngay". Wallet page (`/vi-cua-toi`) thay plan picker bằng custom amount input + 6 chip preset (20k/50k/100k/200k/500k/1M). Mọi submit form (Tử Vi / Tứ Trụ / Tarot / Hoàng Đạo) handle 402 INSUFFICIENT_BALANCE thay vì PRO_REQUIRED.
- Admin: `extend` rename ý nghĩa thành "cộng tiền VND tùy ý", `revoke-pro` rename thành "trừ tiền VND". Endpoint URL giữ nguyên để khỏi đổi FE/script cũ; FE label đổi sang "Cộng tiền" / "Trừ tiền". UsersClient table show số dư thay vì proUntil days.
- Tu-Tru `/analyze` route: bỏ PRO check, không charge nữa — đã charge ở `/submit`. Endpoint giờ chỉ là "lấy luận giải cho chart đã tồn tại của tôi". Tu-Vi `/analyze` + `/deep-readings` đã không gate PRO sẵn nên không sửa.
- Charge `service` tag: `'tu-vi' | 'tu-tru' | 'tarot' | 'hoang-dao'` — lưu trong tx.metadata.service để hiển thị lịch sử "Luận giải Tử Vi" / "Luận giải Tarot" thay vì generic "Trừ phí".

**Rejected alternatives:**
1. **Per-view charge thay per-submit:** Charge mỗi lần user mở lại lá số trong `/lich-su`. Loại bỏ vì user sẽ tránh xem lại → mâu thuẫn với việc đã trả tiền. Per-submit (1 lần / lá số mới) = mua data lần đầu, xem lại miễn phí — match expectation.
2. **Cache miss → charge, cache hit → free:** Tránh "user khác cùng birth-hash xem ké free". Loại bỏ vì FE/UX: user không cần biết tech detail cache, payment phải deterministic. Cache vẫn share cross-user cho AI efficiency (giảm Deepseek call), nhưng billing per-user per-submit.
3. **Giữ subscription làm option song song:** User mua PRO unlimited HOẶC pay-per-use. Loại bỏ vì product complexity tăng (2 model, 2 gating logic, double FE branches). MVP đơn giản.
4. **Drop tx enum values 'subscription' và 'admin_extend':** Postgres không hỗ trợ `DROP VALUE` khi còn row dùng. Force-drop sẽ mất history audit. Giữ làm "frozen" enum value — code không tạo mới nhưng đọc được history.
5. **Backfill balance từ unused proUntil:** Tính "ngày PRO còn lại × giá trung bình mỗi ngày" → refund vào balance. Loại bỏ vì model cũ user trả 1 cục cho thời hạn không phải pay-per-use, quy đổi vô nghĩa. User đã trả → coi như đã xài. Admin có thể manual top-up cho VIP nếu muốn.
6. **`balance_vnd` chỉ là VIEW computed từ ledger SUM:** "Source of truth thuần". Loại bỏ vì mỗi request đọc balance phải SUM toàn bộ ledger, slow khi user có hàng nghìn tx. Denormalized column + atomic update trong cùng db.transaction() vẫn giữ consistency, performance tốt hơn nhiều.

Pattern shared cache 2-bảng (charts + analyses theo birthHash) trong `patterns.md` vẫn áp dụng nguyên — chỉ thay "PRO gate" → "charge balance" ở entry point. Không thay đổi schema cache.

---


**Date:** 2026-05-14
**Module:** packages/tarot (mới) + web + db
**File:** packages/tarot/*, apps/web/src/lib/tarot-server.ts, apps/web/src/app/xem-tarot/*, apps/web/src/app/api/tarot/*, packages/db/migrations/0007_add_tarot_tables.sql
**Decision:** Feature Tarot (78 lá Rider-Waite-Smith). Tách thành 3 layer: (1) `@tuvi/tarot` client-safe data + helpers, (2) `tarot-server.ts` AI orchestration server-only, (3) Next.js routes/pages. Schema 2-bảng: `tarot_charts` (per-user submission, KHÔNG có unique user+hash) + `tarot_readings` (shared AI cache PK readingHash). Gate PRO subscription (giống Hoàng Đạo/Tử Vi mới), KHÔNG charge per-use.
**Reason:** (1) Tách package giúp reuse 78-card data ở các feature tương lai. (2) Hash node:crypto chỉ ở server-only file, vì client bundling Next.js không resolve `node:` protocol → đã vấp lần đầu, fix bằng export `buildReadingHashRaw` (pure JS) ở package, `createHash` ở server. (3) KHÔNG unique user+hash vì tarot rút ngẫu nhiên, không gian combo lớn (~12M cho n=5), user có thể muốn rút lại cùng combo nhiều lần để thấy đoạn personalize khác. (4) PRO gate align với pattern hiện tại của project (đã bỏ per-charge từ tháng 4).
**Rejected alternatives:** (1) Per-charge 30k/lần như prompt user ban đầu — KHÔNG còn align project hiện tại. (2) Bundle 78 ảnh vào `public/tarot/` — thêm ~10MB build, dùng CDN raw.githubusercontent.com/metabismuth/tarot-json tiện hơn (1 hop, public domain RWS). (3) `data.totl.net/tarot-rwcs-images/` mà prompt user đưa ra → URL 404, không tồn tại. (4) Wikipedia Special:FilePath → 2 redirects, chậm hơn. (5) Bundle hash function vào `@tuvi/tarot/helpers.ts` chung với client-safe code → fail vì webpack bundle node:crypto vào client. Fix bằng export raw string + tự hash server-side. (6) `react-tinder-card` swipe UX (đã thử) — phải import `@react-spring/web` peer dep, render từng lá riêng lẻ không có "cảm giác bộ bài đầy đủ" như casino. Đã loại bỏ.

Architecture detail:
- **Pick UX (casino-style)**: render full 78 lá thành grid responsive `repeat(auto-fill, minmax(46px, 1fr))`. Khi vào pick step → mỗi lá có CSS `animation-delay: idx * 12ms` chạy keyframe `deck-deal-in` (scale 0.3 → 1 + translateY + rotateZ), tạo cảm giác dealer rải bài. User CLICK 1 lá → lá đó nhận class `flying` chạy keyframe `deck-fly-up` (translateY -160px + rotateY 180deg + fade out 0.55s), đồng thời 1 lá face-up xuất hiện trong tray phía trên với keyframe `tray-flip-in`. Sau khi animation xong, lá bị `visibility: hidden` trong grid (giữ chỗ để layout không nhảy). Đủ numCards → delay 1.2s rồi auto-submit.
- AI: parallel N call per-card + 1 call overall + 1 call personalize. Seed = seedFromHash(readingHash) + offset. Per-card cache shared cross-user; personalize per-call no-cache (gắn tên + câu hỏi).
- Image: CDN `raw.githubusercontent.com/metabismuth/tarot-json/master/cards/{m00..p14}.jpg`, configured trong `next.config.js` remotePatterns + transpilePackages.

Deps: thuần React + CSS animation, KHÔNG thư viện animation ngoài. Bỏ `react-tinder-card` + `@react-spring/web` (đã thử swipe UX nhưng đổi sang casino-style click-to-pick).

---


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
