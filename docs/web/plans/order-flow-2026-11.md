# Kế hoạch: đặt hàng qua giỏ hàng (11/2026)

**Trạng thái:** đã làm xong mục 4, 5, 6 ngày 26/11/2026. Kiểm bằng script gọi API (31 tình huống) và chạy trọn trên trình duyệt ở máy tính và điện thoại.

Phạm vi: đơn khách tự đặt trên web, từ giỏ hàng tới lúc giao xong, huỷ hoặc hoàn hàng. Gồm API, web và CMS. Đơn nhập tay ở CMS (Shopee, TikTok, khách giới thiệu) chỉ đổi phần trạng thái và lịch sử cho thống nhất.

## 1. Hiện trạng: lỗi và chỗ thiếu

Kiểm tra code ngày 26/11/2026.

**Lỗi**

| # | Chỗ | Vấn đề | Hậu quả |
|---|---|---|---|
| L1 | `placeOrder` | Đặt hàng tính lại giá nhưng không so với số khách đã thấy ở trang thanh toán | Shop đổi giá trong lúc khách điền form thì khách bị tính giá mới mà không biết |
| L2 | `PATCH /admin/orders/:id` | Đổi trạng thái tự do, không có luật chuyển | Đơn đã giao quay về "Chờ xác nhận", đơn huỷ nhảy thẳng sang "Đã giao" |
| L3 | `POST /orders` | Không giới hạn số đơn | Một người spam đơn chuyển khoản là giữ hết tồn kho |
| L4 | Đơn chuyển khoản, đơn cọc | Không có hạn thanh toán | Khách không chuyển tiền thì đơn treo mãi, giữ kho mãi |

**Thiếu để vận hành**

- Không có lịch sử đơn: không biết ai đổi trạng thái, nhận tiền lúc nào.
- Không có lý do huỷ, người huỷ, số tiền phải hoàn. Khách không tự huỷ được.
- Không có trạng thái giao thất bại, hoàn hàng (khách không nhận hàng).
- Không có mã vận đơn, đơn vị vận chuyển.
- Ghi nhận tiền chỉ là một ô chọn trạng thái, không có số tiền thật đã nhận.
- Cọc chỉ theo phạm vi chung (mọi đơn, hoặc đơn đặt chờ và vòng tự thiết kế). Không đánh dấu được từng sản phẩm cần cọc, không có ngưỡng theo giá trị đơn.
- Shop không được báo khi có đơn mới, phải tự mở CMS.
- CMS không có danh sách "việc cần làm": đơn chờ xác nhận quá lâu, đơn sắp hết hạn thanh toán, đơn cần hoàn tiền.

## 2. Chính sách (mặc định, chủ shop sửa ở CMS)

**Thanh toán**

- Mặc định trả khi nhận hàng (COD). Chuyển khoản cả đơn là lựa chọn thứ hai, chỉ hiện khi shop có tài khoản ngân hàng.
- Đơn chuyển khoản hoặc cần cọc có **hạn thanh toán 24 giờ** (sửa được 2–72 giờ). Quá hạn chưa nhận tiền thì hệ thống tự huỷ, trả kho.

**Đặt cọc** (bật tắt, 30–50% tiền hàng, làm tròn lên nghìn đồng). Đơn cần cọc khi có một trong các điều kiện:

1. Có vòng tự thiết kế (làm riêng, khó bán lại).
2. Là đơn đặt chờ trước ngày mở bán.
3. Có sản phẩm được đánh dấu "Cần đặt cọc" ở CMS (hàng đặt làm, hàng giá trị cao).
4. Tạm tính từ một mức shop đặt, ví dụ từ 2.000.000đ (để trống là không áp dụng).

Mỗi điều kiện bật tắt riêng. Trang thanh toán nói rõ vì sao đơn cần cọc.

**Huỷ đơn**

| Lúc huỷ | Ai huỷ | Tiền đã chuyển |
|---|---|---|
| Chờ chuẩn bị, Chờ xác nhận, Chờ thanh toán | Khách tự huỷ trên web, hoặc shop | Hoàn 100% |
| Đã xác nhận, đang chuẩn bị | Chỉ shop (khách nhắn hoặc gọi shop) | Hàng có sẵn: hoàn 100%. Đơn có hàng làm riêng (vòng tự thiết kế, sản phẩm cần cọc): giữ tiền cọc, hoàn phần còn lại |
| Đang giao | Không huỷ. Khách từ chối nhận thì shop ghi "Hoàn hàng" | Hoàn tiền đã chuyển, trừ phí giao |
| Đã giao | Không huỷ. Đổi trả theo chính sách đổi trả | Theo chính sách đổi trả |
| Hệ thống | Quá hạn thanh toán | Chưa nhận tiền nên không hoàn |

Chính sách hiện ở trang `/chinh-sach`, trang thanh toán (một dòng tóm tắt và link) và trang đơn hàng.

## 3. Vòng đời đơn

