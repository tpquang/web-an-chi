# Khung nội dung theo loại trang

Thứ tự section từ trên xuống. Mọi section SEO render ở server.

## Trang chủ

```
Hero: H1 có từ khoá + câu dẫn + một nút primary
Danh mục chính: 3–6 thẻ
Sản phẩm tiêu biểu: 4–8 thẻ
Vì sao tin An Chi: nguồn hàng, cách kiểm tra, đổi trả. Chỉ dữ kiện thật
Cách chọn trầm: ≤ 200 chữ, dẫn sang trang hub
Bài viết mới: 3–4 bài
Câu hỏi thường gặp
```

Khoảng 500–800 chữ. Bằng chứng xã hội chỉ dùng số thật.

## Danh mục

```
Breadcrumb
H1 + mô tả 80–150 chữ
Bộ lọc (không index)
Lưới sản phẩm, phân trang bằng link thật
Hướng dẫn chọn: 200–400 chữ
Danh mục liên quan, bài viết liên quan
```

JSON-LD: BreadcrumbList.

## Sản phẩm

```
Breadcrumb
Ảnh | H1, giá, tình trạng còn hàng, chọn số lượng, nút Thêm vào giỏ (primary duy nhất)
Thông số: chất liệu, xuất xứ, kích thước, trọng lượng
Mô tả riêng: 150–300 chữ
Cách dùng và bảo quản
Giao hàng, đổi trả
Sản phẩm dùng kèm: tối đa 4
Bài viết liên quan
Câu hỏi thường gặp nếu có câu hỏi thật
```

JSON-LD: BreadcrumbList, Product kèm Offer.

## Bài viết

```
Breadcrumb
H1 + tóm tắt + tác giả, ngày cập nhật
Mục lục (bài > 1.200 chữ)
Nội dung H2/H3
Tóm tắt nhanh
Sản phẩm liên quan: tối đa 3, cuối bài
Bài liên quan: 4–6
```

JSON-LD: BreadcrumbList, Article.

## Giỏ hàng, đặt hàng, tra cứu đơn

`noindex`. Không banner, không gợi ý chen vào form. Sau khi đặt: mã đơn, việc xảy ra tiếp theo, cách liên hệ.

## Trang tin cậy

Giới thiệu: chúng tôi là ai · nguồn hàng · nguyên tắc · số liệu thật · liên hệ khớp Organization JSON-LD.

Chính sách: giao hàng, đổi trả, thanh toán, bảo mật. Câu chữ rõ, có ngày cập nhật, link ở footer.

## Bản đồ liên quan

Mỗi trang tối đa 4 khối liên quan theo thứ tự: sản phẩm cùng danh mục, sản phẩm dùng kèm, bài cùng chủ đề, danh mục liên quan. Dùng `<a href>` render server. Nên gắn bằng tag trên CMS để biên tập tự cập nhật.
