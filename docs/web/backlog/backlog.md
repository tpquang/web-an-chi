# Backlog website

## Cần chủ dự án quyết định

- [ ] Tên miền chính thức
- [ ] Duyệt logo vector trong `design/logo`, nhất là dòng "TRẦM HƯƠNG" dựng lại bằng Be Vietnam Pro
- [ ] Danh mục, ảnh và thông tin sản phẩm thật thay `sample-data.json`
- [ ] Link gian hàng Shopee, TikTok Shop thật. Dữ liệu mẫu đang trỏ tới trang tìm kiếm của sàn
- [ ] Tài khoản ngân hàng nhận chuyển khoản, cổng thanh toán online, đơn vị vận chuyển, phí giao theo vùng
- [ ] Nội dung chính sách đổi trả, giao hàng, bảo mật
- [ ] Câu chuyện và nguồn hàng thật cho trang `/gioi-thieu` (hiện chỉ nêu nguyên tắc)
- [ ] Xác minh số điện thoại bằng OTP khi tạo tài khoản; hiện dùng mã đơn cũ để xác nhận chủ số
- [ ] Nơi hosting và nơi lưu ảnh

## P0

- [ ] Thông báo đơn mới cho shop (Zalo, email hoặc Telegram)
- [ ] Rate limit cho `POST /orders` và `orders/lookup`
- [ ] Trang chính sách và giới thiệu, link ở footer

## P1

- [ ] Quên mật khẩu, đổi mật khẩu cho tài khoản khách

- [ ] Ảnh OG mặc định và theo trang
- [ ] Đo phễu theo `anchi-growth` mục 7
- [ ] Gợi ý dùng kèm trong toast sau khi thêm vào giỏ (bậc 3 của `anchi-growth`)
- [ ] CI chạy typecheck, build, kiểm tra màu viết cứng; ESLint, test tự động; Dockerfile

## P2

- [ ] Tìm kiếm sản phẩm
- [ ] Mã giảm giá
- [ ] Log có cấu trúc
