# Component

Quy cách cho `components/ui/*` của từng app. Chưa có component thì làm đúng quy cách này khi cần lần đầu. Đổi props thì cập nhật file này. Danh sách đã làm ghi ở `docs/<app>/design/ui.md`.

## Button

| Prop | Giá trị | Ghi chú |
|---|---|---|
| `variant` | `primary` (mặc định), `secondary`, `danger`, `outline`, `light` (chỉ web), `text` | Mỗi màn hình một `primary`. `danger` cho xoá. `light` chỉ trên khối tối và ảnh |
| `size` | `sm` 36px, `md` 44px (mặc định), `lg` 52px | Trên cảm ứng vẫn đảm bảo vùng chạm 44px |
| `block` | boolean | Rộng 100% |
| `loading` | boolean | Hiện spinner, tự `disabled`, `aria-busy` |
| `href` | string | Có thì render link |

Mọi nút dạng viên thuốc `rounded-full`. Nhãn là động từ nói đúng việc xảy ra. Lời mời đi tiếp sang trang khác (Xem sản phẩm, Xem tất cả) thêm `ArrowRightIcon` 18px sau nhãn; nút gửi form, xoá, lưu không có mũi tên. `IconButton` tròn 44px, bắt buộc `label`, có `badge` cho số lượng giỏ.

| Variant | Quy cách |
|---|---|
| `primary` | Nền `wood`, chữ `on-wood`, hover `wood-hover` |
| `outline` | Viền `line-strong`, chữ `ink`, hover viền và chữ `wood`. Nút phụ cạnh nút chính, "Xem tất cả" ở đầu section |
| `light` | Nền `on-night`, chữ `night`. Nút trên khối tối |
| `secondary` | Nền `paper-2`, chữ `ink` |
| `danger` | Nền `err`, chữ `surface` |
| `text` | Chữ `wood`, gạch chân khi hover |

## Mũi tên tròn

Nút hoặc dấu hiệu mũi tên trong vòng tròn, lấy từ mẫu thiết kế.

| Chỗ dùng | Quy cách |
|---|---|
| Trong thẻ sản phẩm | `span` 36px `aria-hidden` vì cả thẻ đã là link. Nền `paper-2`, hover thẻ thì nền `wood` chữ `on-wood`. Ẩn dưới 480px cho đỡ chật |
| Chuyển slide | `button` 48px có `aria-label`. Trước: nền `wood`. Tiếp: nền `on-night`. Cạnh đó số `1 / 3` trong `aria-live="polite"` |

## Thẻ

| Thẻ | Quy cách |
|---|---|
| `ProductCard` | Cả thẻ là link. `rounded-3xl bg-surface border-edge p-2`, ảnh vuông `rounded-2xl`, danh mục 13px, tên 2 dòng, giá serif, mũi tên tròn góc phải dưới |
| `PostCard` | Như trên. Ảnh bìa 3:2 nếu có, chủ đề và ngày, tiêu đề serif 20, tóm tắt 3 dòng, dòng "Đọc bài →" màu `wood` |
| Tấm nội dung | `Panel` ở CMS, khối thông tin ở web: `rounded-3xl bg-surface border-edge`, padding 20–40 |

## Eyebrow

`Eyebrow` trong `components/ui/layout.tsx` của web: dòng 13px màu `wood` có gạch 24px phía trước, đặt trên H1 banner và H2 section qua prop `eyebrow` của `Section`. Nói nhóm nội dung (Sản phẩm nổi bật, Bài viết nổi bật), không lặp lại tiêu đề.

## Slider

Chỉ dùng cho slide giới thiệu trang chủ (`IntroSlider`). Không dùng slider cho sản phẩm: khách cần thấy hết để so sánh.

- Không tự chạy. Đổi bằng nút, phím ← →, vuốt ngang trên 48px.
- Mọi slide có trong HTML server, xếp chồng một ô lưới, đổi bằng `opacity` trong `--d-page`. Slide đang ẩn đặt `inert` và `aria-hidden`.
- Vùng bọc `aria-roledescription="carousel"` và `aria-label`, mỗi slide `role="group"` `aria-roledescription="slide"` `aria-label="2 / 3"`.
- Chữ trên ảnh luôn có lớp `shade`. Chiều cao tối thiểu 480px ở mobile, 460px từ 720px, để slide dài nhất không đẩy giật bố cục.

## Field, Input, Textarea

```tsx
<Field label="Số điện thoại" hint="Để shop gọi xác nhận đơn." error={err}>
  <Input value={phone} onChange={handlePhone} inputMode="tel" autoComplete="tel" />
</Field>
```

`Field` tự nối `id`, `aria-describedby`, `aria-invalid` cho ô bên trong. Focus viền `wood` và vầng 3px `wood-soft`. Lỗi viền `err`, câu báo `role="alert"`. Vô hiệu nền `paper-2`. Nhãn luôn ở trên ô. Quy cách số ở [form.md](form.md).

