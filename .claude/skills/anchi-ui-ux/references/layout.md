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

## Trang chủ

Theo mẫu thiết kế: nền kem, tấm bo lớn, một khối tối. Thứ tự cố định, không thêm khối khác khi chưa ghi vào đây.

| Khối | Dưới 960 | Từ 960 | Nguồn nội dung |
|---|---|---|---|
| Banner | Chữ trên, ảnh 4:3 dưới, hai thẻ thông tin xếp dưới ảnh | Chữ 6 cột, ảnh 6 cột tỉ lệ 5:6, thẻ kính nổi góc phải dưới ảnh | CMS `/home`: eyebrow, tiêu đề H1, lời dẫn, ảnh, hai nút. Thẻ thông tin lấy từ cấu hình cửa hàng |
| Chờ ngày mở bán (chỉ trước giờ mở bán) | Tấm `surface`: chữ trên, đếm ngược dưới | Chữ 7 cột, đếm ngược 5 cột căn phải | `lib/launch.ts`, ngày đặt bằng `NEXT_PUBLIC_LAUNCH_AT` |
| Sản phẩm nổi bật | 2 cột | 4 cột | Sản phẩm bật nổi bật, tối đa 4. Không có thì ẩn khối |
| Slide giới thiệu | Chữ dưới, lớp tối từ dưới lên | Chữ trái tối đa 576px, lớp tối từ trái sang | CMS `/home`, 1–6 slide |
| Bài viết nổi bật | 1 cột, 2 cột từ 720 | 3 cột | Bài bật nổi bật, tối đa 3. Không có thì lấy 3 bài mới nhất |
| Footer | Một cột | Ba cột trong tấm `rounded-3xl` | Cấu hình cửa hàng |

Không đưa số liệu chưa kiểm chứng như "10K+ khách hài lòng" hay ảnh đại diện khách vào banner, theo `anchi-brand`.

## Thiết kế vòng tay (11/2026)

| Phần | Dưới 960 | Từ 960 |
|---|---|---|
| Cài đặt | Form theo bước: Loại vòng → Hạt trầm (cỡ rồi loại) → Cổ tay và kiểu đeo. Thanh tiến trình 3 vạch. Bước mới trượt 24px và hiện dần (`--d-page`), tiến vào từ phải, lùi vào từ trái. "Quay lại" bên trái, nút tiến luôn ở mép phải | Một hàng gọn trên khu thiết kế: Loại vòng, Cỡ hạt, Loại trầm, nút viền "Dựng lại vòng". Đổi lựa chọn chưa thay vòng, bấm nút mới dựng lại |
| Thiết kế | Sheet toàn màn hình, kho hạt ở đáy | Cột trái 4: kho hạt, hạt chủ và tua (chuỗi, mặc định có), cổ tay, khối chốt vòng (tạm tính, nút lưu vào giỏ hoặc đặt chờ), Ghi chú, chi tiết hạt. Cột phải 8: vòng 3D tỉ lệ 4:3, dính khi cuộn |

- Bấm hạt trong kho chỉ thêm một hạt; không có thao tác dựng lại cả vòng từ một hạt. Đổi loại vòng, cỡ hạt, loại trầm đi qua phần cài đặt.
- Ô cổ tay gọn hai dòng ("Cổ tay 15 cm", "Khuyên dùng 16,5 cm (22 hạt 8 mm)"), nút cài đặt mở phần chỉnh số đo và kiểu đeo. Chuỗi quấn nhiều vòng không hiện "Khuyên dùng".
- Ghi chú gồm loại dây, hộp quà, bọc giấy quà, thiệp kèm lời nhắn (tối đa 200 chữ), yêu cầu khác (tối đa 300 chữ). Lưu kèm thiết kế vào đơn và hiện ở CMS chi tiết đơn.
- Hạt trong kho: hạt đứng riêng có bóng đổ, nhãn mô tả treo bên trái nối bằng một đường mảnh, con trỏ bàn tay (`cursor-grab`). Khi đeo thử ghi rõ "Tay mẫu: cổ tay N cm".
- Một vòng tối đa 200 hạt và charm (`braceletRules.maxBeads`); vòng đơn còn giới hạn dài 30 cm.

## Thẳng hàng

Breadcrumb, tiêu đề trang và mọi khối nội dung dùng chung một mép trái. Breadcrumb chữ 13px, cách H1 12px, vùng bấm tối thiểu 24px, dấu `/` màu `line-strong`, mục cuối một dòng.

- **Không căn giữa khối hẹp** bằng `max-w-*` kèm `mx-auto`.
- Chỉ dùng hai độ rộng: đủ 12 cột, hoặc 8 cột căn trái.
- Các khối xếp dọc trong cùng một luồng có cùng độ rộng.
- Ngoại lệ phải ghi tên trong docs `design/ui.md` của app, như thẻ đăng nhập CMS căn giữa.

## Kiểm tra

Xem tối thiểu ở 320, 390, 768, 1024, 1366 và 1920. Thêm 2560 khi trang có nền tràn viền. Không được có cuộn ngang ở bất kỳ độ rộng nào.

Trang bán hàng (sản phẩm, giỏ, thanh toán, thiết kế vòng) và trang mới làm xem đủ bảng sau, cả sáng lẫn tối:

| Nhóm | Độ rộng CSS | Ghi chú |
|---|---|---|
| Mobile | 320, 360, 390, 430 | iPhone SE, Android phổ thông, iPhone thường, Pro Max |
| Tablet, iPad dọc | 744, 768, 820, 834 | iPad mini, iPad, iPad Air, iPad Pro 11" |
| iPad ngang | 1024, 1180, 1194, 1366 | **1180 nằm đúng mốc `xl`**: xem kỹ chỗ đổi bố cục |
| Laptop 13" | 1280, 1366, 1440 | MacBook Air 13" mặc định 1440×900 (một số máy 1470) |
| Laptop 14" | 1512 | MacBook Pro 14" |
| Laptop 15–16" | 1536, 1728 | Windows 15.6" scale 125%, MacBook Pro 16" |
| HD, Full HD | 1366, 1920 | |
| 2K | 2560 | Nội dung vẫn dừng ở 1180, kiểm lề hai bên và nền tràn viền |

Cũng xem chiều cao thấp (laptop 1366×650 sau thanh trình duyệt, điện thoại ngang 390 cao): khối mua dính, drawer, modal không bị che nút chính.
