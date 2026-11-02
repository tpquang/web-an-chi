# Layout và lưới theo màn hình

Layout đổi theo **độ rộng CSS của cửa sổ**, không theo loại máy. Không viết CSS hay JS nhận diện thiết bị.

## Năm bậc

| Bậc | Độ rộng | Lề | Bố cục |
|---|---|---|---|
| XS | Dưới 480 | 16 | Một cột, sản phẩm 2 cột |
| SM | 480–719 | 16 | Một cột, sản phẩm 2 cột |
| MD | 720–959 | 16 | Form và thẻ được chia cột, sản phẩm 3 cột |
| LG | 960–1179 | 24 | Được có cột phụ, sản phẩm 4 cột |
| XL | Từ 1180 | 24 | Như LG. Nội dung dừng ở 1180, phần dư thành lề hai bên |

## Theo loại màn hình

| Màn hình | Cửa sổ | Bậc | Nội dung | Sản phẩm mỗi hàng |
|---|---|---|---|---|
| Mobile nhỏ | 320–360 | XS | 288–328 | 2 |
| Mobile lớn | 390–430 | XS | 358–398 | 2 |
| Máy gập mở | 673 | SM | 641 | 2 |
| Tablet dọc | 768–884 | MD | 736–852 | 3 |
| Tablet ngang | 1024 | LG | 976 | 4 |
| Laptop | 1280–1536 | XL | 1180 | 4 |
| Full HD, 2K | 1920–2560 | XL | 1180 | 4 |

- **Laptop trở lên có cùng một bố cục.** Khác nhau chỉ ở lề hai bên.
- **Màn lớn không kéo giãn nội dung, không tăng cỡ chữ.** Nền có thể tràn viền, nội dung thì không.
- **Xoay ngang, phóng to 200%** làm cửa sổ hẹp lại và rơi về bậc thấp hơn, không xử lý riêng.

## Công thức

Nội dung = `min(1180, cửa sổ − 2 × lề)`.

```tsx
<div className="mx-auto w-full max-w-[calc(var(--page-max)+2*var(--page-gutter))] px-(--page-gutter)">
```

Đặt class này một lần trong component `PageFrame`, trang không tự viết lại. Dải nền tràn viền bọc ngoài `PageFrame`.

## Cột theo mẫu trang

| Mẫu | Dưới 960 | Từ 960 |
|---|---|---|
| Shop | Ảnh trên, khối mua dưới | Ảnh 7 cột, khối mua 5 cột, khối mua dính khi cuộn |
| List | Lọc trong sheet | Lọc 3 cột, lưới 9 cột hoặc lọc trên đủ 12 cột |
| Read | Một cột, cột phụ xuống dưới | Chính 8 cột, phụ 4 cột. Cột phụ tối thiểu 220px |
| App (web) | Tóm tắt đơn lên trên hoặc dính đáy | Form 7 cột, tóm tắt đơn 5 cột |
| CMS | Thanh menu ngang cuộn được | Sidebar 240px, phần còn lại co giãn, không giới hạn 1180 |

| Khối | XS, SM | MD | LG, XL |
|---|---|---|---|
| Form | Một cột | Được hai cột | Được hai cột |
| Bảng rộng | Cuộn trong khung riêng | Cuộn nếu thiếu chỗ | Đủ chỗ |
| Modal | Sheet hoặc toàn màn hình | Hộp giữa màn hình | Hộp giữa màn hình |

## Thẳng hàng

Breadcrumb, tiêu đề trang và mọi khối nội dung dùng chung một mép trái. Breadcrumb chữ 13px, cách H1 12px, vùng bấm tối thiểu 24px, dấu `/` màu `line-strong`, mục cuối một dòng.

- **Không căn giữa khối hẹp** bằng `max-w-*` kèm `mx-auto`.
- Chỉ dùng hai độ rộng: đủ 12 cột, hoặc 8 cột căn trái.
- Các khối xếp dọc trong cùng một luồng có cùng độ rộng.
- Ngoại lệ phải ghi tên trong docs `design/ui.md` của app, như thẻ đăng nhập CMS căn giữa.

## Kiểm tra

Xem tối thiểu ở 320, 390, 768, 1024, 1366 và 1920. Thêm 2560 khi trang có nền tràn viền. Không được có cuộn ngang ở bất kỳ độ rộng nào.
