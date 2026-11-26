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
| `/thanh-toan` | Đặt hàng | App | noindex. Trái: người nhận, địa chỉ ba ô, email và ghi chú, cách thanh toán; ô bắt buộc có sao đỏ, không có dòng gợi ý dưới ô, lỗi chỉ hiện khi bấm Đặt hàng. Phải: tóm tắt đơn có nút Đặt hàng (dính khi cuộn; điện thoại nằm cuối form). Không có ô nhận tin tiếp thị |
| `/don-hang/[code]` | Đơn đã đặt | App | noindex. Khối trạng thái (`components/order/order-status.tsx`): tiến trình 4 bước, hạn chuyển khoản, mã vận đơn, câu chính sách huỷ theo trạng thái, nút Huỷ đơn mở form tại chỗ (lý do chọn sẵn, số điện thoại). Thông tin chuyển khoản có hạn; việc tiếp theo chỉ khi đơn còn chờ |
| `/tra-cuu-don-hang` | Tra cứu đơn | App | noindex, cần mã đơn và số điện thoại. Cùng khối trạng thái, huỷ không hỏi lại số điện thoại |
| `/gioi-thieu` | Giới thiệu | Read | Nguyên tắc bán hàng, giao hàng, liên hệ. Chỉ nêu điều kiểm tra được |
| `/dang-nhap`, `/dang-ky` | Đăng nhập, tạo tài khoản | App | noindex, số điện thoại và mật khẩu |
| `/tai-khoan` | Tài khoản | App | noindex, đơn đã đặt, sửa thông tin giao hàng |

**`components/ui`:** `Button` (thêm variant `light`), `IconButton`, `Select` (có ô tìm không dấu), `Badge`, `Field`, `Input`, `Textarea`, `Checkbox`, `RadioGroup`, `QuantityInput`, `Price`, `Tag`, `Toast`, `Spinner`, `Skeleton`, `EmptyState`, `ErrorState`, `PageFrame`, `PageHeader`, `Section` (có `eyebrow`), `Eyebrow`, `PageBreadcrumb`, `Pagination`.

**Header:** logo, Giới thiệu, Sản phẩm, Bài viết, Giỏ hàng, Đăng nhập hoặc Tài khoản, đổi theme. Dưới 720px còn logo, giỏ và nút mở menu dạng drawer (`MobileMenu`). Header dính ở mọi độ rộng.

**Trang chủ:** `HomeBanner`, `IntroSlider` trong `components/home`. Ảnh banner, slide đi qua `/api/site-images/[id]` để `next/image` tối ưu được.

**Thành phần bán hàng:** `ProductCard`, `ProductGrid`, `ProductImage` (ô có dấu logo khi chưa có ảnh thật), `AddToCart`, `CartButton`, `CartLine`, `OrderSummary`, `MarketplaceLinks`, `PostCard`, `TopicNav`, `PostBody`.

**Chờ ngày mở bán:** giờ mở bán sửa ở CMS > Thông tin cửa hàng, mục Mở bán và đặt chờ (`launchAt` trong setting `store`, trống là đã mở bán). Root layout đọc qua `getStore` (cache 60 giây) rồi đưa xuống `LaunchProvider`; component client dùng `useLaunch`, `useLaunchLabel`, server dùng `launchAtOf`, `isPreLaunch` ở `lib/launch.ts`. Trước giờ này: trang chủ ẩn khối sản phẩm nổi bật và có khối đếm ngược dưới banner (`HomeLaunch`); `/san-pham`, `/danh-muc/*`, `/thiet-ke-vong-tay` có dải đếm ngược (`LaunchStrip`); trang sản phẩm có khối `ProductLaunchPanel` thay khối mua, Product schema ghi `PreOrder`. Cờ "Chuyển trang sản phẩm về đếm ngược" (`countdownRedirect`) bật thì `src/proxy.ts` chuyển tạm (307) `/san-pham`, `/san-pham/*`, `/danh-muc/*` về `/countdown` (noindex); proxy tự đọc cài đặt, nhớ 60 giây. API tự quyết đơn là đơn đặt chờ theo cùng giờ này. `LaunchGate` ở trình duyệt tự mở đúng giờ nên không cần deploy vào ngày mở bán; sau giờ mở bán `/countdown` chuyển 308 về trang chủ. Các trang nội dung, tài khoản, tra cứu đơn, chat không đổi.

**Giỏ hàng dạng bảng (11/2026):** `CartLayer` ở root layout. Mọi nút giỏ (header, tab mờ cạnh phải màn máy tính, menu điện thoại) và mọi lần thêm vào giỏ đều mở bảng trượt từ phải; đóng thì trượt ra, điện thoại vuốt sang phải để đóng. Nút "Thanh toán" ở đáy bảng. Trước ngày mở bán, khi nhận đặt chờ, trang sản phẩm và giỏ không giới hạn số lượng theo tồn kho (tối đa 99 mỗi dòng). Quy cách ở skill `anchi-ui-ux` `components.md` mục Drawer. Trang `/gio-hang` giữ nguyên cho xem đầy đủ.

**Thiết kế vòng `/thiet-ke-vong-tay`:** điện thoại vào bằng form khởi tạo theo bước (`BraceletSetup`), máy tính có hàng cài đặt gọn `SetupBar` trên khu thiết kế. Bố cục chi tiết ở skill `anchi-ui-ux` `layout.md` mục Thiết kế vòng tay.

