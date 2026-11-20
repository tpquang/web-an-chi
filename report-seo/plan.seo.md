# Plan sửa SEO tổng thể An Chi Trầm Hương

Tổng hợp từ `claude.seo.md` và `gpt.seo.md`, có đối chiếu production `https://tramhuonganchi.vn` ngày 20/11/2026.

## 0. Review hai báo cáo

| Điểm | claude.seo.md | gpt.seo.md | Kết luận sau kiểm tra |
|---|---|---|---|
| Trạng thái index | Ghi là "đang tắt" (chỉ đọc code mặc định) | Production đã mở index, robots `Allow: /` | **GPT đúng.** robots và sitemap production đang mở |
| Ảnh OG mặc định | Ghi là "chưa có" | Có OG image | **GPT đúng.** `public/brand/default-og.png` 1200×630 đã có. Checklist trong docs lỗi thời |
| Sitemap | Dự đoán gần như không có sản phẩm | 21 URL, 1 sản phẩm, 5 danh mục | Đúng 21 URL |
| **Redirect countdown** | Cảnh báo "đừng bật lại" | Không nhắc | **Cả hai sót:** production đang **307 `/san-pham/*`, `/danh-muc/*` về `/countdown` (noindex)**. Bản deploy chưa có commit tắt cờ. 6 URL trong sitemap là redirect về trang noindex |
| Title trang chủ | Không kiểm production | Khoảng trắng kép, khác mặc định code | Đúng: `Trầm Hương An Chi – Hương trầm thật từ  Phúc Trạch` |
| Claim "100% thiên nhiên" | Nêu chung về đối thủ | Nêu cụ thể trên meta An Chi | Đúng, trái quy tắc anchi-brand nếu không có bằng chứng |
| Danh mục mỏng trong sitemap | Không nêu | Nêu | Đúng, sitemap chỉ lọc `noindex` |
| Logo schema SVG | Không nêu | Nêu | Đúng: `logo-square.svg` ([page.tsx:44](../apps/web/src/app/(store)/page.tsx#L44)). Google cần PNG/JPG |
| Đối thủ | Thiên Mộc Hương, Kinh Bắc, Trầm Tuệ, Long Châu | Sâu hơn, có bảng benchmark, thêm Vina Trầm, Trầm Hương S | GPT chi tiết hơn |
| Từ khoá | Có slug bài cụ thể, danh mục quà tặng | Ưu tiên long-tail Phúc Trạch, nhang có tăm/không tăm | Gộp lại (mục 4) |
| Lịch mùa vụ | Có ngày Tết 2027 | Chung chung | Giữ mốc của Claude |
| Đo lường | Ít | Có KPI 30/60/90 | Giữ của GPT |

Cả hai đều không có số lượt tìm. Mọi ưu tiên từ khoá vẫn là giả thuyết, phải đo bằng GSC hoặc Keyword Planner.

---

## 1. P0: làm ngay (tuần này)

| # | Việc | Nơi sửa | Kiểm tra |
|---|---|---|---|
| 1 | **Deploy commit đã tắt `REDIRECT_TO_COUNTDOWN`** (`cfb60d2` trở đi), hoặc quyết định rõ: nếu vẫn chặn đến 12/12 thì bỏ `/san-pham`, `/danh-muc/*`, sản phẩm khỏi sitemap trong thời gian chặn | `scripts/update.sh`; [src/proxy.ts](../apps/web/src/proxy.ts) | `curl -I /danh-muc/nhang-tram-huong` trả 200 |
| 2 | Sửa title trang chủ trên CMS (bỏ khoảng trắng kép). Đề xuất `Trầm hương Phúc Trạch, Hương Khê \| An Chi` | CMS > Cài đặt SEO | View source |
| 3 | Gỡ "100% thiên nhiên, không pha hương liệu" khỏi meta, hoặc thay bằng thành phần công bố cụ thể, có bằng chứng trên trang | CMS | |
| 4 | Xác minh GSC Domain Property, gửi sitemap, URL Inspection trang chủ + 2 danh mục + 2 bài | GSC | Báo cáo Page indexing |
| 5 | Đổi logo Organization sang PNG vuông ≥ 112px | [page.tsx:44](../apps/web/src/app/(store)/page.tsx#L44), `public/brand/` | Rich Results Test |
| 6 | Cập nhật [docs/web/seo/checklist.md](../docs/web/seo/checklist.md): OG mặc định đã có, trạng thái production thật | docs | |

## 2. P0: trước mở bán 12/12/2026

| # | Việc | Ghi chú |
|---|---|---|
| 7 | **8–12 SKU hoàn chỉnh** (hiện chỉ 1 sản phẩm được index): nhang có tăm, nhang không tăm, nụ trầm, combo thử, hộp quà, vòng 6mm/8mm/108 hạt | Mỗi SKU 4–6 ảnh thật, mô tả riêng, thành phần, kích thước, thời gian cháy, cách dùng. Tên có thuộc tính phân biệt, ví dụ `Nhang trầm Phúc Trạch có tăm 30 cm, hộp 100 nén` |
| 8 | Danh mục chưa đủ hàng: noindex trên CMS và lọc khỏi sitemap | Code: API trả `productCount`, [sitemap.ts](../apps/web/src/app/sitemap.ts) bỏ danh mục có ít hơn 1 (hoặc 3) sản phẩm đang bán |
| 9 | Trang chính sách: giao hàng, đổi trả, thanh toán, bảo mật, liên hệ | Route tĩnh mới, kiểm không trùng slug CMS, thêm vào sitemap và footer |
| 10 | Product schema: `hasMerchantReturnPolicy` (`MerchantReturnPolicy` có cấu trúc, không phải câu tự do), `deliveryTime` từ `store.shipping.eta`, `sku` dùng mã kho cố định thay `product.slug` | [san-pham/[slug]/page.tsx](../apps/web/src/app/(store)/san-pham/[slug]/page.tsx) |
| 11 | Tracking GA4: `view_item`, `add_to_cart`, `begin_checkout`, `purchase`, click Shopee/Zalo/điện thoại. Test bằng DebugView | `lib/track.ts` |
| 12 | Sau mở bán: gỡ `proxy.ts`, cho `/countdown` 308 về `/` | Theo ghi chú trong file |

## 3. P1: 3–6 tuần

**Code**

| Việc | Nơi sửa |
|---|---|
| Article `author` dạng `Person` + trang tác giả `/tac-gia/<slug>` (thêm vào cấu trúc URL trong skill anchi-seo) | [bai-viet/[slug]/page.tsx:71](../apps/web/src/app/(store)/bai-viet/[slug]/page.tsx#L71), API model Author |
| Organization: `PostalAddress` chuẩn (hoặc bỏ nếu không công khai), `telephone`, `contactPoint`, `sameAs` đủ kênh thật | Trang chủ, CMS Thông tin cửa hàng |
| Danh mục: `ItemList` schema; CMS cho phép block H2/H3, bảng, FAQ hiển thị, link nội bộ; nội dung 500–900 từ đặt dưới lưới sản phẩm | `danh-muc/[slug]`, CMS |
| 3D (`ProductMedia`, `/thiet-ke-vong-tay`): dynamic import, ảnh tĩnh `priority` trước, chỉ hydrate khi tương tác hoặc gần viewport | `components/box3d` |
| Chat launcher nạp sau tương tác hoặc idle | root layout |
| `twitter: summary_large_image`, width/height cho ảnh OG sản phẩm | `lib/seo.ts` |
| Đo Lighthouse/PSI mobile 4 template, ghi số vào checklist | |
| Webhook revalidate khi lưu CMS; màn hình quản lý redirect | API + web |
| CMS SEO checker: cảnh báo title 50–60 ký tự theo loại trang, không ép exact-match | CMS |

**Nội dung**

- Trang `/vung-tram-phuc-trach`: ảnh vườn, xưởng, người làm, quy trình. Cần chứng minh An Chi gắn với vùng này thật.
- Hero trang chủ: H1 nêu Phúc Trạch (đề xuất `Trầm hương Phúc Trạch cho nếp sống an lành`), thêm 80–120 chữ dưới hero.
- `/gioi-thieu`: người sáng lập, giấy phép kinh doanh, mã số thuế, ảnh thật.
- Landing `/thiet-ke-vong-tay`: H1, giải thích, bảng giá hạt và gallery trong HTML server.
- Google Business Profile (dạng service-area nếu không có cửa hàng).

## 4. Bản đồ từ khoá thống nhất

Ghi vào [docs/web/seo/keyword-map.md](../docs/web/seo/keyword-map.md). Chưa có lượt tìm.

| URL | Cụm chính | Cụm phụ |
|---|---|---|
| `/` | trầm hương Phúc Trạch | trầm hương Hương Khê, trầm hương Hà Tĩnh, trầm hương tự nhiên |
| `/vung-tram-phuc-trach` (mới) | làng trầm Phúc Trạch | nguồn gốc trầm Hà Tĩnh |
| `/san-pham` | sản phẩm trầm hương | mua trầm hương |
| `/danh-muc/nhang-tram-huong` | nhang trầm hương | nhang trầm sạch, hương trầm thờ cúng |
| SKU nhang có tăm / không tăm | nhang trầm có tăm 30cm / nhang trầm không tăm | hộp 100 nén, nhang ít khói |
| `/danh-muc/nu-tram-huong` | nụ trầm hương | nụ trầm thác khói, nụ trầm xông nhà |
| `/danh-muc/vong-tay-tram-huong` | vòng tay trầm hương | vòng trầm 108 hạt, 6mm, 8mm, nam, nữ |
| `/thiet-ke-vong-tay` | thiết kế vòng tay trầm hương | vòng trầm theo cỡ cổ tay, phối charm |
| `/danh-muc/tram-mieng`, `/danh-muc/lu-xong-va-phu-kien` | trầm miếng, lư xông trầm | chỉ index khi có hàng |
| `/danh-muc/qua-tang-tram-huong` (mới, trước Tết) | quà tặng trầm hương | quà Tết trầm hương, hộp quà trầm |

**Bài viết** (đã có: phân biệt thật giả, trầm tự nhiên và trầm cấy, cách đốt nụ, bảo quản vòng, rằm tháng Giêng, nhang bàn thờ, xông góc làm việc). Thêm:

| Bài mới | Cụm |
|---|---|
| Nhang trầm làm từ gì | thành phần nhang trầm, nhang có hoá chất không |
| Nhang có tăm và không tăm | loại nào ít khói |
| Nhang trầm giá bao nhiêu | giá theo nén, chi phí mỗi lần đốt |
| Giá vòng tay trầm hương | bảng giá theo cỡ hạt và loại (dữ liệu đã có) |
| Trầm tốc, trầm sánh, trầm chìm | trầm tốc là gì |
| Cách chọn size vòng trầm | đo cổ tay, cỡ hạt |
| Khói nhang trầm có độc không | viết trung thực, không hứa công dụng |
| Quà Tết trầm hương | mùa vụ |

**Không nhắm:** `trầm hương` (head), `trầm hương chữa bệnh`, `hợp mệnh`, `tài lộc` (trái anchi-brand, đối thủ phủ dày).

## 5. Lịch nội dung

| Hạn | Nội dung |
|---|---|
| 12/12/2026 | P0 mục 7–12 |
| **06/01/2027** | Danh mục quà tặng, bài quà Tết, cập nhật bài nhang bàn thờ (Tết: 06/02/2027) |
| 20/01/2027 | Cập nhật bài rằm tháng Giêng (rằm: ~20/02/2027) |
| Tuần 1–12 sau mở bán | 1 bài hoặc landing mỗi tuần theo bảng mục 4, thứ tự theo `gpt.seo.md` mục 6 |
| Trước 07/2027 | Nội dung Vu Lan |

Không đổi URL trong mùa Tết, rằm tháng Giêng, Vu Lan.

## 6. P2: 2–4 tháng

- Merchant Center / free listings khi giá, tồn kho, chính sách khớp schema.
- Digital PR địa phương: Báo Hà Tĩnh, hồ sơ OCOP, link từ shop Shopee/Lazada chính thức. Không mua backlink.
- Cập nhật bài cũ thay vì tạo URL trùng ý định.

## 7. Đo lường

- **30 ngày:** không còn redirect trong sitemap, GSC sạch lỗi nghiêm trọng, 8–12 SKU index được, tracking đã test.
- **60 ngày:** 3 landing danh mục hoàn chỉnh, trang Phúc Trạch, ≥ 80% URL sitemap được index.
- **90 ngày:** đánh giá theo query, CTR, add-to-cart; gộp hoặc noindex trang không có giá trị.

Chưa có baseline thì không đặt KPI thứ hạng.

## 8. Không làm

`meta keywords`; trang địa phương làm từ template mỏng; FAQ/review schema khi nội dung không hiển thị; đổi URL chỉ để nhét từ khoá; chặn URL cũ trong robots; coi `llms.txt` là giải pháp.
