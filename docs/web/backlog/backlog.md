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
- [ ] Phí hộp quà, giấy bọc quà cho vòng tự thiết kế: hiện chưa tính, chỉ ghi "shop báo phí khi gọi xác nhận"
- [ ] Chuỗi 108 hạt có bắt buộc hạt chủ và tua không (hiện mặc định có, khách bỏ tick được)
- [ ] Vòng đơn có cần dài hơn 30 cm không (giới hạn 200 hạt chỉ chạm được với chuỗi)
- [ ] Sản phẩm hộp tròn: nhãn in ghi 30 nụ, dữ liệu sản phẩm vẫn ghi 25 nụ
- [x] Trang sản phẩm thường: thêm vào giỏ mở bảng giỏ hàng như vòng tự thiết kế (11/2026)

## P0

Kế hoạch đang làm: [2026-11-hoan-thien-goal.md](../plans/2026-11-hoan-thien-goal.md).

- [ ] Thông báo đơn mới cho shop (Zalo, email hoặc Telegram)
- [x] Rate limit cho `POST /orders`, `orders/lookup`, huỷ đơn
- [x] Trang chính sách và giới thiệu, link ở footer
- [x] Đổi mật khẩu tài khoản khách
- [x] Trang bảo hành, chính sách đại lý, cộng tác viên (soạn ở CMS)
- [x] Đăng nhập Google (cần shop tạo OAuth client, xem `docs/setup.md`)
- [x] Xem mô hình 3D `.glb` của sản phẩm

## P1

- [ ] Nối Facebook Page, Zalo OA vào Hộp thư (cần duyệt ứng dụng Meta, OA đã xác minh, tên miền HTTPS)
- [ ] Thông báo tin chat mới cho nhân viên khi không mở CMS (Zalo, email hoặc thông báo trình duyệt)
- [ ] Gửi ảnh trong chat
- [ ] Quên mật khẩu (cần kênh OTP)
- [ ] Hiện charm `.glb` trên vòng tự thiết kế (CMS đã tải được, web chưa dùng)
- [ ] Đo phễu theo `anchi-growth` mục 7
- [ ] Gợi ý dùng kèm trong bảng giỏ hàng sau khi thêm vào giỏ (bậc 3 của `anchi-growth`)
- [ ] CI chạy typecheck, build, kiểm tra màu viết cứng; ESLint, test tự động; Dockerfile

## P2

- [ ] Tìm kiếm sản phẩm
- [ ] Mã giảm giá
- [ ] Log có cấu trúc
