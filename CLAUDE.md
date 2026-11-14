# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Web An Chi

Website bán trầm hương. Monorepo npm workspaces: `apps/api` (Express 5, Prisma 7, PostgreSQL, cổng 4000), `apps/web` (Next.js 16, cổng 3000), `apps/cms` (React 19, Vite, cổng 3001). Node >= 22.12.

## Quy tắc

Rule của dự án nằm trong `.claude/skills/` và tự nạp theo việc đang làm:

| Skill | Dùng khi |
|---|---|
| `anchi-ui-ux` | Làm trang, component, CSS, form ở web hoặc CMS |
| `anchi-seo` | Metadata, URL, redirect, breadcrumb, sitemap, nội dung |
| `anchi-brand` | Viết chữ, mô tả sản phẩm, logo, ảnh chia sẻ, quyết định chưa có quy tắc |
| `anchi-growth` | CTA, khuyến mãi, quảng cáo, bán kèm, dữ liệu cá nhân, đo phễu |

Token màu chỉ sửa ở `design/tokens.css`. Thứ tự ưu tiên khi mâu thuẫn: yêu cầu trực tiếp, `CLAUDE.md`, skill. Quyết định mới dùng lâu dài thì ghi vào skill tương ứng trong cùng commit.

Next.js 16 có thay đổi phá vỡ so với kiến thức cũ: trước khi viết code ở `apps/web`, đọc hướng dẫn trong `apps/web/node_modules/next/dist/docs/` (xem `apps/web/AGENTS.md`). `next dev` tự thêm lại block trong `AGENTS.md`, cứ commit nó.

## Lệnh

| Lệnh | Tác dụng |
|---|---|
| `npm start` | `scripts/dev.sh` (Windows: `start.cmd` → `scripts/dev.ps1`): cài thư viện, tạo `.env`, bật Docker + PostgreSQL (cổng 5433), áp migration, chạy cả 3 app |
| `npm run dev` | Chạy cả 3 app khi database đã bật. Một app: `npm run dev -w @an-chi/web` |
| `npm run db:migrate` | `prisma migrate dev`, mọi thay đổi `schema.prisma` đi qua đây |
| `npm run db:seed` | Nạp `apps/api/prisma/sample-data.json`, chạy lại nhiều lần được. `-w @an-chi/api db:seed:reset` xoá sạch rồi nạp lại |

Không có test tự động và lint. Kiểm tra trước khi commit: `npm run typecheck`, `npm run build`, và `node .claude/skills/anchi-ui-ux/scripts/find-hardcoded-colors.mjs`.

Đăng nhập CMS dev bằng `ADMIN_EMAIL` / `ADMIN_PASSWORD` trong `apps/api/.env`. `DEV_LOGIN=on` bật nút đăng nhập nhanh ở CMS và web; API bỏ qua khi `NODE_ENV=production`.

## Kiến trúc

- **Chỉ `apps/api` chạm database.** Prisma client sinh ra ở `apps/api/src/generated/prisma` (gitignore); `build` và `typecheck` của API tự chạy `prisma generate`. API là ESM nên import nội bộ ghi đuôi `.js`.
- **API:** mỗi nhóm ở `src/modules/<tên>/<tên>.routes.ts`, gắn vào `/api/v1` trong `src/app.ts`. Quản trị nằm dưới `/api/v1/admin`, mỗi mảng một file `modules/admin/admin.*.ts`; quyền Chủ shop / Bán hàng ở `lib/permissions.ts`. Logic nghiệp vụ (giá, tồn kho, nhập kho, redirect) nằm ở `src/lib/`.
- **Web:** trình duyệt không bao giờ gọi thẳng API. Server component lấy dữ liệu qua `src/lib/api.ts` (`server-only`, cache 60 giây, timeout thì trả 500). Thao tác của khách đi qua route handler `src/app/api/*`, dùng `routeProxy` trong `src/lib/route-proxy.ts` để chuyển tiếp và giữ token khách trong cookie httpOnly. Không có `SITE_INDEXING=on` thì toàn site noindex.
- **CMS:** SPA gọi API trực tiếp qua `VITE_API_URL`, token admin lưu trong `localStorage` (`src/lib/api.ts`).
- **Giao diện:** cả web và CMS import `design/tailwind-theme.css` (nối biến CSS thành class Tailwind như `bg-paper`, `text-ink`) và `design/tokens.css` (giá trị màu sáng, tối).
- **Code nhân đôi, sửa thì sửa cả hai:** công thức chia chi phí đợt nhập `apps/api/src/lib/inventory.ts` ↔ `apps/cms/src/lib/batch.ts`; SEO mặc định của trang không có slug `apps/api/src/lib/seo-pages.ts` ↔ `apps/web/src/lib/page-seo.ts`. Kiểu dữ liệu ở web và CMS khai báo tay, không dùng chung với API.
- **Triển khai:** `scripts/deploy.sh` cài lần đầu lên VPS Ubuntu (nginx, HTTPS, web ở tên miền chính, CMS và `/api/` ở `mun.<domain>`); cập nhật về sau bằng `scripts/update.sh`.

## Tài liệu

`docs/web` và `docs/cms`, mỗi nơi có `seo/`, `design/`, `plans/`, `backlog/`. Xem `docs/README.md`, file này cũng mô tả nghiệp vụ backend (đặt hàng, kho, tài khoản, chat, nhân viên). Sửa code làm thay đổi hiện trạng thì cập nhật docs trong cùng commit.

## Lưu ý môi trường

Đường dẫn dự án nằm trên ổ ExFAT, macOS tự sinh file `._*`. Chúng đã được ignore, script duyệt file phải bỏ qua.
