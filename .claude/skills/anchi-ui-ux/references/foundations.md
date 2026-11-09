# Nền tảng: chữ, khoảng cách, lớp, icon

## Chữ

| Token | Class | Font | Dùng cho |
|---|---|---|---|
| `--serif` | `font-serif` | Playfair Display SC 400 | Tiêu đề, thương hiệu, chữ trong logo, giá tiền |
| `--sans` | `font-sans` | Be Vietnam Pro 400–600 | Nội dung, form, nút, bảng |

Web nạp bằng `next/font/google`, gắn biến `--next-serif`, `--next-sans` lên `<html>`. CMS nạp Be Vietnam Pro và cũng dùng serif cho tiêu đề thương hiệu.

Playfair Display SC là chữ hoa nhỏ: chữ thường hiện thành chữ hoa cỡ nhỏ, tương phản nét dày mảnh cao, khổ chữ rộng. Chỉ nạp và dùng nét 400 cho mảnh (chốt 11/2026), không gắn `font-medium`, `font-semibold` lên `font-serif`. Dùng từ 18px trở lên; không dùng cho đoạn văn, nhãn form, nút hay chữ phụ. `body` đặt `font-variant-numeric: lining-nums`; cột số trong bảng thêm `tabular-nums`, chữ serif có số thì ghi đủ `lining-nums tabular-nums` vì class của Tailwind ghi đè cả hai.

| Cấp | Cỡ / line-height | Kiểu |
|---|---|---|
| Hero | `clamp(40px, 5.6vw, 72px)` / 1.05 | serif 400, `text-balance` |
| H1 | `clamp(32px, 4vw, 48px)` / 1.1 | serif 400 |
| H2 section | `clamp(28px, 3.2vw, 40px)` / 1.12 | serif 400 |
| H2 trong thẻ, khối tối | `clamp(30px, 4vw, 44px)` / 1.1 | serif 400 |
| H3 | 24 / 1.2 | serif 400 |
| H4 | 20 / 1.25 | serif 400 |
| Giá | 28 / 1.2, thẻ sản phẩm 20 | serif 400 |
| Eyebrow | 13 / 1.4, `tracking-wide` | sans 500 màu `wood`, gạch 24px phía trước |
| Lời dẫn | 18 / 1.6 | sans 400 |
| Nội dung | 16 / 1.6 | sans 400 |
| Nhỏ | 14 / 1.5 | sans 400 |
| Chú thích | 12 / 1.4 | sans 400 |

- Đoạn đọc rộng tối đa `68ch`, line-height 1.7–1.75.
- Chữ tối thiểu 12px, nội dung đọc từ 14px.
- Không viết hoa toàn bộ, kể cả class `uppercase`: dấu tiếng Việt viết hoa dễ bị cắt và khó đọc. Vẻ chữ hoa của mẫu thiết kế đến từ chữ hoa nhỏ của Playfair Display SC, không từ `uppercase`. Ngoại lệ duy nhất là chữ trong logo.

## Khoảng cách

Dùng thang Tailwind: `1` 4 · `2` 8 · `3` 12 · `4` 16 · `5` 20 · `6` 24 · `8` 32 · `10` 40 · `12` 48 · `16` 64 · `20` 80 · `24` 96.

| Ngữ cảnh | Giá trị |
|---|---|
| Icon với chữ trong nút | 8 |
| Nhãn với ô nhập | 6 |
| Giữa các trường form | 16 |
| Padding thẻ, popup | 20–24 |
| Giữa các section | 80, từ 960px là 96 (`Section` đã đặt) |
| Tiêu đề section với nội dung | 32 |

Trong một thành phần dùng bước nhỏ (4–16), giữa các khối dùng bước lớn (32–96). Thương hiệu cần khoảng thở, nên khi phân vân chọn bước lớn hơn.

## Bo góc

Phong cách mềm: góc bo lớn, nút dạng viên thuốc.

