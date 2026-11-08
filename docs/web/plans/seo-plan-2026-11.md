# Kế hoạch SEO: 11/2026 – 05/2027

Lập ngày 08/11/2026, dựa trên [audit-2026-11-08](../seo/audit-2026-11-08.md) và phiếu thông tin chủ shop điền ngày 08/11/2026.

## Bối cảnh

| | |
|---|---|
| Tên miền | `tramhuonganchi.vn`, đã chạy trên VPS (nginx) |
| Mô hình | Chỉ bán online, toàn quốc. Đơn hiện đi qua Shopee, TikTok Shop |
| Nguồn hàng | Trầm tự nhiên vùng Phúc Trạch, Hương Khê, Hà Tĩnh |
| Hàng đẩy mạnh | Nhang, nụ trầm, thiết kế vòng riêng. Giá chủ lực dưới 500k |
| Danh mục | Dưới 30 sản phẩm. Ảnh chưa có, sẽ tự chụp |
| Nội dung | 4 bài/tháng. Claude viết nháp, chủ shop duyệt |
| Ngân sách | 0đ: chỉ dùng công cụ miễn phí |
| Công cụ hiện có | Chưa có gì |
| Tiếng Anh | Cần ngay |
| Mục tiêu | Lên top từ khoá chính, có đơn từ Google, giảm phụ thuộc sàn, được AI nhắc tới. KPI ghi "100" |
| Đối thủ | tramtue.vn, tramhuongkinhbac.com, vanhoatramhuong.com, tramhuongkyanh.com, thienmochuong.com |

## Phát hiện chặn: site thật đang chặn Google

Kiểm tra `https://tramhuonganchi.vn` ngày 08/11/2026:

- `robots.txt` trả về `Disallow: /`.
- Trang chủ có thẻ `noindex, follow`.

Lý do là biến `SITE_INDEXING=on` chưa được đặt trên VPS. Chừng nào chưa sửa, mọi việc khác trong kế hoạch này đều vô ích: Google không index trang nào. Đây là việc số 1, làm trong ngày.

## Điều chỉnh mục tiêu

- **KPI "100" chưa rõ đơn vị.** Kế hoạch tạm hiểu là *100 đơn/tháng từ Google sau 6 tháng*. Với 0đ ngân sách, tên miền mới và dưới 30 sản phẩm, con số đó khó đạt. Mốc thực tế hơn:
  - Tháng 3: 100 lượt truy cập tự nhiên mỗi tuần.
  - Tháng 6: 1.000 lượt mỗi tháng và 10–20 đơn mỗi tháng từ web.
  - Chỉnh lại mốc sau khi có 3 tháng số liệu Search Console.
- **Từ khoá "trầm hương", "mua trầm hương" rất cạnh tranh**, 6 tháng khó lên top. Ưu tiên từ khoá dài, gắn với điểm mạnh riêng: *nụ trầm hương tự nhiên*, *nhang trầm Hương Khê*, *trầm Phúc Trạch*, *cách phân biệt trầm thật*.
- **Tiếng Anh "cần ngay"** nhưng nên làm ở giai đoạn 3. Bản tiếng Việt còn chưa được index và chưa có ảnh. Nếu dịch ngay, hai bản cùng mỏng, gấp đôi việc. Nếu có khách nước ngoài đang chờ thì báo lại để kéo lên sớm.
- **"100% trầm hương tự nhiên"** chỉ được ghi khi có bằng chứng: ảnh vùng nguyên liệu, quy trình, giấy kiểm định nếu có (theo `anchi-brand`). Khẳng định suông vừa không giúp SEO, vừa dễ bị khiếu nại.

## Giai đoạn 1: Mở cửa cho Google (tuần 1–2, 11/2026)

