---
name: stop-dev
description: Dừng dev server TUVIAI (api :4100 + web :3100) sạch sẽ, kể cả khi terminal đã đóng / process bị treo / Ctrl+C không ăn.
---

# Stop dev (api + web)

## Khi dùng skill này

- User muốn thoát/dừng dev server.
- Dev server treo, port bị giữ, restart lại báo `EADDRINUSE`.
- Trước khi tắt máy / kết thúc buổi làm.

## Bước 1 — Kiểm tra trạng thái port

```powershell
netstat -ano | findstr ":3100 :4100"
```

Có dòng `LISTENING` = vẫn còn process giữ port. Cột cuối là PID.

## Bước 2 — Chọn cách kill

### Cách A: Ctrl+C trong terminal đang chạy (sạch nhất)

Nếu terminal `pnpm dev:api` / `pnpm dev:web` còn mở → bấm `Ctrl+C` ngay trong terminal đó, đợi 2-3 giây cho Next.js / tsx cleanup.

**Không đóng cửa sổ terminal bằng nút X** — sẽ orphan node process, port bị giữ.

### Cách B: Kill theo PID (khi terminal đã đóng / treo)

```powershell
Stop-Process -Id <PID> -Force
```

Lấy `<PID>` từ output bước 1. Lặp lại cho cả 2 port nếu cần.

### Cách C: Kill tất cả node (nuke option)

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

**Cảnh báo:** giết MỌI process node trên máy, kể cả VS Code Node host (VS Code sẽ tự restart). Chỉ dùng khi không nhớ PID nào hoặc có nhiều dev server cũ tích lũy.

## Bước 3 — Verify port đã thả

```powershell
netstat -ano | findstr ":3100 :4100"
```

Không có output = thả xong. Giờ có thể `/run-dev` start lại sạch.

## Bug đã gặp

**Symptom:** Dev server chạy qua đêm / qua nhiều giờ → page bị timeout, terminal vẫn show "Ready" nhưng request không response.

**Root cause:** Next.js 14 HMR + file watch tích memory leak sau vài giờ. Case 2026-05-11: process web chạy 24h, ăn 37k giây CPU + 614MB RAM, port LISTENING nhưng không xử lý request.

**Fix:** Stop-Process bằng skill này → start lại bằng `/run-dev`.

**Phòng tránh:**
- Cuối buổi gọi `/stop-dev` trước khi đóng máy.
- Nếu sửa nhiều file, restart 1 lần mỗi 2-3 giờ.
- Không dùng `pnpm dev` (parallel buffer interleave log) — dùng 2 terminal `pnpm dev:api` + `pnpm dev:web` để dễ Ctrl+C từng cái.
