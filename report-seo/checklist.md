# Checklist thực hiện plan SEO

Theo `report-seo/plan.seo.md`. Cập nhật 20/11/2026.

- `[x]` đã làm xong trong code, đã typecheck, build và chạy thử ở local
- `[ ]` **Bạn làm**: cần CMS, VPS, Search Console, ảnh hoặc thông tin chỉ chủ shop có
- `[ ]` **Chưa làm**: việc code còn lại, để đợt sau

Tất cả code dưới đây **chưa commit và chưa lên production**.

## P0: ngay

- [ ] **Bạn làm: deploy lên VPS.** Commit, `git push`, rồi trên VPS chạy `sudo bash scripts/update.sh`. Việc này gỡ lỗi production đang 307 `/san-pham/*`, `/danh-muc/*` về `/countdown`. Code ở local đã tắt chuyển hướng này từ commit `cfb60d2`, chỉ là production chưa cập nhật.
  - Kiểm tra sau deploy: `curl -I https://tramhuonganchi.vn/danh-muc/nhang-tram-huong` phải trả `200`
  - Chạy `node .claude/skills/anchi-seo/scripts/check-sitemap.mjs https://tramhuonganchi.vn`
- [ ] **Bạn làm:** CMS > Cài đặt SEO > Trang chủ: sửa title đang có khoảng trắng kép. Đề xuất: `Trầm hương tự nhiên Phúc Trạch, Hương Khê | An Chi Trầm Hương` (mặc định trong code đã đổi sang câu này)
- [ ] **Bạn làm:** CMS: bỏ câu "100% thiên nhiên, không pha hương liệu" khỏi meta trang chủ, hoặc thay bằng thành phần thật có bằng chứng
- [ ] **Bạn làm:** Search Console: xác minh Domain Property, gửi `https://tramhuonganchi.vn/sitemap.xml`, kiểm tra URL trang chủ, 2 danh mục, 2 bài
- [x] Logo JSON-LD đổi từ SVG sang PNG 512×512 (`apps/web/public/brand/logo-square.png`)
- [x] Cập nhật `docs/web/seo/checklist.md` theo hiện trạng

## P0: trước mở bán 12/12/2026

- [ ] **Bạn làm:** 8–12 sản phẩm hoàn chỉnh, mỗi sản phẩm 4–6 ảnh thật, mô tả riêng, thành phần, kích thước, thời gian cháy. Hiện production chỉ có 1 sản phẩm đủ điều kiện index
- [x] Danh mục chưa có sản phẩm đang bán tự `noindex` và tự rời sitemap, không cần bật tay trên CMS
- [x] Trang `/chinh-sach`: giao hàng, đổi trả, thanh toán, bảo mật. Số liệu lấy từ CMS > Thông tin cửa hàng, đã có trong footer và sitemap. Title và description sửa được ở CMS > Cài đặt SEO
  - [ ] **Bạn làm:** đọc lại phần "Bảo mật thông tin" trên trang này cho đúng cách shop thực sự xử lý dữ liệu
- [x] Product schema: `hasMerchantReturnPolicy`, `deliveryTime`, `sku` theo id (không đổi khi sửa slug)
  - [ ] **Bạn làm:** trên CMS, chính sách đổi trả phải ghi số ngày (ví dụ "trong 7 ngày") và thời gian giao dạng "2–4 ngày", nếu không thì schema bỏ hai trường này
- [x] GA4: thêm `view_item` (trang sản phẩm) và `begin_checkout` (trang thanh toán). `add_to_cart`, `purchase` đã có từ trước
  - [ ] **Bạn làm:** kiểm tra trong GA4 DebugView hoặc Tag Assistant sau deploy
  - [ ] **Chưa làm:** sự kiện click Shopee, Zalo, gọi điện
- [x] `/countdown` tự chuyển 308 về trang chủ sau giờ mở bán
- [ ] **Bạn làm, sau 12/12:** xoá `apps/web/src/proxy.ts` khi đã qua ngày mở bán

## P1: 3–6 tuần

- [x] Organization có `PostalAddress`, `contactPoint`
- [x] Danh mục có schema `ItemList`
- [x] Thẻ `twitter:card` = `summary_large_image`
- [x] 3D và khung chat đã nạp bằng `next/dynamic` (đã đạt sẵn, không phải sửa)
- [x] Bản đồ từ khoá mới trong `docs/web/seo/keyword-map.md`
- [ ] **Chưa làm:** tác giả bài viết dạng `Person` và trang `/tac-gia/<slug>` (cần thêm model Author ở API, form ở CMS)
- [ ] **Chưa làm:** CMS cho phép block H2, bảng, FAQ ở nội dung danh mục
- [ ] **Chưa làm:** webhook xoá cache khi lưu CMS, màn hình quản lý redirect
- [ ] **Chưa làm:** trình kiểm SEO trong CMS cảnh báo title 50–60 ký tự theo loại trang
- [ ] **Bạn làm:** đo PageSpeed mobile cho trang chủ, 1 danh mục, 1 sản phẩm, 1 bài viết sau deploy
- [ ] **Bạn làm:** nội dung trang `/vung-tram-phuc-trach` (cần ảnh vườn, xưởng, người làm thật)
- [ ] **Bạn làm:** trang giới thiệu thêm người sáng lập, ảnh thật, giấy phép kinh doanh, mã số thuế
- [ ] **Bạn làm:** Google Business Profile

## Nội dung theo mùa

- [ ] Danh mục quà tặng + bài quà Tết trầm hương, **hạn 06/01/2027**
- [ ] Cập nhật bài rằm tháng Giêng, hạn 20/01/2027
- [ ] 8 bài mới theo `docs/web/seo/keyword-map.md`, mỗi tuần 1 bài

## P2: 2–4 tháng

- [ ] Merchant Center
- [ ] PR, backlink địa phương
- [ ] Đánh giá 30/60/90 ngày theo `plan.seo.md` mục 7

## File đã sửa

| File | Thay đổi |
|---|---|
| `apps/web/src/lib/seo.ts` | Logo PNG, thẻ Twitter, hàm `parseDayRange` |
| `apps/web/src/app/(store)/page.tsx` | Organization: PostalAddress, contactPoint, logo PNG |
| `apps/web/src/app/(store)/san-pham/[slug]/page.tsx` | sku, deliveryTime, hasMerchantReturnPolicy, view_item |
| `apps/web/src/app/(store)/danh-muc/[slug]/page.tsx` | noindex khi rỗng, ItemList |
| `apps/web/src/app/(store)/chinh-sach/page.tsx` | Trang mới |
| `apps/web/src/app/sitemap.ts` | Bỏ danh mục rỗng, thêm `/chinh-sach` |
| `apps/web/src/proxy.ts` | `/countdown` 308 sau mở bán |
| `apps/web/src/components/track-view-item.tsx` | Mới |
| `apps/web/src/components/checkout/checkout-form.tsx` | begin_checkout |
| `apps/web/src/lib/{links,nav,track,page-seo}.ts` | Link, footer, sự kiện, SEO mặc định trang chính sách |
| `apps/api/src/lib/seo-pages.ts` | SEO mặc định trang chính sách, title trang chủ (khớp web) |
| `apps/web/public/brand/logo-square.png` | Mới |
| `docs/web/seo/checklist.md`, `keyword-map.md`, `.claude/skills/anchi-seo/SKILL.md` | Cập nhật |
