# AGENTS.md

File cho agent không đọc `CLAUDE.md` (Antigravity, Gemini CLI, Codex...). Nội dung chuẩn nằm ở `CLAUDE.md`, file này chỉ trỏ sang để không phải sửa hai nơi.

1. **Trước khi làm bất kỳ việc gì, đọc toàn bộ [`CLAUDE.md`](CLAUDE.md)**: stack, lệnh, kiến trúc, cặp code nhân đôi, quy ước docs.
2. Rule chi tiết là các skill ở `.claude/skills/anchi-*`. Antigravity nạp chúng qua `.agents/skills.json`; agent khác thì tự mở `SKILL.md` của skill khớp việc đang làm (bảng trong `CLAUDE.md`). Phải đọc skill trước khi sửa code thuộc phạm vi của nó.
3. Thứ tự ưu tiên khi mâu thuẫn: yêu cầu trực tiếp của người dùng, `CLAUDE.md`, skill.
4. Quyết định mới dùng lâu dài thì ghi vào skill tương ứng; đổi hiện trạng thì cập nhật `docs/` trong cùng thay đổi.
5. Ổ dự án là ExFAT: không tạo được symlink, macOS sinh file `._*` (đã ignore). Lệnh duyệt file phải bỏ qua `._*`; trong zsh nhớ đặt pattern trong nháy, ví dụ `--exclude='._*'`.
