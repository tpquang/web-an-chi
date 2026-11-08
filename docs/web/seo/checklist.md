# Checklist SEO website

Quy tắc ở skill `anchi-seo`. Trước khi ra mắt: đặt `NEXT_PUBLIC_SITE_URL` đúng domain thật và `SITE_INDEXING=on`. Thiếu biến này thì toàn site noindex và `robots.txt` chặn hết, đúng ý cho dev và bản test.

## Đã có

- [x] Render phía server, `lang="vi"`, URL không dấu, link sinh từ `lib/links.ts`
- [x] Title, description cắt theo ranh giới từ, canonical tuyệt đối ở mọi trang công khai
- [x] BE trả 404 thì trang 404; BE lỗi thì trang chưa cache trả 500, trang đã cache vẫn chạy (đã thử tắt API)
- [x] Fetch tới API có timeout 8 giây
- [x] Sitemap gồm trang chủ, danh mục, sản phẩm đủ điều kiện index, bài viết, chủ đề; BE lỗi thì sitemap lỗi, không rút gọn
- [x] Noindex toàn site theo `SITE_INDEXING`
- [x] Sản phẩm chưa có ảnh hoặc mô tả: `noindex, follow` và không vào sitemap. Toàn bộ sản phẩm mẫu đang ở trạng thái này
- [x] Giỏ, đặt hàng, đơn hàng, tra cứu: `noindex`
- [x] `PageBreadcrumb` sinh cả phần hiển thị và `BreadcrumbList` từ một danh sách
- [x] JSON-LD `Organization` (kèm `logo`, `sameAs` từ CMS > Thông tin cửa hàng), `WebSite`, `Product` + `Offer` (kèm `brand`, `sku`, `shippingDetails`, chỉ xuất khi sản phẩm đủ điều kiện index), `Article`, qua `safeJsonLd`
- [x] Header bảo mật trong `next.config.ts`, HSTS khi site chạy https, tắt `X-Powered-By`
- [x] GA4 theo `NEXT_PUBLIC_GA_ID`, chỉ nạp khi `SITE_INDEXING=on`; sự kiện `add_to_cart`, `purchase`
- [x] Phân trang `?trang=N` bằng link thật; `?trang=1` và trang vượt quá trả 404
- [x] `next/image` cho ảnh sản phẩm, chỉ nhận tên miền trong `IMAGE_HOSTNAMES`
- [x] Trang sản phẩm và bài viết dựng ở lần xem đầu rồi cache (ISR)

## Còn thiếu

- [ ] Ảnh OG 1200×630 mặc định và theo bài (mục 4)
- [ ] Trang 500 trả HTML rỗng chờ JS dựng giao diện lỗi; mã 500 đúng nhưng người dùng tắt JS không thấy chữ
- [ ] Bảng redirect và tự tạo redirect khi đổi slug (mục 3, `cms-seo.md`)
- [ ] Webhook xoá cache khi lưu trên CMS; hiện web cập nhật sau tối đa 60 giây
- [ ] Đo ngân sách hiệu năng, Lighthouse (mục 10)
- [ ] Trang giới thiệu, chính sách giao hàng, đổi trả, bảo mật (mục 8)
