# Báo cáo SEO tổng thể — An Chi Trầm Hương

**Ngày audit:** 20/11/2026  
**Phạm vi:** mã nguồn `apps/web`, dữ liệu mẫu/CMS, website production `https://tramhuonganchi.vn`, kết quả tìm kiếm công khai và các website đối thủ.  
**Lưu ý dữ liệu:** báo cáo này không có quyền truy cập Google Search Console, GA4, Google Keyword Planner hoặc Ahrefs/Semrush. Vì vậy không gán số lượt tìm kiếm giả định; độ ưu tiên từ khóa dựa trên ý định tìm kiếm, mức phù hợp sản phẩm, cấu trúc SERP và khoảng trống nội dung. Cần xác nhận volume, CTR, vị trí và conversion bằng GSC/Keyword Planner sau khi triển khai.

## 1. Kết luận điều hành

Website có nền kỹ thuật tốt: Next.js render phía server, canonical, robots theo môi trường, sitemap động, metadata riêng, schema Organization/WebSite/Product/Article, ảnh qua `next/image`, trang mỏng tự `noindex`, URL lỗi trả 404/redirect và có CMS kiểm tra SEO. `npm run typecheck --workspace=@an-chi/web` đã chạy thành công.

Điểm nghẽn hiện tại không còn là “thiếu thẻ SEO”, mà là **độ phủ sản phẩm, chiều sâu nội dung, bằng chứng thương hiệu và khả năng được Google khám phá/index**:

- Production trả HTTP 200, robots đã `Allow: /`, sitemap hoạt động và có 21 URL; lỗi chặn Google ghi trong audit ngày 08/11 đã được sửa.
- Truy vấn công khai `site:tramhuonganchi.vn` chưa trả kết quả trong lần kiểm tra này. Đây là tín hiệu cần kiểm tra GSC ngay, nhưng chưa đủ để kết luận toàn site chưa index.
- Sitemap chỉ có **1 URL sản phẩm** (`/san-pham/nhang-tram-an-chi`), trong khi có 5 danh mục. Site khó cạnh tranh truy vấn mua hàng nếu thiếu landing page và SKU thật.
- Title production trang chủ đang là `Trầm Hương An Chi – Hương trầm thật từ  Phúc Trạch`, có khoảng trắng kép và khác mặc định trong code. H1 `Trầm hương cho không gian sống của bạn` thiên về thương hiệu, chưa nêu điểm khác biệt Hương Khê/Phúc Trạch.
- Meta description production khẳng định “100% trầm thiên nhiên, không pha hương liệu”. Chỉ nên giữ khi có hồ sơ nguyên liệu/quy trình/kiểm nghiệm hoặc bằng chứng đủ mạnh trên trang.
- Đối thủ thắng bằng quy mô danh mục, landing page dài, FAQ, review, chính sách, showroom và content cluster lâu năm. An Chi chưa nên đối đầu trực diện ở từ khóa rộng; lợi thế có thể sở hữu là **trầm Phúc Trạch/Hương Khê + phân khúc dễ mua dưới 500.000đ + thiết kế vòng theo yêu cầu + minh bạch thành phần**.

## 2. Việc cần làm theo thứ tự ưu tiên

### P0 — làm trong 1–2 tuần

1. **Mở GSC và xử lý index**
   - Xác minh Domain Property, gửi `https://tramhuonganchi.vn/sitemap.xml`.
   - Kiểm tra Page indexing, Manual actions, Security issues và URL Inspection cho trang chủ, 1 sản phẩm, 2 danh mục, 2 bài viết.
   - Yêu cầu index sau khi nội dung/ảnh đã hoàn thiện; không request hàng loạt URL mỏng.
   - KPI đầu tiên: toàn bộ URL đủ chất lượng trong sitemap được crawl; ≥80% được index trong 4–8 tuần.

2. **Không đưa danh mục rỗng/mỏng vào sitemap**
   - Hiện sitemap có đủ 5 danh mục nhưng chỉ 1 sản phẩm. Trong `apps/web/src/app/sitemap.ts`, danh mục chỉ lọc `!noindex`, không kiểm tra số sản phẩm.
   - Ẩn khỏi menu + đặt `noindex` trong CMS cho `trầm miếng`, `lư xông`, `vòng tay`, `nụ trầm` nếu chưa có hàng và chưa có nội dung đủ tốt.
   - Chỉ index landing page khi có ít nhất 3 sản phẩm hoặc có nội dung hướng dẫn thực sự hữu ích, FAQ và liên kết tới sản phẩm liên quan.

