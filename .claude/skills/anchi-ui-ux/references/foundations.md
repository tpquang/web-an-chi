# Nền tảng: chữ, khoảng cách, lớp, icon

## Chữ

| Token | Class | Font | Dùng cho |
|---|---|---|---|
| `--serif` | `font-serif` | Cormorant SC 400–700 | Tiêu đề, thương hiệu, chữ trong logo, giá tiền |
| `--sans` | `font-sans` | Be Vietnam Pro 400–600 | Nội dung, form, nút, bảng |

Web nạp bằng `next/font/google`, gắn biến `--next-serif`, `--next-sans` lên `<html>`. CMS nạp Be Vietnam Pro và cũng dùng serif cho tiêu đề thương hiệu.

Cormorant SC là chữ hoa nhỏ: chữ thường hiện thành chữ hoa cỡ nhỏ, mặt chữ thấp, nét mảnh. Dùng từ 18px trở lên và độ đậm từ 500; không dùng cho đoạn văn, nhãn form, nút hay chữ phụ. `body` đặt `font-variant-numeric: lining-nums`; cột số trong bảng thêm `tabular-nums`, chữ serif có số thì ghi đủ `lining-nums tabular-nums` vì class của Tailwind ghi đè cả hai.

| Cấp | Cỡ / line-height | Kiểu |
|---|---|---|
| Hero | `clamp(40px, 5.6vw, 72px)` / 1.05 | serif 500 |
| H1 | `clamp(32px, 4vw, 48px)` / 1.1 | serif 500 |
| H2 | 32 / 1.15 | serif 500 |
| H3 | 24 / 1.2 | serif 600 |
| H4 | 20 / 1.25 | serif 600 |
| Giá | 28 / 1.2, thẻ sản phẩm 20 | serif 600 |
| Lời dẫn | 18 / 1.6 | sans 400 |
| Nội dung | 16 / 1.6 | sans 400 |
| Nhỏ | 14 / 1.5 | sans 400 |
| Chú thích | 12 / 1.4 | sans 400 |

- Đoạn đọc rộng tối đa `68ch`, line-height 1.7–1.75.
- Chữ tối thiểu 12px, nội dung đọc từ 14px.
- Không viết hoa toàn bộ, kể cả class `uppercase`: dấu tiếng Việt viết hoa dễ bị cắt và khó đọc.

## Khoảng cách

Dùng thang Tailwind: `1` 4 · `2` 8 · `3` 12 · `4` 16 · `5` 20 · `6` 24 · `8` 32 · `10` 40 · `12` 48 · `16` 64 · `20` 80 · `24` 96.

| Ngữ cảnh | Giá trị |
|---|---|
| Icon với chữ trong nút | 8 |
| Nhãn với ô nhập | 6 |
| Giữa các trường form | 16 |
| Padding thẻ, popup | 20–24 |
| Giữa các section | 48–96 |

Trong một thành phần dùng bước nhỏ (4–16), giữa các khối dùng bước lớn (32–96). Thương hiệu cần khoảng thở, nên khi phân vân chọn bước lớn hơn.

## Bo góc

`rounded-xs` 2 tag nhỏ · `rounded-sm` 4 tag, tooltip · `rounded-md` 6 nút, ô nhập · `rounded-lg` 8 thẻ, ảnh, dropdown · `rounded-xl` 12 popup · `rounded-full` badge, avatar.

Bo góc tăng theo kích thước và độ nổi, popup bo nhiều nhất.

**Lồng nhau:** bo trong = bo ngoài − padding của khối bọc, để hai đường cong song song. Khối `rounded-full` chỉ đi với phần tử trong `rounded-full`. Padding lớn hơn 8px thì coi là hai khối riêng.

## Bóng

| Class | Dùng cho |
|---|---|
| Không bóng, có viền | Thẻ, form |
| `shadow-e1` | Nổi nhẹ |
| `shadow-e2` | Dropdown, tooltip |
| `shadow-e3` | Toast, popover |
| `shadow-e4` | Popup, drawer |

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

## Nền

Mặc định trơn `--paper`. Form, popup, thẻ luôn đặt trên `--surface`. Được dùng đường cong của logo làm hoạ tiết mờ ở hero, tối đa một chỗ mỗi trang, không đặt sau chữ nội dung.
