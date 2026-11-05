# Giao diện website

| URL | Trang | Mẫu | Ghi chú |
|---|---|---|---|
| `/` | Trang chủ | | Banner, sản phẩm nổi bật (tối đa 4), slide giới thiệu trầm hương, bài viết nổi bật (tối đa 3, không có thì bài mới). Banner và slide cấu hình ở CMS `/home`, xem `layout.md` mục Trang chủ |
| `/san-pham` | Tất cả sản phẩm | List | Phân trang `?trang=N` |
| `/danh-muc/[slug]` | Danh mục sản phẩm | List | Hướng dẫn chọn, danh mục khác |
| `/san-pham/[slug]` | Chi tiết sản phẩm | Shop | Thêm vào giỏ, link Shopee và TikTok Shop, thông số, sản phẩm cùng danh mục, bài liên quan |
| `/bai-viet` | Tất cả bài viết | List | Hàng chủ đề, phân trang |
| `/chu-de/[slug]` | Chủ đề bài viết | List | |
| `/bai-viet/[slug]` | Bài viết | Read | Mục lục khi bài trên 1.200 chữ, sản phẩm trong bài, bài cùng chủ đề |
| `/gio-hang` | Giỏ hàng | App | noindex, footer không có link ra sàn |
| `/thanh-toan` | Đặt hàng | App | noindex, COD hoặc chuyển khoản |
| `/don-hang/[code]` | Đơn đã đặt | App | noindex, thông tin chuyển khoản, việc tiếp theo |
| `/tra-cuu-don-hang` | Tra cứu đơn | App | noindex, cần mã đơn và số điện thoại |
| `/gioi-thieu` | Giới thiệu | Read | Nguyên tắc bán hàng, giao hàng, liên hệ. Chỉ nêu điều kiểm tra được |
| `/dang-nhap`, `/dang-ky` | Đăng nhập, tạo tài khoản | App | noindex, số điện thoại và mật khẩu |
| `/tai-khoan` | Tài khoản | App | noindex, đơn đã đặt, sửa thông tin giao hàng |

**`components/ui`:** `Button` (thêm variant `light`), `IconButton`, `Badge`, `Field`, `Input`, `Textarea`, `Checkbox`, `RadioGroup`, `QuantityInput`, `Price`, `Tag`, `Toast`, `Spinner`, `Skeleton`, `EmptyState`, `ErrorState`, `Alert`, `PageFrame`, `PageHeader`, `Section` (có `eyebrow`), `Eyebrow`, `PageBreadcrumb`, `Pagination`.

**Header:** logo, Giới thiệu, Sản phẩm, Bài viết, Giỏ hàng, Đăng nhập hoặc Tài khoản, đổi theme. Dưới 720px còn logo, giỏ và nút mở menu dạng drawer (`MobileMenu`). Header dính ở mọi độ rộng.

**Trang chủ:** `HomeBanner`, `IntroSlider` trong `components/home`. Ảnh banner, slide đi qua `/api/site-images/[id]` để `next/image` tối ưu được.

**Thành phần bán hàng:** `ProductCard`, `ProductGrid`, `ProductImage` (ô có dấu logo khi chưa có ảnh thật), `AddToCart`, `CartButton`, `CartLine`, `OrderSummary`, `MarketplaceLinks`, `PostCard`, `TopicNav`, `PostBody`.

**Chat với shop:** nút "Nhắn shop" góc phải dưới (`ChatLauncher`), khung chat chỉ tải khi mở. Ẩn ở giỏ và đặt hàng nếu khách chưa từng chat, để khu đặt hàng gọn. Khách điền tên, số điện thoại (không bắt buộc) và câu hỏi; đã đăng nhập thì điền sẵn.

**Giỏ hàng:** chỉ lưu slug và số lượng trong `localStorage` (`lib/cart.ts`); giá và tồn kho luôn hỏi lại API. Dữ liệu form đặt hàng giữ trong `sessionStorage` của tab, đóng tab thì mất.

**Chỉ có khi dev:** nút đăng nhập nhanh bằng khách mẫu ở `/dang-nhap` và khối điền nhanh ở `/thanh-toan`, đọc 3 khách đầu trong `sample-data.json` qua `/api/dev/sample-customers` (trả 404 ngoài `next dev`, không trả mật khẩu mẫu).

**Ngoại lệ:**

- Xoá một món khỏi giỏ không hỏi xác nhận: thao tác nhỏ, thêm lại được ngay. `confirmDialog` dành cho xoá dữ liệu.