| # | Việc | Ai làm | Xong khi |
|---|---|---|---|
| 1 | Đặt `SITE_INDEXING=on` trên VPS, build lại | Dev | `robots.txt` có `Allow: /` và dòng Sitemap, trang chủ hết `noindex` |
| 2 | Tạo Google Search Console (xác minh theo tên miền), gửi `sitemap.xml` | Chủ shop | Search Console nhận sitemap |
| 3 | Cài GA4 (miễn phí), đo sự kiện thêm giỏ, đặt hàng | Dev | Có sự kiện purchase |
| 4 | Thay dữ liệu mẫu: địa chỉ Hương Khê, `admin@tramhuonganchi.vn`, **số điện thoại thật** (phiếu chưa có) | Dev + chủ shop | Footer và schema không còn chữ "mẫu" |
| 5 | Schema Organization thêm `sameAs`: Facebook, TikTok, Shopee | Dev | Kiểm tra bằng Rich Results Test |
| 6 | Schema Product: chỉ xuất khi có ảnh; thêm `brand`, `sku` | Dev | Hết lỗi `image` rỗng |
| 7 | nginx: thêm HSTS, `X-Content-Type-Options`, `Referrer-Policy`; tắt `X-Powered-By` (`poweredByHeader: false`) | Dev | Header có trên production |
| 8 | Thêm favicon và icon PWA (`app/icon`) | Dev | `/favicon.ico` hết 404 |
| 9 | Tạo Bing Webmaster Tools, nhập từ Search Console | Chủ shop | Bing nhận sitemap. Bing cấp dữ liệu cho ChatGPT, Copilot |

## Giai đoạn 2: Sản phẩm đủ để xếp hạng (tuần 3–8, 11–12/2026)

1. **Chụp ảnh, ưu tiên nhang, nụ trầm, hạt cho vòng.** Mỗi sản phẩm tối thiểu 4 ảnh: toàn cảnh, cận vân hoặc thớ, khi đốt hoặc khi đeo, kèm thước đo kích thước. Nền thống nhất, ánh sáng tự nhiên.
2. **Mô tả sản phẩm 150–300 từ**, theo khung của `anchi-seo`. Nội dung gồm nguồn gốc Phúc Trạch, thành phần, kích thước hoặc trọng lượng, cách dùng, bảo quản. Claude viết nháp từ thông số trong CMS, chủ shop sửa cho đúng thực tế.
3. **Chính sách giao hàng và đổi trả trên web**, dù hiện chủ yếu bán qua sàn. Ghi rõ phí, thời gian, điều kiện đổi. Sau đó thêm `shippingDetails` và `hasMerchantReturnPolicy` vào schema.
4. **Google Merchant Center, danh sách miễn phí.** Hiển thị sản phẩm trong tab Mua sắm mà không tốn tiền quảng cáo.
5. **Danh mục rỗng** (Trầm miếng, Nhang khi chưa có hàng): chọn một trong hai. Hoặc có hàng, hoặc `noindex` và bỏ khỏi menu cho tới khi có.
6. **Trang thiết kế vòng riêng** là điểm khác biệt so với 5 đối thủ. Bổ sung đoạn giải thích, ví dụ vòng khách đã đặt, FAQ.
7. **Trang "Vùng trầm Phúc Trạch"** (hoặc mở rộng trang Giới thiệu): ảnh vùng nguyên liệu, người làm, quy trình làm nhang và nụ. Đây là nội dung E-E-A-T mà đối thủ khó sao chép.

## Giai đoạn 3: Nội dung và tiếng Anh (tháng 2–4, 01–03/2027)

**Người đứng tên bài viết.** Phiếu ghi "An Chi". Đó là thương hiệu, không phải người. Google và các AI tin bài có tác giả thật hơn: tên, vai trò, số năm làm trầm, ảnh. Nên chọn một người đứng tên và làm trang tác giả.

**Lịch 4 bài/tháng**, chia theo nhóm chủ đề. Mỗi bài dẫn về danh mục liên quan.

| Nhóm | Bài gợi ý | Dẫn về |
|---|---|---|
| Phân biệt và nguồn gốc | Trầm Phúc Trạch có gì khác; trầm tự nhiên và trầm cấy (đã có, mở rộng); dấu hiệu nhang trầm pha hoá chất | Nhang, Nụ trầm |
| Hướng dẫn dùng | Cách đốt nụ trầm (đã có); chọn lư xông cho phòng nhỏ; nhang trầm có tăm và không tăm | Nụ trầm, Lư xông |
| Dịp lễ (đăng trước 4–6 tuần) | Rằm tháng Giêng (đã có); Tết Nguyên đán; Vu Lan; ngày vía | Nhang |
| Vòng tay | Chọn cỡ hạt theo cổ tay; ý nghĩa số hạt; tự thiết kế vòng | Thiết kế vòng |

