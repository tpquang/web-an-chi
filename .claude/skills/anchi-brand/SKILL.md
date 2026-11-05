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
4. **Ít mà đủ.** Mỗi màn hình một điểm nhấn màu gỗ. Thêm cái thứ hai thì bỏ bớt thứ khác.

## 2. Nhận diện

- **Màu:** gỗ sẫm `#5A3B26` là màu logo (`--brand`). Điểm nhấn giao diện là gỗ caramel `#9A5530` (`--wood`) cho nút và link, trên nền kem `#F7F1EA` với chữ `#241912`, đồng thau `#A57C2C` để trang trí, than gỗ `#2B1D15` cho một khối tối mỗi trang. Theme tối dùng caramel sáng `#E0A47C`, logo màu kem. Bảng đầy đủ ở [colors.md](../anchi-ui-ux/references/colors.md).
- **Chữ:** Cormorant SC là font chính, cho tiêu đề, thương hiệu, giá và chữ trong logo; Be Vietnam Pro cho nội dung. Cả hai đều hỗ trợ tiếng Việt.
- **Logo:** biểu tượng vòng tròn nét thanh ôm chữ A, cạnh đó là chữ "AN CHI" đặt bằng Cormorant SC, bản đứng thêm dòng "TRẦM HƯƠNG" bằng Be Vietnam Pro giãn chữ. Chữ trong logo luôn là chữ thật, không dùng bản chữ đã vẽ thành path. Bản nền sáng màu gỗ, bản nền tối màu kem. Giữ khoảng trống quanh logo tối thiểu bằng chiều cao chữ A trong vòng tròn, không đổ bóng, không kéo méo, không đặt lên ảnh rối. Trong code dùng `BrandMark`, `BrandLogo` (biểu tượng là mask theo `currentColor`, chữ là text), cỡ theo font-size. Bản đứng chỉ dùng khi chữ "AN CHI" từ 36px.
- **Ấn phẩm đi kèm** như ảnh chia sẻ, avatar, bao bì, tem, danh thiếp, chữ ký email: dùng `logo-square.svg`, chữ "AN CHI" đặt bằng Cormorant SC bên cạnh hoặc bên dưới. Quy cách ở [brand.md](../../../docs/web/design/brand.md).
- **Bo góc, bóng:** thẻ phẳng có viền, bóng nâu ấm thay vì đen xám.
- **Ảnh sản phẩm:** ảnh thật của đúng sản phẩm, nền trung tính, ánh sáng ấm, cùng tỉ lệ 1:1 trong lưới. Không dùng ảnh mạng hay ảnh AI để mô tả hàng đang bán.
- **Ảnh chia sẻ:** 1200×630, nền kem hoặc gỗ sẫm, tiêu đề trang bằng Cormorant SC, logo square kèm chữ "AN CHI".

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
| Nhóm khách chính | 22–30 tuổi và 31–45 tuổi, chi tiết ở mục 6 |
| Logo vector | `design/logo`, quy cách từng file ở [brand.md](../../../docs/web/design/brand.md) |
| Tên miền | Chưa chốt, theo dõi ở [backlog](../../../docs/web/backlog/backlog.md) |

## 6. Khách hàng mục tiêu

Website và nội dung ưu tiên hai nhóm đầu. Nhóm 3 phục vụ qua tư vấn trực tiếp, không làm nội dung riêng trên web khi chưa có hàng và giấy tờ xác minh.

| | Nhóm 1: Thư giãn và lối sống | Nhóm 2: Gia đình và thưởng thức | Nhóm 3: Sưu tầm và biếu tặng |
|---|---|---|---|
| Tuổi, thu nhập | 22–30, từ 7 triệu/tháng | 31–45, từ 15 triệu/tháng | Trên 45, từ 20 triệu/tháng |
| Vai trò | Kéo khách mới, mua lặp lại 1–2 tháng/lần | Doanh thu và biên lợi nhuận chính | Giá trị đơn lớn, ít đơn |
| Dùng trầm để | Xông phòng ngủ, góc làm việc, lúc tập yoga, thiền | Thờ cúng gia tiên, xông nhà, phòng trà, đeo vòng | Biếu đối tác, cúng dường, sưu tầm |
| Sản phẩm | Nụ trầm, nhang không tăm, lư gốm mini, bộ khởi đầu | Nhang có tăm, bột trầm xông nhà, vòng tay, chuỗi 108 hạt | Trầm miếng, tượng trầm, vòng trầm chìm nước |
| Mức đơn | 150.000–500.000đ | 300.000–1.500.000đ cho nhang, bột; 1.500.000–5.000.000đ cho vòng | Từ 5.000.000đ |
| Kênh chính | TikTok Shop, Shopee, Instagram, Threads | Facebook, website, Zalo, cửa hàng | Giới thiệu, gặp trực tiếp |
| Lo ngại | Khói cay mắt, mùi gắt, không biết bắt đầu từ đâu | Nhang tẩm hoá chất trên bàn thờ, vòng giả | Nguồn gốc phôi trầm, độ am hiểu người bán |

Viết cho từng nhóm, vẫn theo mục 4:

- **Nhóm 1:** nói về thời điểm và không gian dùng ("cho buổi tối ở nhà", "góc bàn làm việc"), mùi, lượng khói, thời gian cháy. Được viết "thư giãn" như một khoảnh khắc. Không viết "giảm stress", "chữa mất ngủ", "thanh lọc không khí".
- **Nhóm 2:** nói về thành phần, cách nhận biết nhang có phụ gia, phong tục xông nhà, rằm, Tết. Phong thủy, ngũ hành chỉ viết như quan niệm văn hoá ("theo quan niệm phong thủy…"), không hứa "kích tài lộc", "hợp mệnh sẽ may mắn".
- Thuật ngữ trầm tốc, trầm banh, trầm chìm nước, kỳ nam chỉ dùng cho sản phẩm có giấy tờ chứng minh, và giải thích ở lần đầu xuất hiện.

Số liệu thị trường trong bản phân tích khách hàng (số kết quả tìm kiếm, khảo sát mức chi) là giả định nội bộ chưa kiểm chứng, chỉ dùng để định hướng, không đưa lên website hay quảng cáo.
