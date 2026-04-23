---
description: Ghi lại một quyết định code/architecture vào decision log
disable-model-invocation: true
---

User vừa quyết định: $ARGUMENTS

Nếu $ARGUMENTS đã đủ context (decision + reason rõ ràng), skip câu hỏi và ghi luôn.
Nếu thiếu, hỏi user những câu còn thiếu:

1. Module/package nào bị ảnh hưởng? (bot / api / web / core / astrology / ai / pdf)
2. File cụ thể nào?
3. Lý do thay đổi? (phần quan trọng nhất — không chấp nhận "để code đẹp hơn")
4. Đã xem xét alternatives nào, tại sao không chọn?

Ghi entry mới vào **đầu** section `## Entries` trong `.claude/memory/decisions.md` theo đúng format:

```
**Date:** [ngày hôm nay, YYYY-MM-DD]
**Module:** ...
**File:** ...
**Decision:** ...
**Reason:** ...
**Rejected alternatives:** ... (hoặc "Không xem xét alternatives" nếu user không có)

---
```

Confirm với user đã ghi và show entry vừa viết.
