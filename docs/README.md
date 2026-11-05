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
- **Dữ liệu ban đầu:** `apps/api/prisma/sample-data.json` (danh mục, nguyên liệu, công thức, hạt, bài viết), nạp bằng `npm run db:seed`. `scripts/deploy.sh` tự nạp lần cài đầu qua `db:seed:initial`, bỏ qua nếu database đã có hàng. `db:seed:reset` xoá sạch hàng hoá, đơn, kho, khách rồi nạp lại.
- **API công khai** (`/api/v1`): `categories`, `products` (lọc `category`, `featured`, phân trang), `post-categories`, `posts`, `settings/store`, `cart/quote`, `orders` (tạo đơn), `orders/:code` (không có thông tin cá nhân), `orders/lookup` (mã đơn + số điện thoại). `GET /health` kiểm cả database.
- **Tài khoản khách** (`/api/v1/account`): đăng ký, đăng nhập bằng số điện thoại và mật khẩu (scrypt), token 30 ngày, tối đa 8 lần sai mỗi số trong 15 phút. Số đã từng đặt hàng phải nhập mã một đơn cũ mới tạo được tài khoản. Đặt hàng khi đã đăng nhập thì đơn gắn vào tài khoản. Web giữ token trong cookie httpOnly. API không bao giờ trả `passwordHash`.
- **Kho và đợt nhập** (`/api/v1/admin`: `materials`, `batches`, `recipes`, `pack`, `movements`): nhập nguyên liệu thô (nụ theo viên, hộp, thiệp...), đóng gói theo cấu thành của từng sản phẩm thành hàng bán (`Product.stock`). Hao hụt khi nhận hàng không vào kho, tiền của nó dồn vào giá vốn phần còn lại; chi phí phát sinh chia theo tỉ lệ tiền hàng (`apps/api/src/lib/inventory.ts`, CMS có bản sao để xem trước ở `apps/cms/src/lib/batch.ts`). Nhập kho cập nhật giá vốn bình quân, chỉ làm một lần, sau đó đợt bị khoá. Mọi thay đổi tồn kho ghi `StockMovement`. Lợi nhuận không gồm chi phí vận hành ban đầu.
- **Chat với khách** (`/api/v1/chat` cho web, `/api/v1/admin/inbox` cho CMS): khách nhắn từ khung chat trên web, nhân viên trả lời trong Hộp thư CMS. Tin mới đẩy tức thì bằng Server-Sent Events qua một kênh phát trong bộ nhớ (`lib/chat-bus.ts`); chạy nhiều tiến trình API thì phải đổi sang Redis hoặc Postgres LISTEN/NOTIFY. Trình duyệt khách nhận diện bằng mã ngẫu nhiên trong cookie httpOnly của web, API chỉ lưu bản băm. Hội thoại tự gắn với khách theo tài khoản đang đăng nhập hoặc số điện thoại. Trường `channel` để sẵn cho Facebook, Zalo.
- **Nhân viên** (`/api/v1/admin/staff`): mỗi người một tài khoản, quyền Chủ shop hoặc Bán hàng. Bán hàng không vào được vốn, kho, nhân viên. Tài khoản trong `.env` tự thành Chủ shop ở lần đăng nhập đầu.
- **API quản trị** (`/api/v1/admin`): đăng nhập bằng một tài khoản trong biến môi trường, token HMAC 12 giờ, tối đa 10 lần sai mỗi IP trong 15 phút. CRUD danh mục, sản phẩm, chủ đề, bài viết; xem khách hàng; xem và đổi trạng thái đơn; số liệu tổng quan.
- **Đặt hàng:** giá và phí giao tính ở server; trừ tồn kho có điều kiện trong transaction nên hai đơn cùng lúc không bán quá số còn; khoá `idempotencyKey` chống tạo đơn trùng; khách được tạo hoặc cập nhật theo số điện thoại. Huỷ đơn trên CMS thì cộng lại tồn kho.
- **Thanh toán:** khi nhận hàng (COD) hoặc chuyển khoản. Chưa có cổng thanh toán online, shop tự đánh dấu "Đã thanh toán" trên CMS.
