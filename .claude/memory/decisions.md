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
