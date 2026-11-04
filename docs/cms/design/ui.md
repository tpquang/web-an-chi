# Giao diện CMS

Mẫu App trong `anchi-ui-ux`, không có giới hạn 1180px. Dùng chung token với web.

| Route | Màn hình |
|---|---|
| `/inbox`, `/inbox/:id` | Hộp thư: danh sách hội thoại (đang mở, của tôi, chưa ai nhận, đã xong), khung trả lời có câu mẫu gõ "/", phân công, thẻ, ghi chú nội bộ, thông tin và đơn của khách. Huy hiệu số tin chưa đọc ở menu và tiêu đề tab |
| `/staff` | Nhân viên (chỉ chủ shop): thêm, đổi quyền, khoá tài khoản |
| `/` | Tổng quan: đơn chờ xác nhận, đang giao, doanh thu 30 ngày, khách hàng, đơn mới, sắp hết hàng |
| `/orders`, `/orders/:id` | Đơn hàng: tìm, lọc trạng thái, xem chi tiết, đổi trạng thái đơn và thanh toán |
| `/customers`, `/customers/:id` | Khách hàng: tìm theo tên hoặc số điện thoại, lịch sử đơn, đồng ý nhận tin |
| `/products`, `/products/new`, `/products/:id` | Sản phẩm: lọc, form đầy đủ gồm thông số, ảnh, link Shopee và TikTok, cấu thành từ nguyên liệu thô, SEO |
| `/business`, `/business/new`, `/business/:id` | Đợt nhập: nguyên liệu nhập (theo kg hoặc theo đơn vị), chi phí phát sinh, hao hụt khi nhận, quy đổi ra thành phẩm, vốn và lợi nhuận, nút nhập kho |
| `/materials` | Nguyên liệu thô: tồn kho, giá vốn bình quân, ghi hao hụt, kiểm kê |
| `/packing` | Đóng gói: số đóng được từ kho, trừ nguyên liệu, cộng thành phẩm; ghi hao hụt thành phẩm |
| `/stock` | Sổ kho, lọc theo loại |
| `/categories` | Danh mục sản phẩm, sửa trong modal |
| `/posts`, `/posts/new`, `/posts/:id` | Bài viết: nội dung văn bản thuần, chủ đề, sản phẩm liên quan, SEO |
| `/post-categories` | Chủ đề bài viết, sửa trong modal |

Bộ lọc và trang nằm trên URL. Giao diện chọn Sáng, Tối hoặc Theo máy ở cuối sidebar (đầu trang trên mobile) và trên màn đăng nhập; lựa chọn dùng chung khoá `anchi-theme` với web. Chưa đăng nhập thì mọi route hiện màn đăng nhập.

**`components/ui`:** `Button`, `ButtonLink`, `IconButton`, `Spinner`, `Field`, `Input`, `Textarea`, `MoneyInput`, `Checkbox`, `Switch`, `Select`, `Modal`, `confirmDialog`, `Toast`, `Skeleton`, `TableSkeleton`, `EmptyState`, `ErrorState`, `Tag`, `PageHeader`, `Panel`, `DataTable`, `Pagination`. Ngoài ra `RowsEditor` cho danh sách thông số và ảnh.

**Chưa có:** `DatePicker`. Ngày đăng bài tự lấy lúc chuyển sang "Đang hiện".

**Chỉ có khi dev:** nút "Đăng nhập nhanh" gọi `POST /api/v1/admin/dev-login`, API chỉ mở endpoint này khi `DEV_LOGIN=on` và không ở production.

**Ngoại lệ về khung:** thẻ đăng nhập căn giữa.
