# Web An Chi

Website bán trầm hương.

| Thư mục | Công nghệ | Cổng dev |
| --- | --- | --- |
| `apps/api` | Node.js, Express 5, Prisma 7, PostgreSQL | 4000 |
| `apps/web` | Next.js 16, Tailwind CSS 4 | 3000 |
| `apps/cms` | React 19, Vite, Tailwind CSS 4 | 3001 |
| `design` | Token màu dùng chung | |
| `docs` | [Tài liệu dự án](docs/README.md) | |
| `.claude/skills` | Rule của dự án, xem [CLAUDE.md](CLAUDE.md) | |

## Chạy lần đầu

Cần Node.js 22.12 trở lên và PostgreSQL ở cổng 5433 (`npm run db:up` dùng Docker).

```bash
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/cms/.env.example apps/cms/.env
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

Dữ liệu mẫu nằm trong một file [apps/api/prisma/sample-data.json](apps/api/prisma/sample-data.json): cấu hình cửa hàng, 5 danh mục, 12 sản phẩm, 3 chủ đề, 5 bài viết, 8 khách hàng, 10 đơn hàng. Tất cả là dữ liệu giả, sửa file rồi chạy lại `npm run db:seed` (chạy lại nhiều lần được).

Đăng nhập CMS ở http://localhost:3001 bằng `ADMIN_EMAIL`, `ADMIN_PASSWORD` trong `apps/api/.env` (mặc định `admin@example.com` / `anchi-dev-123`). Đổi cả ba biến `ADMIN_*`, `AUTH_SECRET` ở môi trường thật.

Khách mẫu Nguyễn Thị Lan (`0900000101`) và Trần Văn Minh (`0900000102`) đăng nhập web được bằng mật khẩu `khachmau123`.

Khi chạy dev có các lối tắt để test giao diện: nút **Đăng nhập nhanh** trên màn đăng nhập CMS, nút đăng nhập nhanh bằng khách mẫu ở `/dang-nhap` của web (cả hai cần `DEV_LOGIN=on` trong `apps/api/.env`), và các nút **điền nhanh khách mẫu** ở trang thanh toán. Cả hai không có trong bản build production; API bỏ qua `DEV_LOGIN` khi `NODE_ENV=production`.

## Lệnh thường dùng

| Lệnh | Tác dụng |
| --- | --- |
| `npm run dev` | Chạy cả 3 app |
| `npm run build` | Build cả 3 app |
| `npm run typecheck` | Kiểm tra kiểu |
| `npm run db:up` / `db:down` | Bật / tắt PostgreSQL |
| `npm run db:migrate` | Tạo và áp dụng migration |
| `npm run db:seed` | Nạp dữ liệu mẫu |
