# Tài liệu dự án

Docs mô tả **An Chi đang có gì và sẽ làm gì**. Cách làm đúng nằm trong rule ở `.claude/skills/anchi-*`, docs không chép lại rule.

| | [web/](web/README.md) (`apps/web`) | [cms/](cms/README.md) (`apps/cms`) |
|---|---|---|
| `seo/` | [Checklist](web/seo/checklist.md), [bản đồ từ khoá](web/seo/keyword-map.md) | [Trường SEO](cms/seo/fields.md) |
| `design/` | [Thương hiệu](web/design/brand.md), [palette](web/design/palette.html), [giao diện](web/design/ui.md) | [Giao diện](cms/design/ui.md) |
| `plans/` | [Lộ trình](web/plans/roadmap.md) | [Lộ trình](cms/plans/roadmap.md) |
| `backlog/` | [Backlog](web/backlog/backlog.md) | [Backlog](cms/backlog/backlog.md) |

## Quy ước

- Kế hoạch mới đặt tên `YYYY-MM-ten-ke-hoach.md`. Tên file viết thường, không dấu, nối bằng gạch ngang.
- Sửa code làm thay đổi hiện trạng thì cập nhật docs trong cùng commit.
- Việc của backend ghi vào backlog của app cần nó.

## Backend

Không có thư mục riêng, nguồn chuẩn là code.

- **Stack:** Node.js, Express 5, Prisma 7, PostgreSQL. Chỉ `apps/api` truy cập database. Web gọi API từ server của Next, trình duyệt chỉ gọi route handler `/api/*` của web. Web cache dữ liệu 60 giây.
- **Vì sao PostgreSQL:** đơn hàng và tồn kho cần transaction, ràng buộc khoá ngoại; `JSONB` đủ cho thông số riêng từng loại trầm. Prisma giữ ở 7.x tới khi bản 8 ra chính thức.
- **Schema:** `apps/api/prisma/schema.prisma` gồm danh mục, sản phẩm, ảnh, chủ đề bài viết, bài viết, khách hàng, đơn hàng, cấu hình `Setting`. Tiền lưu số nguyên VND. Mọi thay đổi đi qua `npm run db:migrate`.
- **Dữ liệu mẫu:** `apps/api/prisma/sample-data.json`, nạp bằng `npm run db:seed`.
- **API công khai** (`/api/v1`): `categories`, `products` (lọc `category`, `featured`, phân trang), `post-categories`, `posts`, `settings/store`, `cart/quote`, `orders` (tạo đơn), `orders/:code` (không có thông tin cá nhân), `orders/lookup` (mã đơn + số điện thoại). `GET /health` kiểm cả database.
- **Tài khoản khách** (`/api/v1/account`): đăng ký, đăng nhập bằng số điện thoại và mật khẩu (scrypt), token 30 ngày, tối đa 8 lần sai mỗi số trong 15 phút. Số đã từng đặt hàng phải nhập mã một đơn cũ mới tạo được tài khoản. Đặt hàng khi đã đăng nhập thì đơn gắn vào tài khoản. Web giữ token trong cookie httpOnly. API không bao giờ trả `passwordHash`.
- **API quản trị** (`/api/v1/admin`): đăng nhập bằng một tài khoản trong biến môi trường, token HMAC 12 giờ, tối đa 10 lần sai mỗi IP trong 15 phút. CRUD danh mục, sản phẩm, chủ đề, bài viết; xem khách hàng; xem và đổi trạng thái đơn; số liệu tổng quan.
- **Đặt hàng:** giá và phí giao tính ở server; trừ tồn kho có điều kiện trong transaction nên hai đơn cùng lúc không bán quá số còn; khoá `idempotencyKey` chống tạo đơn trùng; khách được tạo hoặc cập nhật theo số điện thoại. Huỷ đơn trên CMS thì cộng lại tồn kho.
- **Thanh toán:** khi nhận hàng (COD) hoặc chuyển khoản. Chưa có cổng thanh toán online, shop tự đánh dấu "Đã thanh toán" trên CMS.
