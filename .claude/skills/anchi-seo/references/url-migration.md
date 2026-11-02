# Đổi URL hàng loạt

Làm một lần, đúng, không quay đầu. Thứ hạng thường dao động 2–8 tuần, nên tránh mùa cao điểm: Tết, rằm tháng Giêng, Vu Lan.

## Chuẩn bị

- Xuất Search Console 16 tháng làm mốc.
- Lập danh sách `old-url, new-url` đầy đủ, đối chiếu với URL đang có index. URL không còn nội dung thì 410 hoặc về trang gần nghĩa nhất.
- Lấy top 500 URL theo click làm danh sách kiểm bắt buộc.
- Sửa rule redirect có sẵn để không tạo chuỗi hai bước.
- Kiểm không đụng slug.

## Code

- Route mới giữ nguyên logic, đổi canonical, OG, JSON-LD.
- Route cũ: nội dung tồn tại thì `permanentRedirect`, không thì `notFound()`. Không redirect mù mọi URL, vì URL rác sẽ thành 308 rồi 404.
- Không dùng pattern `/:slug` trong `redirects()` vì nuốt cả route tĩnh.
- Mọi link nội bộ qua helper. Link trong HTML CMS viết lại lúc render, rồi đổi hẳn trong DB.
- Sitemap chỉ có URL mới. Có thể thêm sitemap tạm URL cũ, gỡ sau 4–6 tuần.
- `robots` không chặn URL cũ. Cập nhật link ở email, Zalo, quảng cáo, trang mạng xã hội.

## Kiểm trên test

- URL cũ: 308, đúng đích, đúng một bước.
- URL mới: 200, canonical tự trỏ, có H1, không noindex.
- URL không tồn tại: 404 hoặc 410.
- Route tĩnh không bị bắt nhầm.
- 0 link nội bộ trỏ vào URL redirect.
- Redirect phản hồi dưới 200ms.

## Ngày chuyển

- Deploy thứ 2–3, không deploy cuối tuần hay trước lễ.
- Chạy lại toàn bộ kiểm trên prod. Gửi sitemap mới. Yêu cầu lập chỉ mục cho 10–20 URL top.
- Công cụ "Thay đổi địa chỉ" chỉ dùng khi đổi tên miền.
- Theo dõi hằng ngày 2 tuần, hằng tuần tới tuần 12. Giảm ≤ 20% trong 4 tuần đầu là bình thường. Giảm > 30% quá 6 tuần thì kiểm lại redirect, canonical, link nội bộ.
- Giữ redirect lâu dài, tối thiểu một năm.

**Rollback** chỉ khi lỗi kỹ thuật. Không rollback vì thứ hạng dao động, vì Google phải xử lý hai lần chuyển.
