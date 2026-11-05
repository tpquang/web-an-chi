# Màu sắc

Giá trị lấy từ `design/tokens.css`. Lệch nhau thì file đó là chuẩn. Xem trực quan ở [docs/web/design/palette.html](../../../../docs/web/design/palette.html).

## Màu primary

**Gỗ caramel** là màu điểm nhấn: nút chính, link, mục đang chọn, mũi tên tròn khi hover. Ấm và sáng hơn gỗ sẫm cũ để nút viên thuốc nổi trên nền kem, vẫn đạt 4.5:1 với chữ kem.

| Token | Class | Dùng cho | Sáng | Tối |
|---|---|---|---|---|
| `--wood` | `bg-wood`, `text-wood` | Nút chính, link, mục đang chọn, dòng eyebrow | `#9A5530` | `#E0A47C` |
| `--wood-hover` | `bg-wood-hover` | Hover nút chính | `#7F4425` | `#EBB894` |
| `--wood-soft` | `bg-wood-soft` | Nền icon tròn, nền mục đang chọn, vầng focus | `#F5E7DC` | `#3A261A` |
| `--on-wood` | `text-on-wood` | Chữ trên nền gỗ | `#FFFAF4` | `#1C120C` |
| `--brand` | `text-brand` | Logo. Giữ gỗ sẫm của nhận diện, không đổi theo màu nhấn | `#5A3B26` | `#F0E7DB` |

Ở theme tối chữ trên nút gỗ chuyển sang màu tối, vì gỗ tối sáng hơn. Đừng viết chữ trắng cố định trên nút.

## Khối tối

Một khối nền than gỗ mỗi trang, như slide giới thiệu ở trang chủ. Chữ trên khối tối và trên ảnh dùng cặp `on-night`, không dùng `ink`.

| Token | Class | Dùng cho | Sáng | Tối |
|---|---|---|---|---|
| `--night` | `bg-night`, `text-night` | Nền khối tối; chữ trên nút `light` | `#2B1D15` | `#0C0806` |
| `--on-night` | `text-on-night`, `bg-on-night` | Tiêu đề trên khối tối; nền nút `light` | `#F7EFE6` | `#F7EFE6` |
| `--on-night-2` | `text-on-night-2` | Chữ phụ trên khối tối | `#CDBBA8` | `#CDBBA8` |
| `--shade` | `from-shade`, `via-shade/70` | Lớp chuyển màu dưới chữ khi chữ nằm trên ảnh | `rgba(28,18,12,.82)` | `rgba(8,5,3,.85)` |

Chữ đặt trên ảnh luôn có lớp `shade` phía dưới, đậm nhất ở chỗ có chữ: từ dưới lên ở mobile, từ trái sang từ 720px. Ảnh do shop tải lên nên không giả định ảnh có vùng trống.

## Thang gỗ

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|
| `#F8F3EE` | `#EDE2D7` | `#DCC7B3` | `#C6A588` | `#AE8461` | `#8F6645` | `#734E33` | `#5A3B26` | `#452D1E` | `#2F1F15` | `#1C120C` |

Dùng cho ảnh OG, minh hoạ, biểu đồ. Component dùng token vai trò.

## Màu vai trò

| Token | Dùng cho | Sáng | Tối |
|---|---|---|---|
| `--paper` | Nền trang | `#F7F1EA` | `#15100C` |
| `--paper-2` | Nền ảnh, ô trong thẻ, hover dòng, ô vô hiệu | `#EFE5DA` | `#201812` |
| `--surface` | Thẻ, tấm nội dung, form, popup, dropdown | `#FFFCF8` | `#1C1510` |
| `--ink` | Chữ chính, tiêu đề | `#241912` | `#F0E7DB` |
| `--ink-2` | Chữ phụ, nhãn | `#5C4A3D` | `#C4B5A3` |
| `--ink-3` | Ghi chú, placeholder | `#6B5848` | `#A89887` |
| `--line` | Phân cách, viền bảng, viền dropdown | `#E6DACE` | `#3A2D23` |
| `--line-strong` | Viền ô nhập, checkbox, nút viền | `#8F7A66` | `#7D6A58` |
| `--edge` | Viền thẻ: trong suốt ở sáng, hiện ở tối để tách lớp | `transparent` | `#2E241C` |
| `--brass` | Icon, đường kẻ trang trí | `#A57C2C` | `#C9A45C` |
| `--scrim` | Lớp phủ sau modal | `rgba(36,25,18,.45)` | `rgba(0,0,0,.6)` |
| `--glass` | Thẻ kính nổi trên ảnh, kèm `backdrop-blur-md` | `rgba(255,252,248,.82)` | `rgba(31,24,18,.82)` |

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
| `ink` / `paper` | 15.31 | 15.44 | 4.5 |
| `ink-2` / `paper-2` | 6.75 | 8.73 | 4.5 |
| `ink-3` / `paper-2` | 5.42 | 6.25 | 4.5 |
| `wood` / `paper` | 5.04 | 8.79 | 4.5 |
| `wood` / `paper-2` | 4.55 | 8.14 | 4.5 |
| `wood` / `wood-soft` | 4.67 | 6.64 | 4.5 |
| `on-wood` / `wood` | 5.44 | 8.56 | 4.5 |
| `on-wood` / `wood-hover` | 7.34 | 10.35 | 4.5 |
| `brand` / `paper` | 8.97 | 15.44 | 3 |
| `line-strong` / `surface` | 3.99 | 3.50 | 3 |
| `brass` / `paper` | 3.39 | 8.05 | 3 |
| `on-night` / `night` | 14.31 | 17.52 | 4.5 |
| `on-night-2` / `night` | 8.74 | 10.70 | 4.5 |
| `ok` / `ok-soft` | 5.30 | 6.52 | 4.5 |
| `warn` / `warn-soft` | 4.86 | 7.14 | 4.5 |
| `err` / `err-soft` | 5.94 | 6.17 | 4.5 |
| `info` / `info-soft` | 6.49 | 6.73 | 4.5 |

`wood` trên `paper-2` sát ngưỡng: chữ gỗ đặt trên nền `paper-2` phải từ 14px, đậm 500.

Đổi màu nào thì đo lại cặp đó.

## Tỉ lệ và cách dùng

- Khoảng 70% nền kem và tấm `surface`, 20% chữ, 7% gỗ caramel, 3% khối tối và đồng thau.
- Gỗ caramel chỉ ở vật nhỏ: nút, link, icon, eyebrow. Không phủ lên khối lớn. Khối lớn có màu dùng `night`, tối đa một khối mỗi trang.
- Thẻ không viền ở theme sáng: tách khỏi nền bằng `surface` trên `paper`, viền `edge`. Không dùng `border-line` cho thẻ nội dung.
- `--brass` không dùng làm chữ nội dung vì chỉ đạt 3.39:1 ở theme sáng.
- Logo luôn `text-brand`, không `text-wood`.
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
    { media: "(prefers-color-scheme: light)", color: "#F7F1EA" },
    { media: "(prefers-color-scheme: dark)", color: "#15100C" },
  ],
};
```