```
                 ┌──────────── huỷ (khách / shop / hệ thống) ───────────┐
PREORDER ──┐     │                                                       ▼
           ├──▶ PENDING ──▶ CONFIRMED ──▶ SHIPPING ──▶ COMPLETED     CANCELLED
(đặt chờ)  │   (chờ xác nhận /           │      │            │          │
           │    chờ thanh toán)          │      └──▶ RETURNED ◀┘     mở lại ─▶ PENDING
           └───────────────────────────▶ CONFIRMED                   (nếu còn hàng)
```

| Từ | Được sang | Kho |
|---|---|---|
| PREORDER | PENDING, CONFIRMED, CANCELLED | Chưa trừ. Sang PENDING, CONFIRMED thì trừ |
| PENDING | CONFIRMED, CANCELLED | Đã trừ. Huỷ thì trả |
| CONFIRMED | SHIPPING, CANCELLED | Đã trừ. Huỷ thì trả |
| SHIPPING | COMPLETED, RETURNED | Đã trừ. Hoàn hàng thì trả |
| COMPLETED | RETURNED (đổi trả) | Hoàn hàng thì trả |
| CANCELLED | PENDING (mở lại) | Trừ lại, thiếu hàng thì báo lỗi |
| RETURNED | (hết) | |

- "Chờ thanh toán" không phải trạng thái riêng. Đó là PENDING còn tiền phải chuyển (`paymentDueAt` có giá trị và chưa nhận đủ).
- Xác nhận đơn còn tiền phải chuyển thì CMS hỏi lại, không chặn: shop có thể đã nhận tiền mặt.
- Giao xong đơn COD thì tự ghi đã thu đủ tiền (tiền thu hộ), shop sửa được.
- Mọi thay đổi ghi vào lịch sử đơn (`OrderEvent`): ai làm (nhân viên, khách, hệ thống), lúc nào, từ trạng thái nào sang trạng thái nào, số tiền, ghi chú.

## 4. Backend (API)

**Dữ liệu** (một migration)

- `OrderStatus` thêm `RETURNED`.
- `Order` thêm:
  - `paidVnd`: tổng tiền đã nhận.
  - `refundVnd`: tiền phải hoàn; `refundedAt`: lúc đã hoàn.
  - `paymentDueAt`: hạn thanh toán.
  - `cancelReason`, `cancelledBy` (`CUSTOMER`, `STAFF`, `SYSTEM`).
  - `carrier`, `trackingCode`: đơn vị vận chuyển, mã vận đơn.
- `PaymentStatus` suy ra từ số tiền: chưa trả, đã nhận cọc, đã trả đủ, đã hoàn.
- Bảng `OrderEvent`.
- `Product.requiresDeposit`.
- Setting `store`:
  - `deposit` đổi thành các điều kiện riêng. Đọc được cả dạng cũ có `scope`.
  - Thêm `paymentHoldHours`.

**Luật nghiệp vụ** trong `modules/orders/order-flow.ts`, một nơi duy nhất cho cả web và CMS:

- `transition(order, to, actor, extra)`: kiểm luật chuyển, trừ hoặc trả kho, ghi lịch sử.
- `recordPayment(order, amount, actor)`: cộng `paidVnd`, suy ra `paymentStatus`, bỏ hạn thanh toán khi đã đủ cọc hoặc đủ tiền.
- `cancelOrder(order, actor, reason)`: kiểm quyền theo bảng huỷ, trả kho, tính số tiền gợi ý phải hoàn theo chính sách.
- `markRefunded(order, amount)`.
- `depositRule(store, lines, preorder)`: trả về số tiền cọc và lý do.

**Endpoint**

- `POST /orders`:
  - Giới hạn 5 đơn mỗi IP trong 10 phút; tối đa 3 đơn đang chờ thanh toán mỗi số điện thoại.
  - Nhận `expectedTotalVnd`; lệch với giá tính lại thì trả 409 `PRICE_CHANGED`.
  - Đặt `paymentDueAt` khi đơn cần chuyển tiền.
- `GET /orders/:code`: thêm hạn thanh toán, có được tự huỷ hay không, tóm tắt chính sách huỷ, mã vận đơn, lịch sử rút gọn cho khách. Không trả tên nhân viên.
- `POST /orders/:code/cancel` `{ phone, reason }`: khách tự huỷ, phải đúng số điện thoại của đơn.
- Admin:
  - `POST /admin/orders/:id/transition` `{ to, note, carrier, trackingCode }`.
  - `POST /admin/orders/:id/payment` `{ amountVnd }`.
  - `POST /admin/orders/:id/cancel` `{ reason, refundVnd }`.
  - `POST /admin/orders/:id/refund`.
  - `GET /admin/orders?view=todo|payment|refund`.
  - `PATCH` chỉ còn sửa ghi chú, phí sàn, ship thực trả, mã vận đơn.