**Đặt chờ:** không có nút hay form riêng. Trước ngày mở bán (CMS bật đặt chờ) trang sản phẩm và thiết kế vòng vẫn có nút thêm vào giỏ; `PreorderNote` (`components/cart/preorder-note.tsx`) hiện dưới giỏ hàng, bảng giỏ và trang thanh toán.

**Đặt cọc:** cách thanh toán ở trang thanh toán lấy từ báo giá (`quote.payment`, `paymentOptions` ở `lib/order.ts`): chưa có tài khoản ngân hàng thì chỉ có trả khi nhận hàng; đơn phải cọc thì lựa chọn trả khi nhận hàng đổi thành "Đặt cọc N%, còn lại trả khi nhận hàng", ghi rõ hai số tiền. Trang đơn và tra cứu đơn hiện khối "Chuyển khoản tiền cọc" với đúng số tiền cọc. Quy tắc ở `anchi-growth` mục 6b.

**Chat với shop:** nút "Nhắn shop" góc phải dưới (`ChatLauncher`), khung chat chỉ tải khi mở. Ẩn ở giỏ và đặt hàng nếu khách chưa từng chat, để khu đặt hàng gọn. Khách điền tên, số điện thoại (không bắt buộc) và câu hỏi; đã đăng nhập thì điền sẵn.

**Địa chỉ nhận hàng (11/2026):** theo địa giới từ 01/07/2025, không còn quận, huyện: Tỉnh, thành phố → Phường, xã (hai `Select` có tìm không dấu) → Số nhà, tên đường. Dữ liệu tĩnh `public/data/dia-gioi-2025.json` (34 tỉnh, 3.321 xã, nguồn provinces.open-api.vn v2, khoảng 26 KB nén), tải ở trang thanh toán qua `lib/address.ts`. Gửi API vẫn là một chuỗi "số nhà đường, xã, tỉnh"; địa chỉ đã lưu ở tài khoản được tách lại nếu khớp đúng tên xã và tỉnh, không khớp thì để khách chọn. Sửa danh sách khi Nhà nước đổi địa giới.

**Giỏ hàng:** chỉ lưu slug và số lượng trong `localStorage` (`lib/cart.ts`); giá và tồn kho luôn hỏi lại API. Dữ liệu form đặt hàng giữ trong `sessionStorage` của tab, đóng tab thì mất.

**Chỉ có khi dev:** nút đăng nhập nhanh bằng khách mẫu ở `/dang-nhap` và khối điền nhanh ở `/thanh-toan`, đọc 3 khách đầu trong `sample-data.json` qua `/api/dev/sample-customers` (trả 404 ngoài `next dev`, không trả mật khẩu mẫu).

**Ngoại lệ:**

- Xoá một món khỏi giỏ không hỏi xác nhận: thao tác nhỏ, thêm lại được ngay. `confirmDialog` dành cho xoá dữ liệu.

**Thiết kế vòng, chuỗi 108 hạt và đeo thử:** "Loại vòng" (đầu cột phải) có Vòng đơn hoặc Chuỗi 108 hạt quấn 4 vòng, tuỳ chọn tick "Hạt chủ và tua" (`accent`): hạt chủ đặt giữa vòng dưới, xa đoạn vắt chéo, nút chặn và hai dây tua 3 hạt (`tassel.ts`), tính thêm 7 hạt trầm chính vào giá và tồn kho (`rules.mala` ở `apps/api/src/modules/bracelet/bracelet.service.ts`, thiết kế gửi thêm `wraps`). Chuỗi dựng sẵn 108 hạt trầm, tự chọn cỡ hạt cùng loại trầm để quấn gần đúng số vòng. Nút "Đeo thử" nạp bàn tay scan ở `public/models/ban-tay/` (`hand-model.ts`): đo bề mặt da theo lát cắt, phóng theo cỡ cổ tay khách, chuỗi trượt xuống cẳng tay theo trọng lực tới chỗ các vòng ôm vừa (dư thì chùng, thiếu thì dây thun giãn), đoạn cuối vắt chéo ra ngoài để khép vòng (`coil.ts`), bóng đổ lên da. Khi đeo thử chỉ xoay xem, không sửa hạt.

**Không chặn độ dài, lưu nháp và sửa vòng:** khách xâu dài ngắn tuỳ ý (dư vòng, thiếu hạt, khác 108 hạt đều lưu được), lệch cỡ tay chỉ hiện gợi ý màu `warn` (`hint` ở `use-bracelet.ts`); chỉ chặn khi vòng trống hoặc shop thiếu hạt, trần chung 200 hạt và charm. API cũng bỏ lỗi `TOO_LONG`, `TOO_SHORT`. Thiết kế đang làm tự lưu vào `localStorage` (`anchi-bracelet-draft`), vào lại trang thì mở thẳng thiết kế cũ. Dòng vòng trong giỏ có nút "Sửa vòng" mở `/thiet-ke-vong-tay?sua=<mã vòng>`: nút lưu đổi thành "Cập nhật vòng trong giỏ", thay đúng dòng đó và giữ số lượng (`cart.replaceBracelet`); "Thôi sửa" biến thiết kế thành vòng mới.
