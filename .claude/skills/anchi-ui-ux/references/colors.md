# Màu sắc

Giá trị lấy từ `design/tokens.css`. Lệch nhau thì file đó là chuẩn. Xem trực quan ở [docs/web/design/palette.html](../../../../docs/web/design/palette.html).

## Màu primary

**Gỗ sẫm** là màu thương hiệu, cùng họ nhưng đậm hơn màu nâu trong logo mẫu để đủ tương phản khi làm nền nút và chữ.

| Token | Class | Dùng cho | Sáng | Tối |
|---|---|---|---|---|
| `--wood` | `bg-wood`, `text-wood` | Nút chính, link, mục đang chọn | `#5A3B26` | `#C9A27E` |
| `--wood-hover` | `bg-wood-hover` | Hover nút chính | `#734E33` | `#D9B996` |
| `--wood-soft` | `bg-wood-soft` | Nền mục đang chọn, vầng focus | `#EDE2D7` | `#33261B` |
| `--on-wood` | `text-on-wood` | Chữ trên nền gỗ | `#FBF8F3` | `#1C120C` |

Ở theme tối chữ trên nút gỗ chuyển sang màu tối, vì gỗ tối sáng hơn. Đừng viết chữ trắng cố định trên nút.

## Thang gỗ

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|
| `#F8F3EE` | `#EDE2D7` | `#DCC7B3` | `#C6A588` | `#AE8461` | `#8F6645` | `#734E33` | `#5A3B26` | `#452D1E` | `#2F1F15` | `#1C120C` |

Dùng cho ảnh OG, minh hoạ, biểu đồ. Component dùng token vai trò.

## Màu vai trò

| Token | Dùng cho | Sáng | Tối |
|---|---|---|---|
| `--paper` | Nền trang | `#FBF8F3` | `#15100C` |
| `--paper-2` | Khối phụ, hover dòng, ô vô hiệu | `#F1EAE0` | `#1F1812` |
| `--surface` | Thẻ, form, popup, dropdown | `#FFFDFA` | `#1C1510` |
| `--ink` | Chữ chính | `#2A1C13` | `#F0E7DB` |
| `--ink-2` | Chữ phụ, nhãn | `#5F4D40` | `#C4B5A3` |
| `--ink-3` | Ghi chú, placeholder | `#6F5D4D` | `#A89887` |
| `--line` | Viền thẻ, phân cách | `#E0D5C6` | `#3A2D23` |
| `--line-strong` | Viền ô nhập, checkbox | `#8F7A66` | `#7D6A58` |
| `--brass` | Icon, đường kẻ trang trí | `#A57C2C` | `#C9A45C` |
| `--scrim` | Lớp phủ sau modal | `rgba(42,28,19,.45)` | `rgba(0,0,0,.6)` |
| `--glass` | Popup kính mờ | `rgba(255,253,250,.76)` | `rgba(31,24,18,.72)` |

## Trạng thái

Mỗi trạng thái có màu chữ và nền nhạt `-soft`, dùng cho tag và alert.

| Token | Nghĩa | Sáng | Tối |
|---|---|---|---|
| `--ok` / `--ok-soft` | Thành công, còn hàng | `#2F6B4A` / `#E2EEE6` | `#7FB896` / `#1A2B21` |
| `--warn` / `--warn-soft` | Cảnh báo, sắp hết | `#855F14` / `#F5EBD3` | `#D6AB5C` / `#2E2413` |
| `--err` / `--err-soft` | Lỗi, hết hàng | `#A12A1E` / `#F7E3DF` | `#EC8073` / `#361612` |
| `--info` / `--info-soft` | Thông tin | `#2B5573` / `#E0EAF1` | `#86AECB` / `#16242F` |

## Tương phản đã đo

| Cặp | Sáng | Tối | Yêu cầu |
|---|---|---|---|
| `ink` / `paper` | 15.56 | 15.44 | 4.5 |
| `ink-2` / `paper-2` | 6.71 | 8.76 | 4.5 |
| `ink-3` / `paper-2` | 5.25 | 6.27 | 4.5 |
| `wood` / `paper` | 9.49 | 8.06 | 4.5 |
| `on-wood` / `wood` | 9.49 | 7.85 | 4.5 |
| `on-wood` / `wood-hover` | 6.92 | 9.93 | 4.5 |
| `line-strong` / `surface` | 4.02 | 3.50 | 3 |
| `brass` / `paper` | 3.59 | 8.05 | 3 |
| `ok` / `ok-soft` | 5.30 | 6.52 | 4.5 |
| `warn` / `warn-soft` | 4.86 | 7.14 | 4.5 |
| `err` / `err-soft` | 5.94 | 6.17 | 4.5 |
| `info` / `info-soft` | 6.49 | 6.73 | 4.5 |

Đổi màu nào thì đo lại cặp đó.

## Tỉ lệ và cách dùng

- Khoảng 70% nền kem, 20% chữ, 8% gỗ, 2% đồng thau.
- Không phủ gỗ sẫm lên khối lớn, trừ một dải hero hoặc footer mỗi trang.
- `--brass` không dùng làm chữ nội dung vì chỉ đạt 3.59:1 ở theme sáng.
- Bóng ở theme tối gần như vô hình: tách lớp bằng viền `--line` và `--surface` trên `--paper`.
- Canvas đọc token bằng `getComputedStyle` và đọc lại khi đổi theme.

## Đề xuất theme

- **Sáng là theme thiết kế gốc**, vì khớp logo nền kem và ảnh sản phẩm trông thật màu hơn. Ảnh OG, tài liệu in và ảnh quảng cáo luôn dùng theme sáng.
- **Tối đầy đủ như sáng.** Lần đầu theo cài đặt thiết bị, người dùng đổi được và được lưu lại. Nền tối nâu than, không đen tuyệt đối, để giữ cảm giác gỗ.
- Ảnh nền trắng không đảo màu. Đặt ảnh trong khung `bg-surface` có viền.
- Logo trên nền tối dùng bản màu kem `#F0E7DB`.

## Theme

- Trạng thái nằm trên `<html data-theme="light|dark">`.
- Thường không cần khối theme riêng vì token tự đổi. Chỉ viết khi đổi thứ không phải màu, như ẩn hiện ảnh.
- Khoá lưu lựa chọn là `anchi-theme`, đọc bằng script trong `<head>`, component không tự đọc `localStorage`.

Màu thanh trình duyệt đổi theo thiết bị:

```ts
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF8F3" },
    { media: "(prefers-color-scheme: dark)", color: "#15100C" },
  ],
};
```