3. **Hoàn thiện tối thiểu 8–12 SKU có khả năng mua**
   - Ưu tiên: nhang có tăm, nhang không tăm, nụ trầm, combo thử, combo bàn thờ, hộp quà, vòng 6 mm, vòng 8 mm, vòng 108 hạt, thiết kế vòng.
   - Mỗi SKU: 4–6 ảnh thật, giá, tồn kho, trọng lượng/số lượng, kích thước, thời gian cháy, thành phần, xuất xứ, cách dùng, bảo quản, đối tượng phù hợp, chính sách đổi trả.
   - Tên sản phẩm phải chứa thuộc tính phân biệt, ví dụ `Nhang trầm Phúc Trạch có tăm 30 cm – hộp 100 nén`, không dùng nhiều tên gần giống nhau.

4. **Sửa thông điệp trang chủ trong CMS**
   - Title đề xuất: `Trầm hương Phúc Trạch, Hương Khê | An Chi`.
   - H1 đề xuất: `Trầm hương Phúc Trạch cho nếp sống an lành`.
   - Description đề xuất: `Nhang trầm, nụ trầm và vòng tay từ vùng nguyên liệu Phúc Trạch, Hương Khê. Công khai thành phần, kích thước, cách dùng và giá; giao toàn quốc.`
   - Sửa khoảng trắng kép trong title production.
   - Bổ sung ngay dưới hero 80–120 từ giải thích An Chi bán gì, nguồn hàng nào, dành cho ai và vì sao đáng tin.

5. **Chứng minh claim thay vì chỉ tuyên bố**
   - Tạo trang `/vung-tram-phuc-trach` hoặc mở rộng `/gioi-thieu`: ảnh vườn/xưởng/người làm, nguồn nguyên liệu, quy trình làm nhang/nụ, cách kiểm soát phụ gia, người chịu trách nhiệm nội dung.
   - Với “100% thiên nhiên/không pha hương liệu”, dẫn chứng cụ thể. Nếu chưa có bằng chứng, đổi thành mô tả kiểm chứng được như “thành phần công bố: bột gỗ dó tạo trầm và bột bời lời” (chỉ khi đúng thực tế).

6. **Đo chuyển đổi SEO**
   - GA4/GTM cần có `view_item`, `add_to_cart`, `begin_checkout`, `purchase`, click Shopee/TikTok/Zalo/điện thoại.
   - Gắn source/medium nhất quán và tạo báo cáo đơn từ organic. Code hiện mới nạp GA/GTM; phải kiểm tra cấu hình sự kiện thực tế.

### P1 — làm trong 3–6 tuần

7. **Nâng trang danh mục thành landing page tìm kiếm**
   - Nội dung 500–900 từ, đặt sau danh sách sản phẩm: cách chọn, loại sản phẩm, bảng so sánh, mức giá, cách dùng, FAQ, link bài chuyên sâu.
   - Thêm `ItemList` schema cho danh sách sản phẩm; FAQ chỉ dùng schema khi câu hỏi và câu trả lời hiển thị đầy đủ, không kỳ vọng rich result vì Google giới hạn FAQ rich results.
   - Thêm số lượng sản phẩm và mô tả hữu ích phía trên; tránh đoạn văn chỉ để nhồi từ khóa.

8. **Hoàn thiện Product/Merchant schema**
   - `Product` hiện có name, image, description, sku, brand, category, price, currency, availability và shipping rate — nền tảng tốt.
   - Thêm `hasMerchantReturnPolicy` từ `store.returnPolicy`; cấu trúc thành `MerchantReturnPolicy`, không đưa nguyên một câu tự do.
   - Thêm `deliveryTime` trong `shippingDetails` nếu có SLA rõ ràng.
   - Dùng SKU thật ổn định, không dùng slug nếu doanh nghiệp đã có mã hàng.
   - Chỉ thêm `aggregateRating`/`review` khi review thật được hiển thị trên trang; tuyệt đối không tạo review giả.
   - Logo trong schema nên là PNG/JPG crawl được, không chỉ SVG; dùng ảnh vuông tối thiểu 112×112.

