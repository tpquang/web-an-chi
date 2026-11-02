# Web An Chi

Website bán trầm hương. Monorepo npm workspaces: `apps/api` (Express, Prisma, PostgreSQL), `apps/web` (Next.js), `apps/cms` (React, Vite).

## Quy tắc

Rule của dự án nằm trong `.claude/skills/` và tự nạp theo việc đang làm:

| Skill | Dùng khi |
|---|---|
| `anchi-ui-ux` | Làm trang, component, CSS, form ở web hoặc CMS |
| `anchi-seo` | Metadata, URL, redirect, breadcrumb, sitemap, nội dung |
| `anchi-brand` | Viết chữ, mô tả sản phẩm, logo, ảnh chia sẻ, quyết định chưa có quy tắc |
| `anchi-growth` | CTA, khuyến mãi, quảng cáo, bán kèm, dữ liệu cá nhân, đo phễu |

Token màu chỉ sửa ở `design/tokens.css`. Thứ tự ưu tiên khi mâu thuẫn: yêu cầu trực tiếp, `CLAUDE.md`, skill. Quyết định mới dùng lâu dài thì ghi vào skill tương ứng trong cùng commit.

## Tài liệu

`docs/web` và `docs/cms`, mỗi nơi có `seo/`, `design/`, `plans/`, `backlog/`. Xem `docs/README.md`.

## Kiểm tra

`npm run typecheck`, `npm run build`, và `node .claude/skills/anchi-ui-ux/scripts/find-hardcoded-colors.mjs`.

Đường dẫn dự án nằm trên ổ ExFAT, macOS tự sinh file `._*`. Chúng đã được ignore, script duyệt file phải bỏ qua.
