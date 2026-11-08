---
name: anchi-seo
description: Quy tắc SEO An Chi cho website Next.js gồm render server, mã trạng thái 404/500, canonical, metadata, redirect 308, phân trang, lọc, breadcrumb, JSON-LD Product, sitemap, bản đồ từ khoá, khung nội dung theo loại trang, SEO qua CMS và ngân sách hiệu năng. Dùng khi tạo trang công khai, đổi URL, viết title hay description, thêm hoặc sửa breadcrumb, sửa sitemap, robots, thêm bài viết hay sản phẩm, audit SEO, kể cả khi người dùng chỉ nói "thêm trang mới", "đổi đường dẫn", "Google chưa index".
---

# An Chi SEO

| Việc | File |
|---|---|
| Sắp xếp section và nội dung của từng loại trang | [references/page-blueprints.md](references/page-blueprints.md) |
| Cho biên tập sửa SEO không cần deploy | [references/cms-seo.md](references/cms-seo.md) |
| Đổi URL hàng loạt | [references/url-migration.md](references/url-migration.md) |
| Kiểm sau deploy, chạy từ gốc repo | `node .claude/skills/anchi-seo/scripts/check-sitemap.mjs <url>` và `check-env-noindex.mjs <url> --expect=index` |

Tình trạng hiện tại của website ghi ở [docs/web/seo/checklist.md](../../../docs/web/seo/checklist.md).

## 1. Render

- Nội dung chính nằm trong HTML server: `curl -A Googlebot` phải thấy H1, đoạn đầu, giá, link `<a href>`.
- Phần nằm dưới `useSearchParams` hoặc Suspense có thể không vào HTML. Tách phần cần index lên server.
- Ưu tiên tĩnh hoặc ISR. Route đọc `searchParams` thì chấp nhận động.
- Giỏ hàng và trạng thái người dùng để ở client, không làm cả trang thành client.

## 2. Mã trạng thái

- Không tồn tại → 404 thật. BE lỗi hoặc quá tải → 500. Coi lỗi là không tồn tại sẽ khiến Google bỏ index trang đang tốt, nên loader chỉ trả null khi BE trả 404, lỗi khác ném tiếp.
- Không để trang lỗi trả 200 kèm câu báo lỗi, đó là soft 404. Không thêm `loading.tsx` cho route động vì nó stream sớm với status 200.
- Sản phẩm ngừng bán hẳn → 308 về danh mục gần nhất hoặc 410, không dồn về trang chủ. Hết hàng tạm thời vẫn trả 200, ghi `OutOfStock`.
- Chuyển hướng dùng 308, không 307, không redirect bằng JS.

## 3. URL và từ khoá

- Mỗi URL một cụm chính, hai URL không nhắm cùng cụm. Ghi trong [bản đồ từ khoá](../../../docs/web/seo/keyword-map.md) và đối chiếu số liệu trước khi đổi title.
- URL ngắn, không dấu, gạch ngang. Trang theo mùa không gắn năm để tích luỹ thứ hạng.
- Cấu trúc cố định: `/san-pham`, `/san-pham/<slug>`, `/danh-muc/<slug>`, `/bai-viet`, `/bai-viet/<slug>`, `/chu-de/<slug>` (chủ đề bài viết). Trang tin cậy: `/gioi-thieu`. Trang riêng tư (noindex): `/gio-hang`, `/thanh-toan`, `/don-hang/<mã>`, `/tra-cuu-don-hang`, `/dang-nhap`, `/dang-ky`, `/tai-khoan`.
- Chủ đề bài viết không lồng dưới `/bai-viet/` để không tranh slug với bài.
- Đổi URL phải kèm 308 một bước. Không làm vào mùa cao điểm như rằm tháng Giêng, Vu Lan, Tết.
- Đổi slug trên CMS thì API tự ghi redirect (`apps/api/src/lib/redirects.ts`). Trang slug gọi `notFoundOrRedirect` (`apps/web/src/lib/redirect.ts`, chỉ server) thay cho `notFound()`. Tiền tố đường dẫn trong `PATH_PREFIX` phải khớp `lib/links.ts`.
- Link nội bộ trỏ thẳng đích, sinh từ helper như `productHref`, không viết tay.
- Không chặn URL cũ trong `robots`, vì Google sẽ không thấy redirect.
- Route tĩnh mới phải kiểm không trùng slug CMS.

## 4. Metadata

- Mỗi trang công khai: title riêng, description 120–158 ký tự cắt theo ranh giới từ, canonical tuyệt đối.
- Title cả hậu tố không quá khoảng 65 ký tự. Không lặp tên site khi tên trang trùng tên site.
- Đúng một H1 trong HTML server, chứa cụm từ khoá, cùng chủ đề với title.
- Ảnh OG 1200×630. Sản phẩm có ảnh thì dùng ảnh sản phẩm.
- Trang riêng tư như giỏ, thanh toán, tra cứu đơn: `noindex`. Page `'use client'` không export được metadata, nên tách page server và component client.
- Sản phẩm mỏng, chưa có mô tả và ảnh thật: `noindex, follow` tới khi đủ.