9. **Tăng E-E-A-T cho bài viết**
   - `author` hiện là Organization dù `authorName` có thể là “Ban biên tập An Chi”. Tạo tác giả thật: tên, vai trò, kinh nghiệm, ảnh, trang hồ sơ; xuất `Person` schema và link `url`.
   - Mỗi bài nêu cách kiểm chứng, ảnh do An Chi chụp, ngày cập nhật và nguồn tham khảo đáng tin.
   - Tránh khẳng định chữa bệnh, thanh lọc không khí, đổi vận hay tác dụng tâm linh như sự thật. Nếu nói về văn hóa/tín ngưỡng, ghi rõ đó là quan niệm/trải nghiệm, không phải hiệu quả y tế.

10. **Tạo chính sách và tín hiệu tin cậy có thể crawl**
    - Trang riêng: giao hàng, đổi trả, thanh toán, bảo mật, điều khoản, liên hệ.
    - NAP nhất quán (tên, điện thoại, khu vực phục vụ); thêm link Facebook, TikTok, Shopee, Zalo OA, YouTube thật vào `sameAs`.
    - Nếu chỉ bán online, có thể dùng Google Business Profile dạng service-area business và ẩn địa chỉ nhà.

11. **Tối ưu ảnh và Core Web Vitals**
    - Ảnh sản phẩm WebP/AVIF, kích thước nguồn hợp lý, alt mô tả đúng vật thể/thuộc tính; không nhồi “trầm hương” vào mọi alt.
    - Hero/LCP chỉ priority cho một ảnh; khai báo `sizes` đúng; ảnh dưới màn hình lazy-load.
    - Component 3D/Three.js phải dynamic import và chỉ tải khi người dùng mở/xem, tránh tăng JS cho trang sản phẩm.
    - Chạy PageSpeed Insights và Chrome UX Report trên production; mục tiêu p75: LCP ≤2,5 giây, INP ≤200 ms, CLS ≤0,1.

### P2 — làm trong 2–4 tháng

12. **Xây topical authority theo cụm, không viết bài rời rạc**
    - Mỗi tháng 4 bài: 1 bài nguồn gốc/minh bạch, 1 bài hướng dẫn dùng, 1 bài chọn mua/so sánh, 1 bài theo mùa.
    - Mỗi cluster có hub → bài con → danh mục → sản phẩm; bổ sung breadcrumb và link nội bộ bằng anchor tự nhiên.
    - Cập nhật bài cũ thay vì tạo URL mới trùng intent.

13. **Digital PR và backlink địa phương**
    - Xây tài sản có thể được trích dẫn: phóng sự ảnh vùng trầm, hồ sơ làng nghề, phỏng vấn người làm, dữ liệu thời gian cháy/thành phần từng loại.
    - Xin đề cập/link từ báo địa phương, cổng làng nghề, hội doanh nghiệp, đối tác đóng gói/vận chuyển và hồ sơ sàn chính thức.
    - Không mua backlink số lượng lớn, không spam forum/comment.

14. **Merchant Center và feed sản phẩm**
    - Khi đã có chính sách, ảnh, tồn kho và giá đồng nhất, tạo Merchant Center/free listings.
    - Bảo đảm feed, Product schema và nội dung trang khớp giá/tình trạng hàng.

## 3. Phân tích thị trường và đối thủ

### 3.1. Bức tranh thị trường tìm kiếm

SERP hiện chia thành bốn lớp chính:

1. **Thương mại rộng:** trầm hương, trầm hương tự nhiên, mua trầm hương.
2. **Danh mục có ý định mua cao:** vòng tay trầm hương, nhang trầm hương, nụ trầm hương, trầm miếng, bột trầm, lư xông.
3. **Thuộc tính/giải pháp:** có tăm/không tăm, sạch/không hóa chất, 30 cm, 108 hạt, nam/nữ, theo mệnh, quà tặng, giá bao nhiêu.
4. **Thông tin:** thật–giả, cách đốt, cách bảo quản, cách chọn, nguồn gốc, tác dụng/ý nghĩa.

Các thương hiệu lớn đang bao phủ cả danh mục, sản phẩm và blog. Vì thế An Chi khó thắng chỉ bằng 7 bài kiến thức chung. Cơ hội thực tế là kết hợp **local entity Phúc Trạch/Hương Khê** với thuộc tính sản phẩm cụ thể và trải nghiệm mua minh bạch.

