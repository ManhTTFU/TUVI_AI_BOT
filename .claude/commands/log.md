---
description: Cập nhật session log — ghi lại đang làm gì, đến đâu rồi
disable-model-invocation: true
---

Đọc files đã sửa hôm nay:

```bash
cat .claude/memory/today-changes.tmp 2>/dev/null
git diff --name-only 2>/dev/null
git log --oneline --since="1 day ago" 2>/dev/null
```

Sau đó hỏi user 3 câu:

1. Hôm nay đang làm feature/bug gì?
2. Đã xong phần nào, còn lại phần nào?
3. Session sau làm gì tiếp?

Ghi entry mới vào **đầu** section `## Entries` trong `.claude/memory/session-log.md` theo đúng format template. Dùng ngày hôm nay (absolute date, không dùng "hôm nay").

Sau khi ghi xong:
- Xóa `.claude/memory/today-changes.tmp` nếu có.
- Confirm với user đã ghi.
