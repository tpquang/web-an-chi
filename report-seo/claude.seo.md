# Báo cáo SEO An Chi Trầm Hương

Ngày rà: 20/11/2026. Phạm vi: code `apps/web`, docs SEO, thị trường và SERP đối thủ.

**Giới hạn của báo cáo:** chưa có số liệu lượt tìm (không truy cập Google Keyword Planner, Ahrefs hay Search Console). Mức độ "cao/trung bình/thấp" dưới đây là ước lượng theo SERP và kinh nghiệm ngành, phải đo lại trước khi chốt title (theo quy tắc `docs/web/seo/keyword-map.md`).

---

## 1. Tóm tắt ưu tiên

| # | Việc | Mức | Hạn |
|---|---|---|---|
| 1 | Bật index đúng ngày mở bán (12/12/2026): `SITE_INDEXING=on`, `NEXT_PUBLIC_SITE_URL`, gửi sitemap Search Console | Chặn | Trước 12/12 |
| 2 | Bổ sung ảnh thật + mô tả cho toàn bộ sản phẩm (hiện **tất cả** sản phẩm mẫu đang noindex) | Chặn | Trước 12/12 |
| 3 | Trang chính sách: giao hàng, đổi trả, bảo mật, liên hệ có địa chỉ thật (E-E-A-T, Google Merchant) | Cao | Trước 12/12 |
| 4 | Nội dung Tết + rằm tháng Giêng (Tết 2027 ≈ 06/02/2027) phải lên **trước 06/01/2027** | Cao | Tháng 12 |
| 5 | Ảnh OG mặc định 1200×630 | Cao | Trước 12/12 |
| 6 | Mở rộng bản đồ từ khoá (mục 4) và tạo các danh mục/bài vệ tinh còn thiếu | Cao | Q1/2027 |
| 7 | Trang tác giả, `author` kiểu `Person` trong Article | Trung bình | Q1/2027 |
| 8 | Webhook revalidate khi lưu CMS, đo Lighthouse | Trung bình | Q1/2027 |

---

## 2. SEO kỹ thuật (code)

Nền tảng đã tốt: SSR, canonical tuyệt đối, 404/500 đúng, redirect 308 tự ghi khi đổi slug, sitemap không rút gọn khi BE lỗi, `safeJsonLd`, Product chỉ xuất khi đủ điều kiện, `PreOrder` + `availabilityStarts` trước ngày mở bán. Các điểm còn phải sửa:

### 2.1 Trước khi ra mắt

- **Index toàn site đang tắt** ([src/lib/site.ts](../apps/web/src/lib/site.ts)). Đúng cho test, nhưng cần checklist ngày mở bán: đặt biến, build lại, chạy `check-env-noindex.mjs <url> --expect=index` và `check-sitemap.mjs`, gửi sitemap, yêu cầu index trang chủ + 4 danh mục.
- **Sitemap sẽ gần như rỗng phần sản phẩm** vì [sitemap.ts](../apps/web/src/app/sitemap.ts) lọc `images.length > 0 && description`, mà mọi sản phẩm mẫu chưa có. Không sửa code, sửa dữ liệu: mỗi sản phẩm cần ≥ 3 ảnh thật và mô tả riêng ≥ 150 chữ.
- **`proxy.ts`**: cờ `REDIRECT_TO_COUNTDOWN = false` đang tắt. Nếu bật lại thì toàn bộ `/san-pham`, `/danh-muc` 307 về `/countdown` (noindex). Không bật trong lúc site đã index: Google sẽ thấy cả danh mục chuyển về trang noindex. Gỡ hẳn file sau ngày mở bán như ghi chú trong file.
- **Trang `/countdown`** còn sau mở bán: cho 308 về `/` hoặc trả 410 thay vì để trang noindex tồn tại lâu.
- **Ảnh OG mặc định 1200×630** chưa có (checklist mục "Còn thiếu"). Thêm `app/opengraph-image.png` (hoặc `.tsx`) ở root và cho bài viết dùng ảnh bìa đúng tỉ lệ.