Nguồn độc lập cho thấy Phúc Trạch có làng nghề chế tác trầm hương và quy mô kinh tế đáng kể; đây là nền tảng tốt để kể câu chuyện địa phương, nhưng phải có bằng chứng An Chi thực sự gắn với vùng nguyên liệu đó: [Báo Hà Tĩnh về làng trầm Phúc Trạch](https://baohatinh.vn/moi-ho-lang-tram-huong-ha-tinh-thu-gan-260-trieu-dongnam-post282285.html), [Quân đội nhân dân về trầm hương Hương Khê](https://ct.qdnd.vn/kinh-te-xa-hoi/tram-huong-o-huong-khe-531184).

### 3.2. Benchmark đối thủ

| Đối thủ | Điểm mạnh quan sát được | Khoảng trống/cách An Chi đối đầu |
|---|---|---|
| [Trầm Tuệ](https://tramtue.vn/) | Danh mục rất sâu; landing page dài; nêu thành phần, khoảng giá, thời gian cháy, FAQ; nhiều địa điểm và chính sách. Trang chủ bao phủ nhang, nụ, trầm miếng, bột, vòng, quà tặng. | Không cạnh tranh bằng số SKU. Tập trung combo dưới 500k, bằng chứng Phúc Trạch, bảng thành phần/thời gian cháy và trải nghiệm chọn nhanh cho người mới. |
| [Thiên Mộc Hương](https://thienmochuong.com/) | Thương hiệu mạnh, nhiều sản phẩm cao cấp, review, nội dung blog dày, tác giả/ngày đăng, hệ thống hậu mãi. | Phân khúc giá khác An Chi. Chiếm nhóm “thực dụng, minh bạch, không phóng đại tâm linh/y tế”, vòng thiết kế cá nhân hóa và sản phẩm hàng ngày. |
| [Trầm Hương Kinh Bắc](https://tramhuongkinhbac.com/) | Quốc tế hóa Việt/Anh/Trung; showroom Hà Nội; đổi 1–1 30 ngày, bảo hành; title sản phẩm rất chi tiết về nguồn gốc, tuổi, size và số hạt. | An Chi có thể rõ ràng tương đương về thông số nhưng dùng tuyên bố dễ kiểm chứng; chưa ưu tiên đa ngôn ngữ trước khi bản Việt đủ mạnh. |
| [Văn Hóa Trầm Hương](https://www.vanhoatramhuong.com/) | Điều hướng theo trải nghiệm (an yên, thưởng trầm, quà tặng); nhiều nhóm phụ kiện và xông trầm; kể câu chuyện phong cách sống. | An Chi nên tạo lối vào theo nhu cầu: bàn thờ, phòng nhỏ, bàn làm việc, quà tặng, người mới dùng; khác biệt bằng địa phương và thành phần. |
| Trầm Hương Kỳ Anh | Website timeout trong lần audit nên chưa đủ dữ liệu để đánh giá công bằng. | Theo dõi lại; tránh dùng kết luận không kiểm chứng. |
| [Vina Trầm](https://vinatram.vn/), [Trầm Hương S](https://tramhuongs.com/), [Khương Trầm Hương](https://khuongtramhuong.com/) | Đây là các domain khác xuất hiện trong SERP truy vấn rộng, cho thấy đối thủ organic thực tế rộng hơn danh sách ban đầu. | Theo dõi 10 domain có impression cạnh tranh trong GSC, không chỉ 5 đối thủ kinh doanh đã biết. |

### 3.3. Khoảng trống có thể sở hữu

- `trầm hương Phúc Trạch`, `nhang trầm Phúc Trạch`, `trầm hương Hương Khê`, `trầm hương Hà Tĩnh`.
- Minh bạch thành phần thực tế, thời gian cháy, số nén/số nụ và chi phí mỗi lần dùng.
- Combo dùng thử giá thấp cho người mới.
- Công cụ thiết kế vòng theo cỡ cổ tay—đây là tính năng khác biệt rõ nhưng cần landing page giải thích và gallery mẫu đã làm.
- Nội dung trung lập, không biến công dụng tâm linh/y tế thành cam kết bán hàng.
- Nội dung “tại xưởng/vùng nguyên liệu” bằng ảnh và người thật—đối thủ khó sao chép nếu An Chi có quan hệ thật.

## 4. Bản đồ từ khóa đề xuất

### Nguyên tắc

- Một URL = một intent chính; từ khóa gần nghĩa cùng intent dùng chung URL.
- Không tạo riêng các trang chỉ khác dấu/cách viết (`nhang trầm` và `nhang trầm hương`).
- Ưu tiên commercial long-tail trước từ khóa head.
- Chỉ chốt volume và thứ tự cuối cùng sau khi xuất dữ liệu Keyword Planner + GSC.

| Cụm/URL | Từ khóa chính | Biến thể/ngữ nghĩa | Intent | Ưu tiên |
|---|---|---|---|---|
| `/` | trầm hương Phúc Trạch | trầm hương Hương Khê, trầm hương Hà Tĩnh, An Chi Trầm Hương | Brand + commercial | Cao |
| `/danh-muc/nhang-tram-huong` | nhang trầm hương | nhang trầm sạch, nhang trầm tự nhiên, hương trầm, nhang trầm không hóa chất | Mua | Rất cao |
| SKU nhang có tăm | nhang trầm có tăm 30cm | hộp 100 nén, nhang bàn thờ, thời gian cháy | Mua | Rất cao |
| SKU nhang không tăm | nhang trầm không tăm | nhang ít khói, dùng phòng nhỏ/thiền | Mua | Rất cao |
| `/danh-muc/nu-tram-huong` | nụ trầm hương | nụ trầm tự nhiên, nụ trầm thác khói, nụ trầm giá bao nhiêu | Mua | Cao |
| `/danh-muc/vong-tay-tram-huong` | vòng tay trầm hương | vòng trầm nam/nữ, vòng 108 hạt, vòng 6mm/8mm | Mua | Cao |
| `/thiet-ke-vong-tay` | thiết kế vòng tay trầm hương | vòng trầm theo yêu cầu, theo cỡ cổ tay, phối charm | Mua/đặt riêng | Rất cao, khác biệt |
| `/vung-tram-phuc-trach` | trầm hương Phúc Trạch | làng nghề trầm Hương Khê, nguồn gốc trầm Hà Tĩnh | Local/informational | Rất cao |
| Bài thật–giả | cách phân biệt trầm hương thật | trầm thật giả, vòng trầm thật, nhang trầm thật | Thông tin → mua | Cao |
| Bài thành phần | nhang trầm hương làm từ gì | bột bời lời, nhang trầm có hóa chất không, đọc thành phần | Thông tin → mua | Cao |
| Bài chọn loại | nhang trầm có tăm và không tăm | loại nào ít khói, dùng bàn thờ/phòng ngủ | So sánh → mua | Cao |
| Bài giá | nhang trầm hương giá bao nhiêu | giá theo số nén/trọng lượng, chi phí mỗi lần đốt | Commercial investigation | Cao |
| Bài hướng dẫn | cách đốt nụ trầm hương | dùng lư/thác khói, thời gian cháy, an toàn | Hướng dẫn | Trung bình–cao |
| Bài vòng | cách chọn size vòng trầm | đo cổ tay, size hạt nam/nữ, số hạt | Hướng dẫn → thiết kế | Cao |
| Bài bảo quản | cách bảo quản vòng trầm | vòng dính nước, mất mùi, thay dây | Sau mua | Trung bình |
| Bài theo mùa | nhang trầm ngày Tết/rằm/Vu Lan | nhang bàn thờ, quà Tết trầm hương | Mùa vụ | Theo lịch |

### Từ khóa chưa nên ưu tiên riêng

- `trầm hương`, `mua trầm hương`, `vòng tay trầm hương cao cấp`: cạnh tranh rộng, authority hiện chưa đủ.
- `công dụng trầm hương`, `trầm hương chữa bệnh`: nhạy cảm và dễ dẫn tới claim y tế thiếu căn cứ.
- Các trang “hợp mệnh”, “thu hút tài lộc” nếu không phải định vị thương hiệu; đối thủ đã phủ dày và nội dung khó tạo khác biệt đáng tin.

## 5. Audit code chi tiết

### Phần đang làm tốt

- `apps/web/src/lib/seo.ts`: canonical tuyệt đối, metadata OG, clamp description, JSON-LD escape an toàn.
- `apps/web/src/lib/site.ts` + `robots.ts`: production mở index có kiểm soát; API bị chặn, trang noindex vẫn crawl được.
- `apps/web/src/app/sitemap.ts`: tự loại sản phẩm chưa có ảnh/mô tả; URL động và `lastModified` cho nội dung.
- Trang sản phẩm: chỉ xuất Product schema khi đủ ảnh/mô tả, có price/availability/shipping.
- Trang bài viết: Article schema, published/modified time, ảnh, TOC cho bài dài, liên kết sản phẩm liên quan.
- `next/image`, font tối ưu qua Next, title/description sửa được trong CMS.
- `/llms.txt` đã có; audit cũ nói chưa có nhưng code hiện tại đã bổ sung. Đây là hỗ trợ máy đọc, không thay sitemap/schema/nội dung.
- CMS có kiểm tra focus keyword, title, description, heading, alt, độ dài và mật độ.

### Phần code cần sửa

| Mức | Vị trí | Vấn đề | Cách sửa |
|---|---|---|---|
| Cao | `apps/web/src/app/sitemap.ts` | Danh mục rỗng/mỏng vẫn vào sitemap nếu CMS chưa bật noindex. | API trả `productCount`; chỉ include danh mục đủ điều kiện hoặc bắt buộc editor xác nhận indexability. |
| Cao | Product page | Có nội dung return policy nhưng schema chưa có `hasMerchantReturnPolicy`; shipping thiếu delivery time. | Chuẩn hóa dữ liệu policy và map sang schema.org/Google Merchant. |
| Cao | CMS SEO | Rule title cố định 45 ký tự do hậu tố, nhưng trang chủ dùng absolute title và Google đo pixel, không chỉ ký tự. | Chấm theo loại trang; cảnh báo mềm 50–60 ký tự, preview theo pixel; không ép từ khóa exact-match ở mọi vị trí. |
| Trung bình | `apps/web/src/app/(store)/bai-viet/[slug]/page.tsx` | Tác giả luôn là Organization; chưa có trang tác giả/thông tin chuyên môn. | Tạo Author model + `Person` schema + author page; Organization chỉ cho bài thực sự do ban biên tập. |
| Trung bình | Category page | Chưa có ItemList schema; nội dung guide chỉ là các đoạn text, khó tạo bảng/FAQ/link nội bộ giàu ngữ nghĩa. | Cho phép block content trong CMS: H2/H3, bảng, FAQ, ảnh, internal link. |
| Trung bình | Product page | `sku: product.slug` không phải mã kho ổn định; chưa có GTIN/MPN khi áp dụng. | Dùng mã SKU từ hệ thống kho; thêm GTIN/MPN chỉ khi có thật. |
| Trung bình | Home schema | `address` có nguy cơ là chuỗi thay vì `PostalAddress`; logo schema dùng SVG. | Chuẩn hóa PostalAddress hoặc bỏ address nếu không công khai; dùng PNG/JPG vuông crawl được. |
| Trung bình | Analytics | Code chỉ nạp GA/GTM, chưa chứng minh ecommerce events được gửi. | Viết event contract, test DebugView/Tag Assistant và đối chiếu đơn hàng. |
| Trung bình | 3D product media | Three.js có thể tăng JS/INP nếu tải ngay. | Dynamic import, placeholder ảnh tĩnh, chỉ hydrate khi gần viewport/có tương tác. |
| Thấp | Sitemap | Trang tĩnh không có `lastModified`; sitemap lỗi toàn bộ nếu API lỗi (chủ ý trong code). | Có thể thêm ngày cập nhật SEO page từ API; giám sát endpoint sitemap để phát hiện 5xx. |
| Thấp | Metadata | Chưa khai báo Twitter card rõ ràng; OG sản phẩm phụ thuộc ảnh CMS không có width/height. | Thêm `twitter: summary_large_image`; lưu width/height media và xuất metadata tương ứng. |

### Việc không nên làm

- Không thêm `meta keywords`; Google không dùng.
- Không tạo hàng trăm trang địa phương/từ khóa bằng template mỏng.
- Không index trang lọc/tìm kiếm nội bộ hoặc URL query vô hạn.
- Không thêm FAQ/review schema nếu nội dung không hiển thị thật.
- Không đổi URL bài đang có chỉ để nhét từ khóa; nếu buộc đổi phải 301 và cập nhật toàn bộ internal link/sitemap.
- Không xem `llms.txt` là giải pháp để được ChatGPT/Google nhắc tới; entity, nội dung và nguồn trích dẫn mới là nền tảng.

## 6. Kế hoạch nội dung 12 tuần

| Tuần | Nội dung/landing page | Mục tiêu |
|---|---|---|
| 1 | Trang vùng trầm Phúc Trạch/Hương Khê + ảnh thật | Entity, local authority, bằng chứng nguồn gốc |
| 2 | Landing nhang trầm + bảng chọn có tăm/không tăm | Commercial |
| 3 | Nhang trầm làm từ gì? Cách đọc thành phần | Trust + internal link SKU |
| 4 | Nhang trầm giá bao nhiêu? Bảng chi phí/lần đốt | Commercial investigation |
| 5 | Landing nụ trầm + cách chọn nụ/lư | Commercial |
| 6 | Cách đốt nụ an toàn cho phòng nhỏ | How-to |
| 7 | Landing vòng tay + bảng size cổ tay/hạt | Commercial |
| 8 | Landing thiết kế vòng + gallery quy trình | Điểm khác biệt/conversion |
| 9 | Phân biệt trầm thật–giả, cập nhật bằng ảnh/video thật | Authority |
| 10 | Nhang có tăm và không tăm: bảng so sánh | Comparison |
| 11 | Combo trầm cho người mới bắt đầu | Commercial |
| 12 | Nội dung mùa vụ kế tiếp, xuất bản trước 4–6 tuần | Seasonal demand |

Mỗi nội dung phải có: câu trả lời ngắn ngay đầu, ảnh/video riêng, tác giả thật, ngày cập nhật, 2–5 internal links, CTA phù hợp và dữ kiện sản phẩm kiểm chứng được.

## 7. Đo lường và tiêu chí hoàn thành

### Dashboard hàng tuần

- GSC: indexed pages, crawl errors, impressions, clicks, CTR, average position theo page/query.
- GA4: organic landing sessions, add-to-cart rate, checkout rate, purchase/revenue và outbound marketplace clicks.
- Merchant Center: approved/disapproved items.
- CWV: LCP/INP/CLS theo template trang.

### Mốc 30/60/90 ngày

- **30 ngày:** GSC sạch lỗi nghiêm trọng; sitemap chỉ chứa URL đủ chất lượng; 8–12 SKU hoàn chỉnh; tracking conversion đã test.
- **60 ngày:** 3 landing danh mục hoàn chỉnh; trang Phúc Trạch; 8 bài trong cluster; ≥80% URL sitemap được index.
- **90 ngày:** đánh giá bằng dữ liệu thật: query nào có impression, landing nào có CTR thấp, nội dung nào tạo add-to-cart; hợp nhất hoặc noindex trang không tạo giá trị.

Không đặt KPI “top 1” hoặc “100 đơn” trước khi có baseline. KPI hợp lý giai đoạn đầu là index coverage, non-brand impressions, số query top 20, CTR và conversion organic.

## 8. Bằng chứng kiểm tra production ngày 20/11/2026

- Trang chủ: HTTP 200; HSTS và các security header chính có mặt.
- `robots.txt`: `Allow: /`, `Disallow: /api/`, có dòng sitemap.
- `sitemap.xml`: 21 URL gồm 5 trang tĩnh, 5 danh mục, 1 sản phẩm, 3 chủ đề và 7 bài viết.
- Trang chủ có title, description, OG image, H1 và JSON-LD.
- Search công khai chưa hiển thị kết quả cho `site:tramhuonganchi.vn` trong lần audit; phải dùng GSC để xác nhận trạng thái index chính xác.

## 9. Nguồn benchmark

- [Trầm Tuệ](https://tramtue.vn/)
- [Landing nhang trầm của Trầm Tuệ](https://tramtue.vn/collections/nhang-tram-huong-sach)
- [Thiên Mộc Hương](https://thienmochuong.com/)
- [Trầm Hương Kinh Bắc](https://tramhuongkinhbac.com/)
- [Văn Hóa Trầm Hương](https://www.vanhoatramhuong.com/)
- [Báo Hà Tĩnh: làng trầm Phúc Trạch](https://baohatinh.vn/moi-ho-lang-tram-huong-ha-tinh-thu-gan-260-trieu-dongnam-post282285.html)
- [Quân đội nhân dân: trầm hương Hương Khê](https://ct.qdnd.vn/kinh-te-xa-hoi/tram-huong-o-huong-khe-531184)