## Select

Thay `<select>` native. Panel render qua portal nên không bị `overflow: hidden` cắt, tự mở lên khi phía dưới thiếu chỗ.

| Prop | Ghi chú |
|---|---|
| `value`, `onChange` | Bắt buộc, kiểu `string \| number` |
| `options` | `{ value, label, searchText?, disabled? }` hoặc nhóm `{ label, options }` |
| `searchable` | Ô tìm, gõ không dấu vẫn ra. Dùng cho danh sách dài như tỉnh thành |
| `placeholder`, `disabled`, `id`, `ariaLabel`, `className` | |

Trigger cao 44px, mũi tên xoay 180° khi mở. Panel padding 6px, nền `surface`, viền `line`, lớp `--z-popover`. Mục đang chọn chữ đậm màu `wood`.

Bàn phím: ↑ ↓ di chuyển, Enter chọn, Esc đóng, gõ chữ để nhảy tới mục.

## DatePicker, DateTimePicker

Dùng chủ yếu ở CMS: lịch khuyến mãi, lọc đơn hàng, lịch đăng bài. Website không cần chọn ngày ở giai đoạn đầu.

| Prop | Ghi chú |
|---|---|
| `value`, `onChange` | `DatePicker`: `YYYY-MM-DD`. `DateTimePicker`: `YYYY-MM-DDTHH:mm` giờ địa phương. `''` khi chưa chọn |
| `onClear` | Có thì hiện nút "Xóa" |
| `min`, `max` | Chặn ngày, cùng định dạng với `value` |
| `invalid`, `disabled`, `id`, `ariaLabel` | |
| `placeholder` | Mặc định `dd/mm/yyyy` |

**Hành vi**

- Ô nhập số, tự chèn `/` khi gõ. Giá trị chỉ nhận khi hợp lệ và trong khoảng cho phép.
- Panel rộng `min(320px, 100vw - 32px)`, có ba màn: ngày, tháng, năm. Bấm tiêu đề để chuyển màn.
- Tuần bắt đầu từ thứ Hai, đủ 6 hàng để panel không đổi cao. Có nút về hôm nay.
- Bàn phím: mũi tên đi theo ngày và tuần, PageUp, PageDown đổi tháng, Esc đóng và trả focus về ô.
- Panel mở bằng nút lịch hoặc Alt + ↓, không tự mở khi focus ô. Tự mở lên khi phía dưới thiếu chỗ.
- Hôm nay viền trong 1px `wood`. Đang chọn nền `wood`, chữ `on-wood`. Ngoài tháng mờ 0.38. Bị chặn mờ 0.25.
- Ô ngày và nút đạt vùng chạm 44px trên cảm ứng.

`DateTimePicker` gồm `DatePicker` và hai `Select` giờ, phút, có nút "Xóa". Khoảng ngày dùng hai `DatePicker` với `min`, `max` nối nhau; nơi dùng tự kiểm `from <= to`.

Được dùng thư viện headless cho logic ngày nếu không làm nặng bundle, giao diện vẫn theo quy cách này.

## Modal

```tsx
<Modal open={open} onClose={handleClose} title="Xoá sản phẩm">…</Modal>
```

`wide` rộng hơn, `hideClose` ẩn nút đóng. Tự portal, khoá cuộn nền, Esc và bấm nền để đóng, giữ Tab trong modal, trả focus khi đóng. Focus vào khung thay vì ô nhập đầu tiên, vì trên mobile sẽ bật bàn phím che nội dung. Xác nhận xoá dùng `confirmDialog`.

Không mở popup chồng popup. Hành động căn phải, nút chính ngoài cùng. Popup xoá gồm nút giữ lại và nút `danger` nói rõ việc, ví dụ "Giữ lại" và "Xoá sản phẩm".

Chọn loại: popup cho việc ngắn cần quyết định, drawer cho nội dung dài cần vẫn thấy trang phía sau, như giỏ hàng.

## Drawer

Trượt từ cạnh, rộng `min(360px, 88vw)`, cộng thêm `env(safe-area-inset-*)`. Đóng bằng nút đóng, bấm nền, Esc hoặc chọn link. Trên trang có header `backdrop-filter`, drawer phải render ngoài `<header>`.

## Trạng thái

| Component | Props |
|---|---|
| `Skeleton` | Đúng hình nội dung sắp hiện. `width`, `height`, `radius` |
| `EmptyState` | Khung viền đứt `line`, câu đầu nói tình trạng, câu sau mời hành động. `title`, `desc`, `icon`, `action` |
| `ErrorState` | `title`, `desc`, `onRetry` |

## Lựa chọn

