# Thương hiệu An Chi Trầm Hương

Quy tắc dùng ở skill `anchi-brand`. Đây là hiện trạng tài sản thương hiệu.

| Tài sản | Trạng thái |
|---|---|
| Tên | An Chi Trầm Hương |
| Logo | Vector ở [design/logo](../../../design/logo/), vẽ lại từ [logo-sample.jpeg](../../../apps/web/public/brand/logo-sample.jpeg) |
| Màu | Đã chốt: gỗ sẫm `#5A3B26`, xem [palette.html](palette.html) |
| Font | Cormorant SC cho tiêu đề, thương hiệu, giá và chữ trong logo; Be Vietnam Pro cho nội dung |
| Tên miền | Chưa có |
| Ảnh sản phẩm | Chưa có |

Logo gồm biểu tượng (chữ A trong vòng tròn) và chữ "AN CHI" đặt bằng font Cormorant SC, độ đậm 600, giãn chữ 0,12em. Bản đứng thêm dòng "TRẦM HƯƠNG" bằng Be Vietnam Pro Medium, cỡ 0,3 lần chữ "AN CHI", giãn chữ 0,45em. Chữ là chữ thật, không vẽ thành path, nên sửa được và sắc nét ở mọi cỡ.

| File | Dùng cho |
|---|---|
| `logo-square.svg` | Biểu tượng trong khung vuông 120×120 có lề sẵn. Dùng cho mọi ấn phẩm đi kèm: ảnh chia sẻ, avatar mạng xã hội, bao bì, tem, danh thiếp, chữ ký email. Chữ "AN CHI" đặt cạnh hoặc dưới bằng Cormorant SC |
| `logo-mark.svg` | Biểu tượng sát mép, dùng trong code để ghép với chữ (`BrandLogo`) và cho ô ảnh trống |
| `icon.svg` | Favicon, nét đậm hơn, tự đổi màu theo chế độ sáng tối của trình duyệt |
| `logo.svg`, `logo-horizontal.svg`, `logo-inline.svg` | Bản cũ có chữ "AN CHI" vẽ thành path. Chỉ giữ để tham khảo, không dùng cho ấn phẩm mới |

Mỗi file có bản `-on-dark` màu kem `#F0E7DB` cho nền tối; bản thường màu gỗ `#5A3B26`.

So với bản mẫu đã chỉnh:
- Màu đổi từ nâu `#714832` của ảnh mẫu sang đúng gỗ `#5A3B26`.
- Nét mảnh nhất dày thêm khoảng 0,5px ở cỡ gốc để không đứt khi logo nhỏ.
- Dòng "TRẦM HƯƠNG" dựng lại bằng Be Vietnam Pro Medium, giữ đúng vị trí và khoảng cách từng chữ, vì ảnh mẫu quá nhỏ để dò nét sạch.
- Biểu tượng và chữ "AN CHI" giữ hình gốc.

Trong code dùng `BrandMark` và `BrandLogo`. `BrandLogo` ghép `logo-mark.svg` với chữ thật, cỡ theo font-size nơi dùng (`text-2xl`, `text-5xl`). File trong `public` chỉ làm mask nên màu theo chữ xung quanh và tự đổi theo theme. Sửa biểu tượng thì sửa ở `design/logo` rồi chép sang `apps/web/public/brand`, `apps/cms/public`, `apps/web/src/app/icon.svg`.
