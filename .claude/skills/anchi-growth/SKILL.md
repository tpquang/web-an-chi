---
name: anchi-growth
description: Quy tắc tăng trưởng và bán hàng An Chi gồm vị trí CTA, giá và khuyến mãi, quảng cáo, bán kèm, UTM, dữ liệu cá nhân, giữ chân và đo phễu. Dùng khi thêm nút mời mua, popup, banner, mã giảm giá, sản phẩm gợi ý, chạy quảng cáo, gửi Zalo hay email, gắn pixel, hoặc khi người dùng muốn tăng chuyển đổi, doanh thu, giữ chân.
---

# An Chi Growth

Khách mua trầm hương sợ nhất là mua phải hàng giả. Lời mời nào làm khách thấy bị dọa hoặc bị dẫn dắt thì mất nhiều hơn được, nên các luật dưới đây ưu tiên hơn mọi đề xuất bán hàng.

## 1. Luật nền

1. **Thông tin trước, mời sau.** Giá, xuất xứ, phí giao hàng và chính sách đổi trả phải thấy được trước khi khách đặt hàng.
2. **Một màn hình, một nút primary.** Lời mời phụ dùng nút viền hoặc link chữ.
3. **Tối đa 3 điểm chuyển hướng** trên một khung nhìn, tính cả CTA, banner, gợi ý.
4. **Khu đặt hàng sạch.** Trong giỏ và trang thanh toán không có banner, popup, hay link dẫn đi nơi khác.
5. **Bán theo dịp, không bán theo nỗi sợ.** Được viết "Chuẩn bị nhang trầm cho rằm tháng Giêng". Không được viết "Năm nay phạm hạn, nên đốt trầm".
6. **Không hứa công dụng** như "kích tài lộc", "giải hạn", "chữa mất ngủ". Mô tả chất liệu, xuất xứ, cách dùng, ý nghĩa văn hoá.
7. **Không dùng dữ liệu cá nhân để tiếp thị** khi chưa có đồng ý riêng.

## 2. Bậc thang lời mời

| Bậc | Khi nào | Dạng |
|---|---|---|
| 1 | Đang xem danh mục | Thẻ sản phẩm, không nút mua trên thẻ |
| 2 | Đang xem sản phẩm | "Thêm vào giỏ" là nút primary, gần giá |
| 3 | Vừa thêm vào giỏ | Toast có lối vào giỏ, tối đa 3 sản phẩm hợp dùng kèm |
| 4 | Đã mua | Hướng dẫn dùng và bảo quản, không mời mua ngay |

- Luôn ghi giá thật bằng VND. Phí giao hàng hiện trước bước cuối.
- Không popup giảm giá khi khách vừa vào trang.
- Mã giảm giá có điều kiện rõ ràng, hạn dùng thật.

## 3. Quảng cáo

An Chi là site bán hàng, nên **không đặt quảng cáo bên thứ ba** như AdSense trên bất kỳ trang nào, vì chúng có thể dẫn khách sang đối thủ.

| Trang | Banner khuyến mãi của chính shop |
|---|---|
| Trang chủ, danh mục | Được, tối đa một dải, có giữ chỗ cố định |
| Bài viết | Một khối cuối bài, liên quan đến chủ đề |
| Sản phẩm | Chỉ dòng chữ ngắn gần giá |
| Giỏ, thanh toán, tài khoản, chính sách | Không |

**Không bao giờ:** popup toàn màn hình, đồng hồ đếm ngược giả, thông báo "có người vừa mua" giả, dải dính đáy che nút mua.

**Quảng cáo trả phí ra ngoài:** nội dung cũng phải theo luật nền, và phải được rà soát theo quy định quảng cáo hiện hành trước khi chạy. Landing dùng đúng URL có UTM, không tạo trang rác.

**Kỹ thuật:** khối banner tự giữ chỗ để không gây CLS; pixel và script `lazyOnload`, không nạp ở môi trường test.

## 4. Bán kèm

- Gợi ý theo cách dùng thật: nhang đi với lư xông, nụ đi với thác khói. Chỉ gợi ý món còn hàng.
- Dạng mặc định là link chữ cuối khối hoặc thẻ nhỏ, không tự thêm vào giỏ, không chọn sẵn.
- Không chen gợi ý vào giữa form thanh toán.
- Link ra tên miền khác mở tab mới, gắn `utm_source=anchi&utm_medium=<trang>&utm_content=<chi tiết>`.
- Link sang Shopee, TikTok Shop là lời mời phụ: nút viền dưới khối mua của trang sản phẩm và ở footer, không bao giờ là nút primary. Không đặt trong giỏ, thanh toán, trang đơn hàng.
- Mỗi nội dung một bản gốc, không sao chép giữa website và các sàn hay kênh khác.

## 5. Dữ liệu cá nhân

- Chỉ thu thứ cần để giao hàng: tên, điện thoại, địa chỉ. Email và ghi chú là tuỳ chọn.
- Có trang chính sách bảo mật; làm đúng quy định bảo vệ dữ liệu cá nhân hiện hành.
- Không truyền tên, điện thoại, địa chỉ qua URL hay vào công cụ phân tích.
- Nhắc qua email, Zalo chỉ gửi người đã đồng ý riêng, tối đa 2 tin mỗi tháng, theo dịp có thật, có cách huỷ.
- Không chọn sẵn ô đồng ý nhận tiếp thị.

## 6. Giữ chân

| Chỗ rơi | Cách giữ |
|---|---|
| Xem rồi thoát vì chưa tin | Ảnh thật, xuất xứ, chính sách đổi trả, cách phân biệt hàng thật |
| Bỏ giỏ | Giữ giỏ trong trình duyệt, không bắt đăng ký tài khoản |
| Bỏ form đặt hàng | Ít ô, giữ dữ liệu đã nhập, nói rõ phí giao và thời gian giao |
| Mua xong không quay lại | Hướng dẫn dùng và bảo quản, nhắc theo dịp với người đã đồng ý |

## 7. Đo

- Đặt phễu ngay từ đầu: xem sản phẩm → thêm vào giỏ → bắt đầu đặt hàng → đặt thành công → mua lại sau 90 ngày.
- Mỗi khối gợi ý có `utm_content` hoặc tên sự kiện riêng. Tỉ lệ bấm dưới 1% sau 2 tuần thì đổi câu chữ hoặc bỏ.
- Tỉ lệ đặt hàng giảm hơn 10% sau khi thêm một banner hay bước mới thì gỡ khỏi trang đó.
- Giả định chưa kiểm chứng phải ghi rõ, rồi hỏi 3–5 khách thật trước khi làm lớn.