- Bài hiện có (~360 từ) mở rộng lên 800–1.200 từ, thêm ảnh thật, FAQ ở cuối, ngày cập nhật.
- Video TikTok/YouTube (sắp làm): mỗi bài hướng dẫn kèm một video ngắn, nhúng vào bài.
- Mỗi tháng chạy `/claude-seo:seo-content` cho bài mới trước khi đăng.

**Tiếng Anh**, bắt đầu tháng 3:
- Chỉ dịch trang chủ, giới thiệu, nhóm hàng chủ lực và 3–5 bài mạnh nhất. Không dịch toàn bộ.
- Dùng đường dẫn `/en/...`, có `hreflang` vi/en/x-default và canonical riêng cho từng bản.
- Đây là việc kiến trúc lớn trên Next.js: cần một spec riêng trong `docs/web/plans/` trước khi làm.

## Giai đoạn 4: Uy tín và AI search (tháng 3–6, liên tục)

Với 0đ ngân sách, backlink chỉ đến từ những việc làm thật:

- Link từ Shopee, TikTok Shop, Facebook, Zalo OA về web. Mỗi sản phẩm trên sàn ghi web chính thức.
- Đăng ký danh bạ doanh nghiệp miễn phí, điền thông tin NAP đúng như footer.
- Gửi bài, ảnh vùng trầm cho báo địa phương Hà Tĩnh, hội làng nghề, trang du lịch Hương Khê.
- **Google Business Profile**: phiếu ghi "chỉ bán online". Có thể tạo dạng *doanh nghiệp giao hàng* (ẩn địa chỉ). Nên làm, vì GBP giúp tên thương hiệu hiện ở Google và Maps.
- **AI search**: tạo `llms.txt`. Nội dung nhất quán về An Chi (Phúc Trạch, Hương Khê, trầm tự nhiên) trên web, sàn và mạng xã hội. Mỗi bài có đoạn trả lời ngắn ngay dưới H2. Mỗi tháng hỏi ChatGPT, Gemini, Perplexity "mua trầm hương Hà Tĩnh ở đâu" và ghi lại kết quả.

## Đo lường hằng tháng

| Chỉ số | Nguồn | Mốc tháng 3 | Mốc tháng 6 |
|---|---|---|---|
| Trang đã index | Search Console | ≥ 80% số URL trong sitemap | ≥ 90% |
| Lượt hiển thị | Search Console | 3.000 | 15.000 |
| Lượt nhấp tự nhiên | Search Console | 400 | 1.000 |
| Từ khoá trong top 10 | Search Console | 5 (từ khoá dài) | 20 |
| Đơn từ web | GA4 | 2–5 | 10–20 |
| Được AI nhắc | Tự kiểm tra | 0–1/3 công cụ | 2/3 |

Các mốc này là ước tính ban đầu, chỉnh lại sau 3 tháng có số liệu thật.

**Việc hằng tháng:**
- Xem Search Console: lỗi index, từ khoá mới xuất hiện.
- Chạy `/claude-seo:seo-audit https://tramhuonganchi.vn`.
- Chạy `/claude-seo:seo-drift` sau mỗi lần deploy lớn.

## Còn thiếu từ chủ shop

- Số điện thoại thật.
- Người đứng tên bài viết: tên, kinh nghiệm, ảnh.
- KPI "100" là 100 gì: đơn, lượt truy cập, hay doanh thu?
- Phí ship và chính sách đổi trả khi bán trực tiếp trên web.
- Giấy tờ hoặc bằng chứng cho "100% trầm tự nhiên", nếu có.
- Link Zalo OA, YouTube, Shopee (phiếu ghi "các phần khác tương tự").