## 5. Tìm kiếm, lọc, phân trang

- URL tìm kiếm hoặc lọc: `noindex, follow`, canonical về URL gốc. Bộ lọc đủ nhu cầu tìm kiếm thì làm thành danh mục riêng.
- Phân trang: `?trang=N` bằng `<Link>`, canonical tự trỏ. Không dùng nút chỉ đổi state, không dùng cuộn vô hạn thay phân trang.

## 6. Breadcrumb

- Mọi trang công khai có breadcrumb, trừ trang chủ.
- Dùng một component `PageBreadcrumb`. Phần hiển thị và BreadcrumbList sinh từ cùng một danh sách `Crumb[]`, vì hai bên lệch nhau thì Google có thể bỏ qua dữ liệu có cấu trúc.
- Đặt trên H1, render ở server, các cấp là `<a href>` thật.
- Thứ tự theo cây nội dung, không theo đường khách vừa đi: Trang chủ → danh mục → sản phẩm. Sản phẩm thuộc nhiều danh mục thì chọn danh mục chính.
- Mỗi cấp là URL canonical trả 200, không trỏ tới redirect, trang `noindex` hay URL có query.
- Mục cuối là trang hiện tại: chữ thường với `aria-current="page"`, không phải link. Trong JSON-LD vẫn có URL.

## 7. Dữ liệu có cấu trúc

- JSON-LD đi qua một helper `safeJsonLd` để escape `<`: tên sản phẩm chứa `</script>` có thể thành XSS.
- Dùng đúng loại: Organization, WebSite, Product kèm Offer, BreadcrumbList, Article.
- Product chỉ xuất khi trang được index (có ảnh và mô tả): Google báo lỗi Product thiếu ảnh. `sameAs` của Organization lấy từ CMS > Thông tin cửa hàng, bỏ link tìm kiếm trên sàn.
- `price`, `priceCurrency`, `availability` khớp đúng thứ hiển thị. Chỉ thêm `aggregateRating`, `review` khi có đánh giá thật hiển thị trên trang.
- FAQPage và SearchAction không còn đem lại rich result cho site thường. Chỉ giữ khi nội dung hiển thị thật và có ích.

## 8. Nội dung

- Hub và vệ tinh: mỗi chủ đề một trang hub, liên kết hai chiều với bài và sản phẩm. Không để trang mồ côi.
- Viết phần chỉ An Chi có: ảnh thật, nguồn hàng, kinh nghiệm dùng. Mỗi sản phẩm một mô tả riêng, không chép từ nhà cung cấp.
- Không viết nội dung hứa công dụng chữa bệnh hay tâm linh, theo [anchi-brand](../anchi-brand/SKILL.md).
- E-E-A-T: tác giả có hồ sơ, ngày cập nhật, nguồn tham khảo, thông tin đơn vị bán hàng và địa chỉ liên hệ thật.
- Nội dung theo mùa chuẩn bị trước mùa ít nhất một tháng.

## 9. Sitemap và môi trường

- Sitemap chỉ có URL trả 200, không redirect, không noindex. `lastmod` thật, bỏ `changefreq`.
- Không ghi sitemap thiếu khi BE lỗi: lỗi thì để request thất bại, không trả danh sách rút gọn.
- Môi trường test luôn noindex bằng biến môi trường. Prod và test không dùng chung cấu hình index.
- Một kiểu tên miền: http→https, www→non-www, một bước.

## 10. Ngân sách

| Chỉ số | Ngưỡng |
|---|---|
| LCP / INP / CLS | < 2.5s / < 200ms / < 0.1 |
| TTFB | < 600ms |
| First Load JS | Nội dung 120 kB, sản phẩm 150 kB, trang chủ 180 kB |
| Lighthouse mobile | Performance ≥ 85, Accessibility ≥ 95, SEO = 100 |
| Ảnh | Ảnh LCP có `priority`, ảnh thẻ ≤ 60 KB, ảnh chi tiết ≤ 150 KB |

- Khối chỉ cần sau tương tác nạp bằng `next/dynamic`. Ảnh chính và giá hiện ngay, không lazy.
- Ảnh dùng `next/image`, có kích thước hoặc `aspect-ratio`; ưu tiên WebP, AVIF.
- Font qua `next/font`.
- Script bên thứ ba nạp muộn nhất có thể, chỉ trên route cần.
- Khu vực chờ dữ liệu giữ sẵn chiều cao để không làm trang nhảy.

Chưa đạt thì ghi số đo và lý do, không lờ đi.
