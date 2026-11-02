# Thương hiệu An Chi Trầm Hương

Quy tắc dùng ở skill `anchi-brand`. Đây là hiện trạng tài sản thương hiệu.

| Tài sản | Trạng thái |
|---|---|
| Tên | An Chi Trầm Hương |
| Logo | Vector ở [design/logo](../../../design/logo/), vẽ lại từ [logo-sample.jpeg](../../../apps/web/public/brand/logo-sample.jpeg) |
| Màu | Đã chốt: gỗ sẫm `#5A3B26`, xem [palette.html](palette.html) |
| Font | Noto Serif, Be Vietnam Pro |
| Tên miền | Chưa có |
| Ảnh sản phẩm | Chưa có |

Logo vector được vẽ lại từ bản JPEG mẫu:

| File | Dùng cho |
|---|---|
| `logo.svg` | Logo đứng đầy đủ. Chỉ dùng khi rộng từ 200px, nhỏ hơn thì dòng "TRẦM HƯƠNG" không đọc được |
| `logo-horizontal.svg` | Biểu tượng bên trái, chữ bên phải, cho ảnh chia sẻ, bao bì, chữ ký email |
| `logo-inline.svg` | Biểu tượng và "AN CHI", không có dòng phụ, cho header web và CMS |
| `logo-mark.svg` | Chỉ biểu tượng, cho ô ảnh trống, hoạ tiết, avatar mạng xã hội |
| `icon.svg` | Favicon, nét đậm hơn, tự đổi màu theo chế độ sáng tối của trình duyệt |

Mỗi file có bản `-on-dark` màu kem `#F0E7DB` cho nền tối; bản thường màu gỗ `#5A3B26`.

So với bản mẫu đã chỉnh:
- Màu đổi từ nâu `#714832` của ảnh mẫu sang đúng gỗ `#5A3B26`.
- Nét mảnh nhất dày thêm khoảng 0,5px ở cỡ gốc để không đứt khi logo nhỏ.
- Dòng "TRẦM HƯƠNG" dựng lại bằng Be Vietnam Pro Medium, giữ đúng vị trí và khoảng cách từng chữ, vì ảnh mẫu quá nhỏ để dò nét sạch.
- Biểu tượng và chữ "AN CHI" giữ hình gốc.

Trong code dùng `BrandMark` và `BrandLogo`. File trong `public` chỉ làm mask nên màu theo chữ xung quanh và tự đổi theo theme. Sửa logo thì sửa ở `design/logo` rồi chép sang `apps/web/public/brand`, `apps/cms/public`, `apps/web/src/app/icon.svg`.
