---
name: anchi-brand
description: Nhận diện thương hiệu An Chi Trầm Hương gồm nguyên tắc, màu gỗ, hai họ chữ, logo, giọng văn tiếng Việt và sự trung thực về sản phẩm. Dùng khi viết nhãn nút, câu báo lỗi, tiêu đề, mô tả sản phẩm, nội dung giao diện, thiết kế ảnh OG, hoặc khi phải quyết định giao diện mà chưa có quy tắc nào nói tới.
---

# An Chi Brand

Bản sắc: chất gỗ trầm, nền kem ấm, chữ có chân thanh mảnh, nhiều khoảng thở.

## 1. Bốn nguyên tắc

Dùng để quyết định khi chưa có quy tắc cụ thể, rồi ghi quyết định lại vào skill tương ứng.

1. **Sản phẩm là nhân vật chính.** Không trang trí nào được làm giảm độ rõ của ảnh, giá và thông tin sản phẩm.
2. **Tĩnh mà không cũ.** Gỗ, đường cong logo, chữ có chân chỉ là điểm nhấn. Bố cục và tương tác phải hiện đại.
3. **Trang nhã, đáng tin.** Không màu chói, không hiệu ứng giật gân, không kiểu chợ giảm giá. Khách đang mua món giá trị và cần tin vào nguồn gốc.
4. **Ít mà đủ.** Mỗi màn hình một điểm nhấn màu gỗ đậm. Thêm cái thứ hai thì bỏ bớt thứ khác.

## 2. Nhận diện

- **Màu:** gỗ sẫm `#5A3B26` là màu chính, trên nền kem `#FBF8F3` với chữ `#2A1C13`, đồng thau `#A57C2C` để trang trí. Theme tối dùng gỗ sáng `#C9A27E`. Bảng đầy đủ ở [colors.md](../anchi-ui-ux/references/colors.md).
- **Chữ:** Noto Serif cho tiêu đề, thương hiệu và giá; Be Vietnam Pro cho nội dung. Cả hai đều hỗ trợ tiếng Việt.
- **Logo:** vòng tròn nét thanh ôm chữ A, chữ "AN CHI" có chân, dòng "TRẦM HƯƠNG" giãn chữ. Bản nền sáng màu gỗ, bản nền tối màu kem. Giữ khoảng trống quanh logo tối thiểu bằng chiều cao chữ A trong vòng tròn, không đổ bóng, không kéo méo, không đặt lên ảnh rối. Trong code dùng `BrandMark`, `BrandLogo` (SVG làm mask, màu theo `currentColor`), không chèn file ảnh logo trực tiếp. Logo đứng đầy đủ chỉ dùng khi rộng từ 200px.
- **Bo góc, bóng:** thẻ phẳng có viền, bóng nâu ấm thay vì đen xám.
- **Ảnh sản phẩm:** ảnh thật của đúng sản phẩm, nền trung tính, ánh sáng ấm, cùng tỉ lệ 1:1 trong lưới. Không dùng ảnh mạng hay ảnh AI để mô tả hàng đang bán.
- **Ảnh chia sẻ:** 1200×630, nền kem hoặc gỗ sẫm, tiêu đề trang, logo.

## 3. Giọng văn

Điềm đạm, rõ ràng, như người bán am hiểu đang tư vấn cho khách lần đầu mua trầm. Xưng hô "bạn".

| Loại | Viết thế này | Không viết |
|---|---|---|
| Nút | "Thêm vào giỏ", "Đặt hàng" | "Gửi", "OK", "Mua ngay kẻo hết!" |
| Lỗi | "Số điện thoại cần đủ 10 chữ số." | "Dữ liệu không hợp lệ" |
| Rỗng | "Giỏ hàng đang trống. Xem các sản phẩm trầm hương để bắt đầu." | "Không có dữ liệu" |
| Sản phẩm | "Vòng 12mm, 18 hạt, mùi ngọt nhẹ khi tiếp xúc với hơi ấm của da." | "Trầm thượng hạng đỉnh cao, số một thị trường." |
| Toast | "Đã thêm vào giỏ. Bạn có thể đặt hàng khi đã chọn xong." | "Thành công!" |

- Tiếng Việt có dấu đầy đủ. Viết hoa đầu câu, không viết hoa toàn bộ. Dòng "TRẦM HƯƠNG" chỉ viết hoa trong logo.
- Giải thích thuật ngữ ở lần đầu xuất hiện, như "trầm tốc", "kỳ nam", "trầm cấy".
- Không mũi tên hay emoji trang trí ở nhãn và CTA.
- Placeholder ví dụ bắt đầu bằng "VD:".
- Bỏ tính từ không kiểm chứng được như "đỉnh cao", "tốt nhất". Thay bằng dữ kiện kiểm tra được: kích thước, trọng lượng, xuất xứ.

## 4. Sự trung thực

- Số liệu tin cậy, đánh giá, lời khách hàng phải có thật. Chưa có số thật thì không hiện.
- Xuất xứ, độ tuổi và loại trầm (tự nhiên, cấy, tăm tre, có phụ gia) phải có căn cứ từ nhà cung cấp hoặc giấy tờ. Chưa xác minh thì để trống, không phỏng đoán.
- Ảnh và mùi hương mô tả đúng hàng khách nhận được.
- Không hứa công dụng chữa bệnh, kích tài lộc, giải hạn. Mô tả chất liệu, cách dùng và ý nghĩa văn hoá.
- Không dọa, không tạo khan hiếm giả. Tồn kho hiển thị là số thật.
- Giá gạch ngang chỉ dùng khi đã thực sự bán ở giá đó.

## 5. Phần riêng của An Chi

| Phần | Giá trị |
|---|---|
| Tên | An Chi Trầm Hương |
| Phần cốt lõi | Trang sản phẩm: ảnh, giá, xuất xứ, cách dùng |
| Hành động chính | Thêm vào giỏ, đặt hàng |
| Nhóm khách dự kiến | Người mua dùng cá nhân, mua làm quà, cần nhang trầm cho thờ cúng và không gian sống |
| Logo vector | `design/logo`, quy cách từng file ở [brand.md](../../../docs/web/design/brand.md) |
| Tên miền | Chưa chốt, theo dõi ở [backlog](../../../docs/web/backlog/backlog.md) |
