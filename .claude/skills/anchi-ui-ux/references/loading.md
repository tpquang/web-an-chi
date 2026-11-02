# Loading

## Chọn hình thức

Toàn bộ sản phẩm chỉ có hai hình thức.

| Tình huống | Hình thức |
|---|---|
| Người dùng vừa bấm hành động: thêm giỏ, đặt hàng, lưu, xoá | Spinner vòng tròn |
| Chờ dữ liệu để hiển thị, biết trước hình dáng | `Skeleton` đúng dáng nội dung |
| Chờ một vùng nhỏ, không biết trước hình dáng | Spinner vòng tròn giữa vùng |

Không dùng thêm kiểu khác như ba chấm, thanh chạy, logo xoay, hay chữ "Đang tải…" đứng một mình.

Trên web, trang công khai render ở server nên không dùng skeleton cho nội dung chính, và route động không có `loading.tsx` theo [anchi-seo](../../anchi-seo/SKILL.md).

## Spinner

Một vòng tròn hở một phần tư, quay đều: `animate-spin rounded-full border-2 border-current border-r-transparent` với thời lượng 700ms.

| Vị trí | Cỡ | Nét |
|---|---|---|
| Trong nút | 16px | 2px |
| Trong dòng, ô nhập | 20px | 2px |
| Giữa vùng, modal | 32px | 3px |

- Màu luôn là `currentColor`, nên tự đúng trên nút gỗ và ở cả hai theme.
- Khi giảm chuyển động vẫn quay chậm 2s, không tắt hẳn, vì đây là thông tin "đang chạy".
- Đặt `aria-hidden` trên vòng tròn. Thông tin chờ nằm ở `aria-busy` của nút hoặc vùng.

## Khi submit: bắt buộc

Từ lúc bấm đến lúc có kết quả:

1. **Nút gửi** dùng `<Button loading>`: hiện spinner, tự `disabled`, `aria-busy`. Nhãn giữ nguyên, không đổi thành "Đang gửi…".
2. **Mọi hành động khác của form** cũng `disabled`, gồm nút phụ, nút xoá, nút huỷ nếu không huỷ được thật.
3. **Ô nhập** khoá bằng `disabled` hoặc `readOnly`, để dữ liệu gửi đi và dữ liệu đang thấy luôn khớp.
4. **Chặn gửi lần hai trong code**, không chỉ dựa vào nút. Enter trong ô nhập cũng gửi được form. Với đặt hàng, API còn phải chống tạo đơn trùng bằng khoá idempotency.
5. **Modal chứa form** không đóng được bằng Esc hay bấm nền trong lúc gửi.
6. **Xong thì mở khoá trong `finally`**, để lỗi mạng không làm form kẹt mãi.

```tsx
const inFlight = useRef(false);

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (inFlight.current) return;
  inFlight.current = true;
  setIsSubmitting(true);
  try {
    await save(values);
    showToast("Đã lưu sản phẩm.", { type: "success" });
  } catch (err) {
    showToast(errorMessage(err), { type: "error" });
  } finally {
    inFlight.current = false;
    setIsSubmitting(false);
  }
};
```

Dùng `ref` vì state chỉ có giá trị mới sau lần render kế tiếp.

**Khi lỗi:** giữ nguyên dữ liệu đã nhập, mở khoá form, nói sai gì và sửa thế nào.

**Link không có loading:** `Button` có `href` là link, `loading` không chặn được việc bấm. Hành động cần chờ thì dùng nút.

## Thời gian

| Mốc | Quy tắc |
|---|---|
| Nút vừa bấm | Hiện spinner ngay, không trễ |
| Chờ dữ liệu dưới 300ms | Không hiện gì, tránh nháy |
| Đã hiện skeleton hoặc spinner vùng | Giữ tối thiểu 300ms rồi mới thay nội dung |
| Chờ trên 10 giây | Thêm một câu nói rõ vẫn đang xử lý, nếu huỷ được thì có nút huỷ |

Không giả lập thời gian chờ khi kết quả đã có.

## Không giật

- Nút giữ nguyên kích thước khi loading. Nút có icon thì spinner thay vào chỗ icon.
- Skeleton có cùng kích thước với nội dung thật.
- Modal chờ API mở ở kích thước ổn định.
- Nội dung xuất hiện bằng fade `--d-base`, xem [motion.md](motion.md).