- Việc nền chạy trong tiến trình API mỗi 5 phút: huỷ đơn quá hạn thanh toán, ghi lịch sử "Hệ thống huỷ: quá hạn thanh toán".
- Báo đơn mới, đơn khách huỷ qua luồng SSE có sẵn của CMS (`/admin/inbox/stream`).
- Báo cáo lợi nhuận: đơn RETURNED không tính doanh thu; phí giao thực trả của đơn hoàn hàng vẫn tính là chi phí.

## 5. Web

- **Giỏ, bảng giỏ:**
  - Gỡ dòng chữ trùng ("Không cần tạo tài khoản…" ở cả giỏ và đầu trang thanh toán).
  - Nút đặt hàng bị khoá không hiện, chỉ hiện câu lỗi.
- **Thanh toán:**
  - Gửi `expectedTotalVnd`. Gặp `PRICE_CHANGED` thì tải lại giá, báo một câu, không mất dữ liệu form.
  - Lựa chọn thanh toán nói rõ lý do cọc và hạn chuyển khoản.
  - Một dòng chính sách huỷ, link sang `/chinh-sach#huy-don`.
  - Bỏ mô tả đầu trang.
- **Trang đơn `/don-hang/[mã]`:**
  - Thanh tiến trình (Đặt hàng → Xác nhận → Đang giao → Đã giao) và trạng thái hiện tại theo lời khách.
  - Khối chuyển khoản có hạn thanh toán.
  - Mã vận đơn khi đang giao.
  - Nút "Huỷ đơn" khi còn được huỷ: modal hỏi số điện thoại và lý do (chọn nhanh).
  - Câu chính sách đúng với trạng thái hiện tại.
- **Tra cứu đơn, tài khoản:** cùng khối trạng thái và nút huỷ. Đã xác minh số điện thoại nên không hỏi lại.
- **`/chinh-sach`:** thêm mục "Huỷ đơn và đặt cọc", lấy số từ cài đặt cửa hàng (phần trăm cọc, hạn thanh toán, điều kiện).

## 6. CMS

- **Danh sách đơn:**
  - Tab nhanh: Cần xử lý, Chờ thanh toán, Đặt chờ, Đang giao, Cần hoàn tiền, Tất cả. Tab "Cần xử lý" gồm đơn chờ xác nhận, đơn sắp hết hạn thanh toán, đơn khách vừa huỷ còn tiền phải hoàn.
  - Cột trạng thái có tag phụ: "Quá hạn xác nhận" khi chờ quá 24 giờ, "Hết hạn sau 2 giờ", "Giao quá 7 ngày".
- **Chi tiết đơn:**
  - Bỏ ô chọn trạng thái tự do. Thay bằng nút hành động theo trạng thái: Xác nhận đơn, Giao cho vận chuyển (nhập đơn vị và mã vận đơn), Đã giao, Hoàn hàng, Huỷ đơn, Mở lại.
  - Mỗi lúc chỉ một nút chính.
  - Khối thanh toán: phải thu, đã nhận, còn lại, cọc, hạn; nút "Ghi nhận tiền" và "Đã hoàn tiền".
  - Huỷ đơn mở modal: chọn lý do, số tiền hoàn gợi ý theo chính sách (sửa được).
  - Lịch sử đơn dạng dòng thời gian.
  - Thẻ khách hàng: số đơn đã giao, số đơn đã hoàn hoặc huỷ. Khách từng không nhận hàng thì cảnh báo.
- **Cài đặt cửa hàng:** mục Đặt cọc thành các ô bật tắt theo điều kiện, ngưỡng giá trị đơn, hạn thanh toán (giờ).
- **Sản phẩm:** công tắc "Cần đặt cọc".
- **Tổng quan:** khối "Việc cần làm" lấy số từ các tab trên.
- **Đơn mới:** toast và số trên menu "Đơn hàng" khi có đơn mới hoặc khách huỷ, qua SSE.

## 7. Thứ tự làm và cách kiểm

1. API: migration, `order-flow.ts`, endpoint, việc nền, giới hạn. Kiểm bằng script gọi API: đặt, đổi giá, spam, quá hạn, huỷ từng trạng thái, hoàn hàng, kho trả đúng, lịch sử đủ.
2. CMS: danh sách, chi tiết, cài đặt, sản phẩm, tổng quan, thông báo.
3. Web: thanh toán, trang đơn, tra cứu, tài khoản, chính sách.
4. Chạy trọn trên trình duyệt (Playwright) ở máy tính và điện thoại: đặt COD; đặt chuyển khoản; đặt vòng có cọc; khách tự huỷ; shop huỷ sau xác nhận (giữ cọc); quá hạn tự huỷ; hoàn hàng.
5. `typecheck`, `build`, kiểm màu viết cứng, cập nhật `docs/README.md`, `ui.md`, skill `anchi-growth`.

## 8. Ngoài phạm vi lần này

Cổng thanh toán online, đối soát chuyển khoản tự động, gửi SMS, Zalo hoặc email cho khách, nối API hãng vận chuyển. Chừa chỗ trong `OrderEvent` để nối sau.