| Component | Khi nào | Props |
|---|---|---|
| `RadioGroup` | 2–4 lựa chọn loại trừ, như cách giao hàng | `value`, `options`, `onChange`, `ariaLabel` |
| `Switch` | Một cài đặt có hiệu lực ngay, như bật bán sản phẩm | `checked`, `onChange`, `label` |
| `Checkbox` | Chọn nhiều trong một nhóm, hoặc lựa chọn lẻ trong form | `label` và props của `input` |
| `Tabs` | Các góc nhìn của cùng dữ liệu | `items`, `label`, `value`, `onChange` |

Phép thử: nhãn đọc như "hiện cái gì" thì dùng checkbox, đọc như "bật cái gì" thì dùng switch.

## Bán hàng

| Component | Quy cách |
|---|---|
| `ProductCard` | Quy cách ở mục Thẻ phía trên. Ảnh 1:1, danh mục 13px `ink-3`, tên sans 500 16px tối đa 2 dòng, giá serif 600 20px. Hết hàng có `Tag` "Hết hàng", không ẩn thẻ |
| `Price` | `Intl.NumberFormat('vi-VN')`, không xuống dòng. Giá gốc gạch ngang 14px `ink-3`, chỉ khi có thật |
| `QuantityInput` | Hai nút 44px và ô số, không vượt tồn kho, nói rõ khi chạm giới hạn |
| `CartLine` | Ảnh 72px, tên, đơn giá, số lượng, thành tiền căn phải, nút xoá có nhãn |
| `OrderSummary` | Tạm tính, phí giao, tổng. Tổng serif 600 và `aria-live="polite"` |

## Bố cục trang

| Component | Props |
|---|---|
| `PageFrame` | Khung 1180px và lề |
| `PageHeader` | `title` (H1), `desc`, `crumbs`, `actions` |
| `Section` | Khối có tiêu đề H2 |
| `Card` | Thẻ phẳng có viền, không bóng; hover đổi màu viền |
| `Tag` | `tone`: `neutral`, `wood`, `ok`, `warn`, `err`, `info` |
| `Pagination` | `page`, `totalPages`, `hrefFor`, `label`. Là link thật để crawl được |
| `Dropdown` | Nút và bảng thả xuống, cha giữ trạng thái mở để chỉ một bảng mở một lúc |

## Quy cách

| Phần | Quy cách |
|---|---|
| `Card` | Nền `surface`, viền `edge`, `rounded-3xl`, padding 20–24 (thẻ nhỏ padding 16 thì `rounded-2xl`). Có `href` thì cả thẻ là link, hover `shadow-e2`. Tiêu đề serif 600 20px, meta 13px `ink-3`, thân 14px `ink-2` |
| `Tag` | Cao 22px, padding ngang 8, `rounded-full`, chữ 12px 600. Nền `-soft`, chữ màu đậm cùng tông |
| Badge số | Tròn, nền `wood`, chữ `on-wood` 11px |
| `Tabs` | Hàng nút cách 24px, viền dưới `line`, cuộn ngang khi hẹp. Chữ sans 500 15px `ink-3`, đang chọn gạch dưới 2px `wood`. `role="tablist"`, `tab`, `tabpanel` |
| Bảng dữ liệu (CMS) | Đầu cột 13px 600 `ink-3`, dòng cách nhau bằng viền `line`, cột số tiền căn phải và không xuống dòng, cuộn ngang trong khung riêng |
| Thao tác mỗi dòng (CMS) | Cột cuối "Thao tác" dùng `RowActions`: nút viền "Sửa" (mục đã khoá như đợt nhập đã nhận thì "Xem") và nút thùng rác. Xoá luôn qua `confirmDelete`, hỏi lại và nói rõ cái gì còn giữ. Không xoá được (đơn hàng, đợt đã nhập kho, tài khoản đang đăng nhập) thì ẩn nút thùng rác, không để bấm rồi mới báo lỗi |
| Khối chặn chưa đăng nhập | Dùng cùng mẫu `EmptyState` |

## Ghép trang mới

1. Tạo route, chọn một mẫu trong SKILL.md mục 2, bọc bằng `PageFrame`.
2. Chia nội dung bằng `Section`. Form đặt trên `Card`, danh sách dùng lưới `ProductCard`.
3. Style bằng class Tailwind, chỉ dùng token.
4. Thêm link vào `lib/nav.ts` nếu trang nằm trong menu.
5. Trang công khai làm theo [anchi-seo](../../anchi-seo/SKILL.md).

## Thông báo

Toast cho kết quả của hành động, có tiêu đề đậm và một câu hướng dẫn. Toast lỗi nói sai gì và sửa thế nào. Alert là nền `-soft` nằm trong trang, cho thông tin cố định. Tooltip dùng `shadow-e2`, `rounded-lg`. Toast `rounded-2xl`.
