---
name: anchi-backend
description: Quy tắc backend An Chi (apps/api, Express 5, Prisma 7, PostgreSQL) gồm cấu trúc module, kiểm dữ liệu bằng zod, HttpError và mã lỗi, phân quyền CMS, tiền VND, tồn kho, sổ kho, giá vốn, vòng đời đơn, migration, giới hạn tần suất, việc nền và kiểm thử. Dùng khi thêm hoặc sửa route API, model Prisma, migration, logic giá, kho, đơn hàng, đợt nhập, lãi lỗ, phân quyền nhân viên, kể cả khi người dùng chỉ nói "thêm API", "thêm trường", "sửa cách tính tiền".
---

# An Chi Backend

Nghiệp vụ hiện tại (đặt hàng, kho, tài khoản, chat) mô tả ở [docs/README.md](../../../docs/README.md) mục Backend. Skill này là luật phải theo khi viết code.

## 1. Cấu trúc

- Chỉ `apps/api` chạm database. Web và CMS không import Prisma, không tự tính tiền thay API.
- Route công khai: `src/modules/<tên>/<tên>.routes.ts`, gắn ở `src/app.ts` dưới `/api/v1`. Route quản trị: `src/modules/admin/admin.<mảng>.ts`, gắn trong `admin.routes.ts` **sau** `requireAdmin` và `requirePermission`.
- Logic nghiệp vụ dùng lại ở nhiều route (giá, kho, nhập kho, cọc, redirect) đặt trong `src/lib/`. Route chỉ parse, gọi lib, trả JSON.
- ESM: import nội bộ ghi đuôi `.js`. Prisma client import từ `../../generated/prisma/client.js`.
- Phản hồi thành công: `{ data }`, danh sách phân trang thêm `meta`. Tạo mới trả 201, xoá trả 204.

## 2. Dữ liệu vào và lỗi

- Mọi `req.body`, `req.query` đi qua schema zod. Câu báo lỗi trong schema viết tiếng Việt, nói rõ cách sửa, theo [anchi-brand](../anchi-brand/SKILL.md).
- Lỗi có chủ đích: `throw new HttpError(status, "Câu tiếng Việt cho người dùng", "MA_LOI")`. Mã lỗi viết hoa, ổn định để web, CMS rẽ nhánh (`PRICE_CHANGED`, `BAD_TRANSITION`, `NOT_ENOUGH_STOCK`...). Không trả stack, không trả lỗi Prisma thô.
- Không đọc được thì 404, sai luật nghiệp vụ hoặc trùng thì 409, thiếu quyền 403, chưa đăng nhập 401, quá tần suất 429.
- Không bao giờ trả `passwordHash`, token, mã bí mật. Select rõ trường khi trả bản ghi có dữ liệu nhạy cảm.

## 3. Phân quyền CMS

- Quyền xét theo đoạn đầu đường dẫn admin qua `PERMISSION_MODULES` trong `src/lib/permissions.ts`. Thêm route admin với đoạn đầu mới thì **phải** thêm đoạn đó vào đúng module, nếu không route mở cho mọi nhân viên.
- GET cần `view`, còn lại cần `edit`. Mục chạm tiền nhận về, tài khoản ngân hàng, nhân viên: chỉ chủ shop.
- CMS ẩn menu theo cùng danh sách, nhưng ẩn menu không thay được kiểm quyền ở API.

## 4. Tiền, kho, giá vốn

- Tiền bán, tiền thu, phí: số nguyên VND (`Int`). Giá vốn bình quân được phép `Float` vì chia theo đơn vị; làm tròn khi hiển thị, không làm tròn khi cộng dồn.
- Giá, phí giao, tiền cọc, tổng đơn luôn tính ở server. Client gửi số dự kiến để API so (`expectedTotalVnd`), không gửi số để API tin.
- Mọi thay đổi `Material.stock` hoặc `Product.stock` nằm trong `prisma.$transaction` và ghi một dòng `StockMovement` cùng transaction. Trừ kho có điều kiện (`stock >= n`) để hai request đồng thời không bán quá.
- Đơn lưu ảnh chụp lúc đặt: tên, đơn giá, giá vốn (`OrderItem.unitCostVnd`), thiết kế vòng. Báo cáo lợi nhuận đọc từ ảnh chụp, không đọc giá hiện tại.
- Đợt nhập đã nhập kho thì khoá. Muốn sửa thì điều chỉnh bằng `ADJUST`, không sửa ngược lịch sử.
- Công thức chia chi phí đợt nhập có hai bản: `apps/api/src/lib/inventory.ts` và `apps/cms/src/lib/batch.ts`. Sửa một bên thì sửa bên kia trong cùng thay đổi.

## 5. Đơn hàng

- Đổi trạng thái chỉ qua `modules/orders/order-flow.ts`. Không `prisma.order.update({ status })` ở chỗ khác.
- Mỗi thay đổi trạng thái, tiền, hoàn tiền ghi một `OrderEvent` có người làm.
- Tạo đơn có `idempotencyKey`. Endpoint công khai có thể bị bấm lặp thì phải chịu được gọi hai lần.

## 6. Schema và migration

- Mọi thay đổi `schema.prisma` đi qua `npm run db:migrate` (đặt tên migration bằng tiếng Anh, `snake_case`), commit cả thư mục migration. Không sửa migration đã commit.
- Mỗi trường mới có comment tiếng Việt nói ý nghĩa, đơn vị, giá trị trống nghĩa là gì. Comment đặt ngay trên trường hoặc model nó mô tả.
- Trường mới trên bảng đã có dữ liệu: có `@default` hoặc nullable để migration chạy được trên production.
- Dữ liệu mẫu đổi theo schema thì sửa `prisma/sample-data.json` và `prisma/seed.ts` cùng lúc.

## 7. An toàn và vận hành

- Endpoint công khai nhận mật khẩu, mã bí mật, tạo đơn, gửi tin: dùng `failureLimiter` (`src/lib/rate-limit.ts`). Request từ web đều qua server Next nên đếm theo số điện thoại hoặc mã, không chỉ theo IP.
- IP khách lấy bằng `clientIp(req)`, không đọc thẳng header.
- Biến môi trường mới khai báo trong `src/env.ts` (zod) và `.env.example` có comment. Tính năng cần khoá ngoài (Google, cổng thanh toán) phải tự tắt khi thiếu biến, không làm API chết.
- Rate limiter và `chat-bus` nằm trong bộ nhớ: API chỉ chạy **một** tiến trình. Muốn chạy nhiều tiến trình thì chuyển sang Postgres hoặc Redis trước.
- Việc định kỳ đặt trong `src/jobs.ts`, chạy lại nhiều lần không sai.

## 8. Kiểm tra

- Trước khi xong: `npm run typecheck`, `npm run build`.
- Logic tiền, kho, cọc, hoàn tiền, chuyển trạng thái là hàm thuần trong `src/lib/` để test được. Khi dự án có test, thay đổi ở các hàm này phải kèm test.
- Đổi hành vi API thì cập nhật `docs/README.md` mục Backend trong cùng thay đổi.
