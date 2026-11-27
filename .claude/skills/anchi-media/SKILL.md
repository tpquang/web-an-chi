---
name: anchi-media
description: Quy tắc ảnh và mô hình 3D An Chi gồm tải ảnh lên CMS, nén WebP tuỳ chọn, giới hạn dung lượng, nơi lưu file nhị phân, cache, alt, ảnh vân vật liệu hạt, file .glb cho charm và sản phẩm, dựng 3D bằng code hay tải từ CMS, ngân sách polygon và texture. Dùng khi thêm chỗ tải ảnh hoặc file, sửa nén ảnh, thêm mô hình 3D, sửa trình xem 3D, ảnh vân vật liệu, kể cả khi người dùng chỉ nói "cho up ảnh", "thêm 3D", "ảnh nặng quá".
---

# An Chi Media

## 1. Ảnh

| Loại | Nơi tải | Xử lý ở CMS | Lưu |
|---|---|---|---|
| Ảnh sản phẩm, bài viết, trang nội dung | `ImageUpload` (`apps/cms/src/components/media`) | Tuỳ chọn nén: cạnh dài ≤ 2000px, WebP, nhắm ≤ 600 KB | `MediaImage`, đường dẫn `/api/media/<id>` |
| Banner, slide trang chủ | Cấu hình trang chủ | Nén theo khung hiển thị | `SiteImage`, tự xoá khi không còn dùng |
| Ảnh vân vật liệu hạt | Trang ảnh vân | Cắt vuông 1024px, WebP | `BeadTexture` |

- Mọi chỗ tải ảnh mới dùng lại `ImageUpload` và `uploadMedia` (`apps/cms/src/lib/media.ts`), có công tắc **Nén sang WebP** (máy nhớ lựa chọn). Không viết bộ nén thứ hai.
- Giới hạn: file gốc ≤ 25 MB trước khi nén; gửi lên ≤ 8 MB. Số ở CMS (`MEDIA`) và API (`MEDIA_SPEC`) phải khớp nhau.
- API kiểm byte đầu file (`lib/image.ts`), không tin `content-type` hay đuôi file. Chỉ nhận WebP, PNG, JPEG.
- File đã tải không bao giờ bị sửa: muốn đổi ảnh thì tải ảnh mới, lấy id mới. Nhờ vậy route đọc trả `cache-control: public, max-age=31536000, immutable`.
- Ảnh có nội dung phải có `alt` mô tả thật (không nhồi từ khoá). Ảnh trang trí `alt=""`.
- Web hiển thị qua `next/image`, có kích thước hoặc `aspect-ratio`. Ngân sách dung lượng theo [anchi-seo](../anchi-seo/SKILL.md) mục 10.

## 2. Mô hình 3D

Có hai cách, chọn theo loại hàng:

| Cách | Khi nào | Ở đâu |
|---|---|---|
| Dựng bằng code | Hình học đơn giản, cần đổi ảnh in theo sản phẩm (hộp tròn, hộp nhang) | `apps/web/src/components/box3d`, enum `Product3DModel` |
| Tải `.glb` từ CMS | Hình phức tạp làm bằng Blender (charm, tượng, lư hương...) | `MaterialModel` (charm), `ProductModel` (sản phẩm) |

Quy cách file `.glb`:

- Chỉ nhận **glTF Binary (.glb)**, texture nhúng trong file. API kiểm 4 byte đầu là `glTF`.
- Dung lượng tối đa 15 MB (`MODEL_SPEC` ở `apps/api/src/lib/model-file.ts` ↔ `MAX_MB` ở `apps/cms/src/components/ModelUploadModal.tsx`), nên ≤ 5 MB cho trang sản phẩm. Mọi chỗ tải `.glb` dùng `modelBody` + `readGlb` (API) và `ModelUploadModal` (CMS).
- Tối đa khoảng 100.000 tam giác, texture cạnh dài ≤ 2048px. Không dùng Draco, meshopt, KTX2 khi trình xem chưa bật decoder tương ứng.
- Trục Y hướng lên, gốc toạ độ ở giữa đáy vật. Trình xem tự căn giữa và co theo khung, nên đơn vị trong file không quan trọng.
- Vật liệu PBR (metallic, roughness). Không dựa vào đèn trong file, trình xem tự đặt đèn và môi trường.

Trình xem:

- Mọi mô hình trên trang sản phẩm đi qua khung xem chung `apps/web/src/components/box3d/model-scene.tsx` (đèn, xoay, bóng). File `.glb` dựng ở `box3d/glb.ts`, link file có `?v=<updatedAt>` để cache `immutable`.
- Chỉ tải three.js và file 3D khi khách bấm xem hoặc khối 3D vào khung nhìn (`next/dynamic`, `ssr: false`). Ảnh sản phẩm luôn là nội dung đầu tiên, 3D không chặn LCP.
- Có trạng thái đang tải, lỗi (quay về ảnh), và nút đóng hoặc quay lại ảnh. Tôn trọng `prefers-reduced-motion`: không tự xoay.
- Cách bọc ảnh vân lên hạt có hai bản: `apps/cms/src/components/BeadPreview.tsx` ↔ `apps/web/src/components/bracelet/bracelet-scene.tsx`. Sửa một bên thì sửa bên kia.

## 3. Nơi lưu file nhị phân

- Hiện tại ảnh và `.glb` lưu thẳng trong PostgreSQL (`Bytes`), mỗi loại một bảng, đọc qua route có id. Route danh sách không bao giờ select cột `Bytes`; dữ liệu nhị phân để ở bảng riêng (như `MaterialModel`) để danh sách không phải đọc cả file.
- Không trả file dạng base64 trong JSON.
- Database phình theo ảnh: trước khi tải nhiều ảnh, mô hình thật thì chuyển sang lưu file trên ổ hoặc object storage (việc ghi ở backlog). Khi chuyển, mọi đọc ghi đi qua một module lưu trữ chung, giữ nguyên đường dẫn `/api/media/<id>` cho web.