| Class | px | Dùng cho |
|---|---|---|
| `rounded-full` | | Nút, `IconButton`, mũi tên tròn, tag, badge, avatar, nhóm nút chọn |
| `rounded-3xl` | 24 | Thẻ sản phẩm, thẻ bài viết, tấm nội dung, khối tối, ảnh banner, modal, footer |
| `rounded-2xl` | 16 | Ảnh trong thẻ, thẻ nhỏ padding 16, dropdown, toast, thẻ kính |
| `rounded-xl` | 12 | Ô nhập, Select, khung chat |
| `rounded-[10px]` | 10 | Mục trong panel Select (panel 16, padding 6) |
| `rounded-lg` | 8 | Mục trong dropdown padding 8 |

**Lồng nhau:** bo trong = bo ngoài − padding của khối bọc, để hai đường cong song song. Thẻ `rounded-3xl` padding 8 thì ảnh bên trong `rounded-2xl`. Khối `rounded-full` chỉ đi với phần tử trong `rounded-full`. Padding lớn hơn 8px thì coi là hai khối riêng.

## Bóng

| Class | Dùng cho |
|---|---|
| Không bóng, viền `edge` | Thẻ, tấm nội dung, form |
| `shadow-e1` | Nút gạt |
| `shadow-e2` | Hover thẻ, dropdown, tooltip |
| `shadow-e3` | Thẻ kính nổi trên ảnh, toast, popover |
| `shadow-e4` | Modal, drawer |

## Lớp

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--z-sticky` | 200 | Header, thanh mua dính |
| `--z-dropdown` | 210 | Menu thả xuống |
| `--z-overlay` | 260 | Ngăn kéo menu, giỏ trượt |
| `--z-modal` | 300 | Modal |
| `--z-popover` | 2000 | Panel Select, DatePicker, phải nổi trên modal |
| `--z-toast` | 9999 | Toast |

Viết bằng `z-(--z-modal)`.

## Lưới

`--page-max` 1180px · `--page-gutter` 16px (24px từ 960px) · khe lưới 24px · `--header-h` 64px.

Lưới thẻ sản phẩm: 2 cột trên mobile, 3 từ 720, 4 từ 960. Khe 16, từ 960 là 24.

Bảng theo từng màn hình ở [layout.md](layout.md). **Vùng an toàn:** `env(safe-area-inset-*)` chỉ có tác dụng khi đặt `viewportFit: 'cover'`.

## Chuyển động

Token, thời gian và cách viết ở [motion.md](motion.md).

## Icon

Inline SVG trong một file `components/icons.tsx` của từng app, không dùng thư viện. Khung 24×24, nét 1.5, đầu tròn, `currentColor`, hiển thị 18–22px, `aria-hidden`. Nét mảnh, góc bo mềm, không góc nhọn, để hợp với đường cong logo. Header chỉ dùng icon cho giỏ hàng và tài khoản, kèm `aria-label` và `title`, nút tròn 44px. Không dùng emoji trang trí.

## Nền và tấm

- Nền trang `--paper` kem ấm, trơn. Nội dung đặt trên **tấm** `bg-surface rounded-3xl border-edge`, không viền ở theme sáng.
- Ô phụ bên trong tấm, ảnh chưa có, nền icon dùng `paper-2` hoặc `wood-soft`.
- Ảnh lớn luôn bo `rounded-3xl`, ảnh trong thẻ `rounded-2xl`. Hover thẻ: ảnh phóng 1.03 trong `--d-slow`, thẻ nổi `shadow-e2`, mũi tên tròn chuyển nền `wood`.
- **Thẻ kính** nổi trên ảnh (`bg-glass backdrop-blur-md shadow-e3 rounded-2xl`) chỉ từ 720px, chứa thông tin thật như phí giao, cách đặt hàng. Dưới 720px thẻ xuống dưới ảnh thành thẻ thường. Không đặt `backdrop-filter` lên phần tử có con `position: fixed`.
- Mỗi trang tối đa một khối tối `night` (xem [colors.md](colors.md)).
- Được dùng đường cong của logo làm hoạ tiết mờ khi banner chưa có ảnh, tối đa một chỗ mỗi trang, không đặt sau chữ nội dung.
