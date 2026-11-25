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

**`components/ui`:** `Button` (thêm variant `light`), `IconButton`, `Modal`, `Badge`, `Field`, `Input`, `Textarea`, `Checkbox`, `RadioGroup`, `QuantityInput`, `Price`, `Tag`, `Toast`, `Spinner`, `Skeleton`, `EmptyState`, `ErrorState`, `Alert`, `PageFrame`, `PageHeader`, `Section` (có `eyebrow`), `Eyebrow`, `PageBreadcrumb`, `Pagination`.

**Header:** logo, Giới thiệu, Sản phẩm, Bài viết, Giỏ hàng, Đăng nhập hoặc Tài khoản, đổi theme. Dưới 720px còn logo, giỏ và nút mở menu dạng drawer (`MobileMenu`). Header dính ở mọi độ rộng.

**Trang chủ:** `HomeBanner`, `IntroSlider` trong `components/home`. Ảnh banner, slide đi qua `/api/site-images/[id]` để `next/image` tối ưu được.

**Thành phần bán hàng:** `ProductCard`, `ProductGrid`, `ProductImage` (ô có dấu logo khi chưa có ảnh thật), `AddToCart`, `CartButton`, `CartLine`, `OrderSummary`, `MarketplaceLinks`, `PostCard`, `TopicNav`, `PostBody`.

**Chờ ngày mở bán (tạm thời, tới 12/12/2026):** giờ mở bán ở `lib/launch.ts`, đổi bằng `NEXT_PUBLIC_LAUNCH_AT` rồi build lại. Trước giờ này: `src/proxy.ts` chuyển tạm (307, đang tắt bằng `REDIRECT_TO_COUNTDOWN = false` để test) `/san-pham`, `/san-pham/*`, `/danh-muc/*` về `/countdown` (trang đếm ngược, noindex); trang chủ ẩn khối sản phẩm nổi bật và có khối đếm ngược dưới banner (`HomeLaunch`); `/thiet-ke-vong-tay` có dải đếm ngược đầu trang (`LaunchStrip`). Dải đếm ngược ở trang danh sách và khối thay nút mua ở trang sản phẩm vẫn còn trong code, phòng khi bỏ chuyển hướng; trang thiết kế vòng vẫn cho phối hạt, xem giá nhưng không có nút thêm vào giỏ; `POST /api/orders` trả 403. Server tính trạng thái lúc dựng trang, `LaunchGate` ở trình duyệt tự mở đúng giờ nên không cần deploy lại vào ngày mở bán. Các trang nội dung, tài khoản, tra cứu đơn, chat không đổi. Sau ngày mở bán gỡ `components/launch` và các chỗ gọi.

**Giỏ hàng dạng bảng (11/2026):** nút giỏ trên header mở `CartDrawer` bên phải; lưu vòng tự thiết kế cũng mở bảng này. Trang `/gio-hang` giữ nguyên cho xem đầy đủ.

**Thiết kế vòng `/thiet-ke-vong-tay`:** điện thoại vào bằng form khởi tạo theo bước (`BraceletSetup`), máy tính có hàng cài đặt gọn `SetupBar` trên khu thiết kế. Bố cục chi tiết ở skill `anchi-ui-ux` `layout.md` mục Thiết kế vòng tay.

**Đặt chờ:** `PreorderButton`, `PreorderDialog` (`components/preorder`), route handler `/api/preorders`. Hiện trước ngày mở bán khi CMS bật đặt chờ.

**Chat với shop:** nút "Nhắn shop" góc phải dưới (`ChatLauncher`), khung chat chỉ tải khi mở. Ẩn ở giỏ và đặt hàng nếu khách chưa từng chat, để khu đặt hàng gọn. Khách điền tên, số điện thoại (không bắt buộc) và câu hỏi; đã đăng nhập thì điền sẵn.

**Giỏ hàng:** chỉ lưu slug và số lượng trong `localStorage` (`lib/cart.ts`); giá và tồn kho luôn hỏi lại API. Dữ liệu form đặt hàng giữ trong `sessionStorage` của tab, đóng tab thì mất.

**Chỉ có khi dev:** nút đăng nhập nhanh bằng khách mẫu ở `/dang-nhap` và khối điền nhanh ở `/thanh-toan`, đọc 3 khách đầu trong `sample-data.json` qua `/api/dev/sample-customers` (trả 404 ngoài `next dev`, không trả mật khẩu mẫu).

**Ngoại lệ:**

- Xoá một món khỏi giỏ không hỏi xác nhận: thao tác nhỏ, thêm lại được ngay. `confirmDialog` dành cho xoá dữ liệu.

**Thiết kế vòng, chuỗi 108 hạt và đeo thử:** "Loại vòng" (đầu cột phải) có Vòng đơn hoặc Chuỗi 108 hạt quấn 4 vòng, tuỳ chọn tick "Hạt chủ và tua" (`accent`): hạt chủ đặt giữa vòng dưới, xa đoạn vắt chéo, nút chặn và hai dây tua 3 hạt (`tassel.ts`), tính thêm 7 hạt trầm chính vào giá và tồn kho (`rules.mala` ở `apps/api/src/modules/bracelet/bracelet.service.ts`, thiết kế gửi thêm `wraps`). Chuỗi giữ đúng 108 hạt trầm (thêm tối đa 12 charm), tự chọn cỡ hạt cùng loại trầm để quấn gần đúng số vòng; lệch quá 0,4 vòng thì báo lỗi. Nút "Đeo thử" nạp bàn tay scan ở `public/models/ban-tay/` (`hand-model.ts`): đo bề mặt da theo lát cắt, phóng theo cỡ cổ tay khách, chuỗi trượt xuống cẳng tay theo trọng lực tới chỗ các vòng ôm vừa (dư thì chùng, thiếu thì dây thun giãn), đoạn cuối vắt chéo ra ngoài để khép vòng (`coil.ts`), bóng đổ lên da. Khi đeo thử chỉ xoay xem, không sửa hạt.