### 2.2 Metadata, structured data

- **Sitemap thiếu `lastModified` cho trang tĩnh** (`/`, `/san-pham`, ...). Lấy `updatedAt` của cài đặt SEO / home từ API, hoặc bỏ hẳn thay vì để trống không đồng nhất.
- **Sitemap bỏ `/thiet-ke-vong-tay`?** Đã có (`braceletHref`). Kiểm thêm `/chu-de/*` có H1 và đoạn mở đầu riêng, tránh trang chủ đề mỏng chỉ có lưới bài.
- **Article `author` là `Organization`** ([bai-viet/[slug]/page.tsx:71](../apps/web/src/app/(store)/bai-viet/[slug]/page.tsx#L71)) với `name: post.authorName`. Nếu tác giả là người thật thì đổi sang `Person` kèm `url` trỏ trang tác giả. Ngành trầm hương nhiều nội dung "kiến thức", E-E-A-T là lợi thế cạnh tranh trực tiếp.
- **Organization thiếu `address`, `telephone`, `contactPoint`** (kiểm JSON-LD ở [page.tsx](../apps/web/src/app/(store)/page.tsx)). Thêm từ CMS > Thông tin cửa hàng. Nếu có xưởng/điểm bán thật ở Hương Khê: thêm `LocalBusiness` (`Store`) có `geo`, `openingHours` và tạo Google Business Profile, từ khoá "trầm hương Hà Tĩnh" có ý định địa phương.
- **Product thiếu `hasMerchantReturnPolicy`** trong Offer: Google Merchant listings yêu cầu khuyến nghị; thêm sau khi có trang đổi trả. `shippingDetails` nên có `deliveryTime` (đã có `eta` trong store).
- **Product dùng `sku: product.slug`**: slug đổi thì sku đổi. Dùng mã SKU cố định từ DB.
- **Description sản phẩm fallback** ghép `summary + description` không cắt: kiểm `pageMeta` có cắt 158 ký tự cho nhánh này (theo `lib/seo.ts`). Nhánh cuối `"<tên>, giá X."` quá ngắn (< 120 ký tự), nên chỉ xảy ra ở trang noindex.
- **Danh mục**: có section "Cách chọn ..." (tốt). Thêm khối FAQ hiển thị thật (không cần schema FAQPage) trả lời các câu SERP hay hỏi: "giá bao nhiêu", "phân biệt thật giả", "loại nào tốt".

### 2.3 Hiệu năng

- **Model 3D** (`ProductMedia`, hộp tròn, nụ trầm) ở ảnh LCP: đảm bảo three.js/r3f nạp bằng `next/dynamic` sau khi ảnh tĩnh `priority` hiện, không nằm trong First Load JS (ngân sách 150 kB). Đo bằng `next build` output.
- **Trang `/thiet-ke-vong-tay`** (builder 3D) nặng: H1, đoạn giới thiệu, bảng giá hạt phải nằm trong HTML server; canvas nạp sau.
- **ChatLauncher, Analytics trong root layout** chạy ở mọi trang: chat nên nạp khi người dùng bấm hoặc sau `requestIdleCallback`.
- **Root layout gọi `getCategories()`** ở mọi request: đã cache 60 giây, chấp nhận được; khi có webhook revalidate thì tăng lên.
- Chưa có số Lighthouse/CWV: đo mobile cho `/`, 1 danh mục, 1 sản phẩm, 1 bài viết, ghi vào checklist.

### 2.4 Vận hành

- Webhook xoá cache khi lưu CMS (hiện trễ tối đa 60 giây, sitemap 1 giờ).
- Màn hình CMS quản lý redirect thủ công.
- Trang 500 không có chữ khi tắt JS (`error.tsx` là client): ít ảnh hưởng SEO vì đã trả 500, ưu tiên thấp.
- Search Console + Bing Webmaster: xác minh DNS trước ngày mở bán để kịp có dữ liệu.

---

## 3. Thị trường và đối thủ

### 3.1 Bức tranh SERP

Kết quả cho các cụm mua hàng ("vòng tay trầm hương", "nhang trầm", "nụ trầm") bị chiếm bởi:

1. **Sàn TMĐT và marketplace**: Shopee (cả blog `shopee.vn/blog`), Lazada (trang video), Chiaki. Họ thắng nhờ độ tin cậy domain, không nhờ nội dung.
2. **Shop chuyên trầm có blog mạnh**: Thiên Mộc Hương (`thienmochuong.com`), Trầm Hương Kinh Bắc, Trầm Tuệ (`tramtue.vn`), Trầm Hương Việt (`tramhuongvietnam.vn`), Văn Hoá Trầm Hương, Huyền Thiên Bảo.
3. **Trang y tế / báo**: Nhà thuốc Long Châu, Pharmacity chiếm cụm "nhang trầm có tác dụng gì", "khói trầm có độc không".
4. **Báo chí địa phương** (Báo Hà Tĩnh, Nhân Dân, VnExpress, Tiền Phong) chiếm cụm "trầm hương Phúc Trạch / Hương Khê".

### 3.2 Chiến thuật đối thủ đáng chú ý

- **Listicle "địa chỉ mua trầm hương uy tín [thành phố] [năm]"**: Thiên Mộc Hương có "15+ cửa hàng ... TP.HCM 03/2026", "13+ địa chỉ ... Hà Nội"; Kinh Bắc có "Top 11 địa chỉ ... Hà Nội 2026". Họ tự xếp mình vào top. Đây là cụm thương mại giá trị cao nhưng nội dung thiếu khách quan.
- **Cập nhật năm trong title** để giữ CTR (đi ngược quy tắc "không gắn năm vào URL" của An Chi; có thể gắn năm trong title, không gắn trong URL).
- **Khẳng định "nguyên chất 100%", "không hoá chất"** không chứng nhận, và nội dung công dụng sức khoẻ/phong thuỷ. An Chi không viết kiểu này (quy tắc brand), nên khác biệt bằng **minh bạch**: thành phần, tỉ lệ bột trầm, ảnh xưởng, video đốt thử, độ tốc thật.

### 3.3 Khoảng trống An Chi có thể chiếm

- **Nguồn gốc Phúc Trạch, Hương Khê**: báo chí nói nhiều (làng trầm thôn 8, doanh thu 2024 khoảng 30 tỷ, có sản phẩm OCOP), nhưng gần như không có shop nào có trang chuyên sâu về vùng nguyên liệu này. An Chi có lợi thế thật, viết được nội dung chỉ mình có (ảnh vườn dó, quy trình, người làm).
- **Câu hỏi an toàn khói nhang** (Long Châu chiếm): bài trung thực về khói, thông gió, người nhạy cảm, đúng giọng brand "không hứa công dụng".
- **So sánh và bảng giá minh bạch**: SERP "giá vòng trầm hương", "nụ trầm giá" hầu như không có bảng giá rõ ràng, người tìm phải hỏi shop. Một trang bảng giá theo loại hạt (6/8/10 mm, loại 1–4, đã có sẵn trong data) là lợi thế lớn.
- **Thiết kế vòng tay 3D**: đối thủ không có. Là trang đích cho "tự thiết kế vòng tay trầm hương", "vòng trầm mix charm".

---

## 4. Bản đồ từ khoá đề xuất

Thêm vào `docs/web/seo/keyword-map.md`. Lượt tìm: **chưa đo**, cột "Ước lượng" chỉ là đánh giá cạnh tranh từ SERP.

### 4.1 Trang bán (danh mục, sản phẩm)

| URL | Cụm chính | Cụm phụ | Ước lượng |
|---|---|---|---|
| `/` | trầm hương tự nhiên | trầm hương Hà Tĩnh, trầm hương Hương Khê | Cạnh tranh cao |
| `/danh-muc/vong-tay-tram-huong` | vòng tay trầm hương | vòng trầm hương nam, nữ; vòng trầm 108 hạt | Rất cao, sàn chiếm |
| `/danh-muc/nhang-tram-huong` | nhang trầm hương | nhang trầm sạch, hương trầm thờ cúng, nhang không tăm | Cao |
| `/danh-muc/nu-tram-huong` | nụ trầm hương | nụ trầm xông nhà, nụ trầm thác khói | Trung bình |
| `/danh-muc/tram-mieng` | trầm miếng | trầm miếng xông nhà, trầm giác | Trung bình |
| `/danh-muc/lu-xong-va-phu-kien` | lư xông trầm | lư xông trầm điện, đế thác khói | Trung bình |
| **mới** `/danh-muc/qua-tang-tram-huong` | quà tặng trầm hương | quà Tết trầm hương, hộp quà trầm | Cao theo mùa (Tết) |
| `/thiet-ke-vong-tay` | tự thiết kế vòng tay trầm hương | vòng trầm mix charm vàng, bạc | Thấp, ít cạnh tranh |

Sản phẩm: title theo mẫu `<loại> <số hạt> hạt <cỡ>mm <loại trầm>` (ví dụ "Vòng trầm hương 108 hạt 6mm trầm tốc loại 1"), khớp cách khách gõ ("vòng trầm 108 hạt", "vòng trầm 8mm"). Hiện slug "loai-1..loai-4" không nói lên chất lượng; hiển thị rõ loại = gì (tốc, sánh, chìm) trong tên và mô tả.

### 4.2 Bài viết (thông tin, hub về danh mục)

| URL đề xuất | Cụm | Link về |
|---|---|---|
| `/bai-viet/cach-phan-biet-tram-huong-that` (đã có) | cách phân biệt trầm hương thật giả | vòng tay, trầm miếng |
| `/bai-viet/tram-tu-nhien-va-tram-cay` (đã có) | trầm tự nhiên và trầm cấy | trang chủ |
| `/bai-viet/gia-vong-tay-tram-huong` | giá vòng tay trầm hương | danh mục vòng tay |
| `/bai-viet/tram-toc-la-gi` | trầm tốc là gì, trầm sánh, trầm chìm | builder vòng tay |
| `/bai-viet/nhang-tram-co-doc-khong` | khói nhang trầm có độc không | nhang trầm |
| `/bai-viet/cach-chon-nhang-sach` | cách chọn nhang sạch, nhận biết nhang hoá chất | nhang trầm |
| `/bai-viet/cach-dot-nu-tram` (đã có) | cách đốt nụ trầm, cách dùng thác khói | nụ trầm, lư xông |
| `/bai-viet/xong-nha-moi-bang-tram` | xông nhà mới bằng trầm | trầm miếng, nụ trầm |
| `/bai-viet/tram-huong-phuc-trach-huong-khe` | trầm hương Phúc Trạch, làng trầm Hà Tĩnh | trang chủ, giới thiệu |
| `/bai-viet/vong-tram-huong-108-hat-y-nghia` | vòng trầm 108 hạt | sản phẩm 108 hạt |
| `/bai-viet/qua-tet-tram-huong` | quà Tết trầm hương | danh mục quà tặng |
| `/bai-viet/chuan-bi-nhang-tram-ram-thang-gieng` (đã có) | nhang trầm rằm tháng Giêng | nhang |
| `/bai-viet/bao-quan-vong-tay-tram-huong` (đã có) | cách bảo quản vòng trầm, vòng trầm bị mất mùi | vòng tay |

Không viết nhắm "trầm hương có tác dụng gì" theo kiểu công dụng chữa bệnh/phong thuỷ (quy tắc brand). Nếu viết, chỉ nói thành phần, mùi, cách dùng, lưu ý an toàn.

### 4.3 Tránh ăn thịt từ khoá

- Trang chủ và `/san-pham` đều có thể nhắm "trầm hương": giữ trang chủ cho "trầm hương tự nhiên + vùng", `/san-pham` cho "sản phẩm trầm hương / mua trầm hương".
- `/gioi-thieu` và bài Phúc Trạch: giới thiệu nói về An Chi, bài viết nói về vùng nguyên liệu.

---

## 5. Nội dung và E-E-A-T

- Mô tả sản phẩm riêng từng mẫu: thành phần, cỡ hạt, cách nhận biết loại, ảnh chụp thật dưới ánh sáng tự nhiên, video đốt/ngửi ngắn.
- Trang giới thiệu: người sáng lập, ảnh xưởng/vườn ở Hương Khê, năm hoạt động, giấy phép kinh doanh, mã số thuế (nghị định TMĐT yêu cầu, cũng là tín hiệu tin cậy).
- Trang tác giả `/tac-gia/<slug>` (cần thêm vào cấu trúc URL trong skill nếu làm).
- Đánh giá thật từ khách sau mở bán; chỉ thêm `aggregateRating` khi hiển thị trên trang.
- Liên kết ngoài: xin backlink từ báo địa phương (Báo Hà Tĩnh hay viết về làng trầm), danh bạ OCOP nếu có, Google Business Profile, và link trang Shopee/Lazada chính thức về website.

---

## 6. Lịch theo mùa

| Mùa | Ngày (âm → dương 2027) | Nội dung lên trước |
|---|---|---|
| Tết Nguyên Đán | 06/02/2027 | Quà Tết, nhang thờ cúng: **trước 06/01/2027** |
| Rằm tháng Giêng | ~20/02/2027 | Cập nhật bài có sẵn: trước 20/01 |
| Vu Lan (rằm tháng 7) | ~cuối 08/2027 | Trước cuối 07/2027 |

Không đổi URL trong các mùa này (quy tắc skill).

---

## Nguồn tham khảo

- [Thiên Mộc Hương: cửa hàng trầm hương TP.HCM](https://thienmochuong.com/nhang-tram-huong-tp-hcm), [Hà Nội](https://thienmochuong.com/8-dia-chi-cua-hang-mua-ban-tram-huong-ha-noi-lau-nam-va-uy-tin-nhat)
- [Trầm Hương Kinh Bắc: top địa chỉ Hà Nội](https://tramhuongkinhbac.com/top-11-dia-chi-mua-va-ban-tram-huong-ha-noi-uy-tin-va-lau-nam)
- [Trầm Tuệ](https://tramtue.vn/), [Trầm Hương Việt Nam](https://tramhuongvietnam.vn/co-so-tram-huong-uy-tin/), [Văn hoá trầm hương](https://www.vanhoatramhuong.com/mua-vong-tram-huong-o-dau-uy-tin/), [Huyền Thiên Bảo](https://huyenthienbao.vn/shop-tram-huong/), [Aristino blog](https://aristino.com/blogs/tu-van-phong-cach/nen-mua-tram-huong-o-dau-top-dia-chi-mua-vong-tay-tram-huong-uy-tin-tai-tphcm)
- [Shopee blog: kinh nghiệm mua vòng trầm](https://shopee.vn/blog/kinh-nghiem-mua-vong-tay-tram-huong/), [Chiaki: giá vòng trầm](https://chiaki.vn/tin-tuc/gia-vong-tram-huong)
- [Long Châu: nhang trầm hương có tác dụng gì](https://nhathuoclongchau.com.vn/bai-viet/nhang-tram-huong-co-tac-dung-gi-cac-loai-nhang-tram-huong.html)
- [Nhân Dân: Nghề trầm hương ở Phúc Trạch](https://nhandan.vn/nghe-tram-huong-o-phuc-trach-post853739.html), [Báo Hà Tĩnh: mỗi hộ làng trầm thu gần 260 triệu/năm](https://baohatinh.vn/moi-ho-lang-tram-huong-ha-tinh-thu-gan-260-trieu-dongnam-post282285.html), [Báo Hà Tĩnh: cơ sở OCOP mùa Tết](https://baohatinh.vn/co-so-san-xuat-tram-huong-ocop-o-ha-tinh-vao-mua-tra-hang-tet-post224916.html), [Tiền Phong: làng trầm cháy hàng](https://tienphong.vn/lang-tram-huong-lam-ngay-cay-dem-van-chay-hang-post1410438.tpo)
