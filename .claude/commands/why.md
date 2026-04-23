---
description: Giải thích tại sao code được viết theo cách hiện tại — đọc decision log
---

User hỏi về: $ARGUMENTS

Thực hiện tuần tự:

1. Grep `.claude/memory/decisions.md` tìm entry liên quan (module/file/keyword).
2. Grep `.claude/memory/patterns.md` tìm pattern liên quan.
3. Nếu có git: `git log --follow -p -- <file>` để thấy lịch sử thay đổi file đó.
4. Đọc file hiện tại nếu cần verify trạng thái.

Trả lời format:

- **Quyết định:** [tóm tắt từ decision log]
- **Khi nào:** [ngày trong entry]
- **Lý do:** [reason trong entry]
- **Alternatives:** [nếu có]
- **Verify:** [code hiện tại có match không — nếu khác, flag là có thể đã thay đổi sau đó]

Nếu không tìm thấy trong decision log → nói thẳng "Chưa có record trong decision log. Có thể là default behavior hoặc quyết định trước khi bắt đầu log." Không bịa lý do.
