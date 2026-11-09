# SEO qua CMS

Biên tập sửa title, noindex, redirect mà không cần deploy.

## Nguyên tắc

1. Trường trống thì kế thừa. Thứ tự: hằng số trong code → cấu hình toàn site → cấu hình trang. Trường có giá trị thì thắng.
2. Không đọc được cấu hình SEO thì web chạy bằng hằng số trong code, không crash.
3. Ảnh lưu key, BE ghép URL rồi mới trả client.
4. Web đọc có cache. CMS lưu xong gọi webhook để xoá cache.

## Đã làm (11/2026)

- Trang có slug (sản phẩm, danh mục, bài viết, chủ đề) cài SEO trong form của mục đó: tiêu đề, mô tả, công tắc "Hiện trên Google" (cột `noindex`).
- Trang không có slug (trang chủ, `/san-pham`, `/bai-viet`, `/thiet-ke-vong-tay`, `/gioi-thieu`) cài ở CMS > Cài đặt SEO, lưu Setting `seo-pages`. Danh sách và mặc định ở `apps/api/src/lib/seo-pages.ts`, bản dự phòng khi API lỗi ở `apps/web/src/lib/page-seo.ts`; hai nơi phải khớp. Thêm trang tĩnh mới thì thêm vào cả hai và vào `sitemap.ts`.
- `noindex` bật thì trang có thẻ noindex, ra khỏi sitemap và llms.txt. Trang riêng tư luôn noindex trong code, CMS chỉ liệt kê.
- Mọi trang lẻ có `ogTitle`, `ogDescription`, `ogImageUrl` (form dùng `components/OgFields.tsx`). Trống thì dùng tiêu đề, mô tả trên Google; ảnh trống thì sản phẩm dùng ảnh đầu, bài viết dùng ảnh bìa, còn lại dùng `/brand/default-og.png`.

## Dữ liệu

**Toàn site:** tên và URL site, title và description mặc định, ảnh OG, logo, màu theme, `sameAs`, thông tin đơn vị bán hàng, mã xác minh, id analytics, `noindexSite`.

**Từng trang, sản phẩm, danh mục:** `metaTitle`, `metaDescription`, `slug`, `canonicalUrl`, `robotsIndex`, `robotsFollow`, `ogImage`, `focusKeyword`, `alt` cho từng ảnh, `seoStatus: active | redirect | gone`, `redirectTo`. `lastmod` lấy từ `updatedAt`, không nhập tay.

**Chuyển hướng:** `from` (duy nhất), `to`, `type`, `enabled`, `note`.

## API tối thiểu

```http
GET  /api/v1/seo/settings
GET  /api/v1/seo/page?path=/duong-dan
GET  /api/v1/seo/redirects
POST /api/revalidate        x-revalidate-secret: <bí mật>   { "path": "/duong-dan" }
```

## Web

- `resolveMetadata(path, defaults)` trong `lib/seo.server.ts` gộp ba lớp rồi trả `Metadata`.
- Bảng redirect đọc ở middleware của Next, cache 60s, trả 308 hoặc 410.
- `robots.ts` và layout đọc `noindexSite`. Bật thì `Disallow: /` và không nạp analytics.

## CMS phải kiểm khi lưu

1. Chặn vòng lặp redirect.
2. Làm phẳng chuỗi A→B→C thành A→C.
3. Chuẩn hoá `from`, `slug`: chữ thường, không dấu, bỏ gạch chéo cuối.
4. Đổi slug của trang đã đăng thì tự tạo redirect từ slug cũ.
5. Không cho vừa redirect vừa `noindex`.
6. Trang redirect hoặc gone tự ra khỏi sitemap.

Nên có: xem trước snippet Google và thẻ chia sẻ, đếm ký tự, placeholder hiện giá trị kế thừa.

## Nghiệm thu

- [ ] Sửa title trên CMS, web đổi sau webhook.
- [ ] Để trống title, trang kế thừa mặc định.
- [ ] `noindex` có thẻ noindex và ra khỏi sitemap.
- [ ] Đổi slug, URL cũ chuyển một bước.
- [ ] Tạo redirect vòng lặp bị chặn.
- [ ] Tắt BE, trang đã cache vẫn chạy.
- [ ] Dán link lên Facebook, Zalo hiện đúng ảnh và tiêu đề.
