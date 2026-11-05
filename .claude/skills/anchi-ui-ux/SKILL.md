---
name: anchi-ui-ux
description: Quy tắc giao diện An Chi gồm bảng màu gỗ sáng tối, token, Tailwind, chữ, lưới trang, breakpoint, dark mode, trạng thái, loading, animation, tiếp cận và quy cách component như Button, Select, DatePicker, Modal. Dùng khi tạo hoặc sửa trang, component, form, modal, dropdown, CSS, responsive ở web hoặc CMS, kể cả khi người dùng chỉ nói "làm trang này", "sửa giao diện", "đổi màu", "thêm nút" mà không nhắc tới design system.
---

# An Chi UI/UX

Đọc thêm đúng phần đang cần:

| Việc | File |
|---|---|
| Chọn màu, sáng/tối, màu primary | [references/colors.md](references/colors.md) |
| Cỡ chữ, khoảng cách, bo góc, bóng, lớp, breakpoint, icon | [references/foundations.md](references/foundations.md) |
| Lưới và bố cục theo từng màn hình | [references/layout.md](references/layout.md) |
| Ô nhập, checkbox, khoảng cách và hàng nút trong form | [references/form.md](references/form.md) |
| Spinner, skeleton, khoá form khi submit | [references/loading.md](references/loading.md) |
| Slide, fade, thời gian và đường cong animation | [references/motion.md](references/motion.md) |
| Dùng hoặc làm nút, ô nhập, Select, DatePicker, Modal... | [references/components.md](references/components.md) |
| Token gốc | [design/tokens.css](../../../design/tokens.css), [design/tailwind-theme.css](../../../design/tailwind-theme.css) |
| Sinh lại bảng màu sau khi đổi token | `node .claude/skills/anchi-ui-ux/scripts/build-palette.mjs` |
| Tìm màu viết cứng | `node .claude/skills/anchi-ui-ux/scripts/find-hardcoded-colors.mjs` |

## 0. Phong cách

Ấm, mềm, nhiều khoảng thở, theo mẫu trang chủ đã duyệt (11/2026): nền kem, nội dung trên tấm `surface` bo 24px không viền, nút viên thuốc màu gỗ caramel, mũi tên tròn, ảnh lớn bo góc, thẻ kính nổi trên ảnh, một khối tối than gỗ mỗi trang. Chữ giữ Cormorant SC và Be Vietnam Pro. Chi tiết ở `foundations.md` (bo góc, tấm, bóng), `colors.md` (khối tối), `components.md` (nút, thẻ, slider), `layout.md` (trang chủ). Web và CMS dùng chung màu và chữ. CMS dày đặc hơn (11/2026): `apps/cms/src/index.css` thu thang khoảng cách còn 0.2rem, bo góc 4–10px, chữ nhỏ một bậc; component CMS vẫn viết class như bảng trong `foundations.md`, không tự thu nhỏ thêm. CMS chỉ dùng Be Vietnam Pro (`font-serif` trong CMS trỏ về chữ không chân), riêng logo dùng `font-logo`. Nút, nút icon, Select, mục menu trong CMS bo `rounded-sm` (vuông nhỏ), không dùng viên thuốc như web; tag, công tắc, spinner vẫn tròn. Đổi sáng tối là một nút icon. Icon CMS nét 1.5 đầu tròn, góc bo mềm, lấy từ `components/icons.tsx`.

## 1. Token

- Component chỉ dùng token vai trò qua class Tailwind như `bg-paper`, `text-ink`, `bg-wood`, `border-line`. Đổi màu toàn sản phẩm chỉ sửa một file, nên hex rải rác sẽ làm sót chỗ và vỡ theme tối.
- Không dùng class màu mặc định của Tailwind như `bg-gray-100`, `text-white`, và không dùng `dark:`. Token đã tự đổi theo theme.
- Thang `--wood-50…950` chỉ để định nghĩa token và minh hoạ, component không gọi trực tiếp.
- Khoảng cách, bo góc dùng thang của Tailwind theo bảng trong `foundations.md`. Không dùng giá trị tuỳ ý như `p-[13px]`, trừ số đã ghi trong rule.
- Lớp dùng token `--z-*`. Không viết số z-index mới.
- Thiếu token thì thêm vào `design/tokens.css`, đủ sáng và tối, rồi nối vào `tailwind-theme.css`.
- Ngoại lệ: canvas và data-URI SVG không đọc được biến CSS, ghi `allow-color` cùng dòng.

## 2. Bố cục

Một khung cho mọi trang: rộng tối đa 1180px, lề 16px (24px từ 960px), lưới 12 cột. Trang không tự đặt `max-width` hay padding ngang, để mép nội dung luôn thẳng logo.

| Mẫu | Dùng cho | Cấu trúc |
|---|---|---|
| Shop | Sản phẩm | Ảnh và khối mua → thông số, mô tả → liên quan |
| List | Danh mục, tìm kiếm | Lọc → lưới sản phẩm → phân trang |
| Read | Bài viết, chính sách | Cột chính 8, phụ 4 |
| App | Giỏ hàng, đặt hàng, toàn bộ CMS | Điều hướng phụ, không cần SEO |

Mọi khối trong trang chung mép trái với tiêu đề trang. Không căn giữa một khối hẹp bằng `mx-auto`. Ngoại lệ phải ghi tên trong [docs/web/design/ui.md](../../../docs/web/design/ui.md).

## 3. Thành phần

- Nút, ô nhập, select, modal, skeleton, ngày tháng lấy từ `components/ui/*` của từng app. Thiếu thì thêm vào đó khi có từ hai nơi dùng trở lên.
- Ô nhập luôn có padding ngang 12px. Khối bọc có padding thì bo góc trong và ngoài phải đồng bộ theo `foundations.md`.
- Mỗi màn hình một nút primary. Lời mời phụ dùng nút viền hoặc link chữ.
- Có `href` thì là link, không có thì là `<button type="button">`.
- Dropdown không dùng `<select>` native. Ngày giờ không dùng `<input type="date">`, `datetime-local`, `time`.
- Modal và panel nổi render qua portal vào `document.body`: `transform`, `filter`, `backdrop-filter` ở cha sẽ làm `position: fixed` bám sai chỗ.
- Thành phần chỉ hiện sau tương tác thì chỉ render khi mở, để HTML server ổn định.

## 4. Trạng thái

| Trạng thái | Cách làm |
|---|---|
| Chờ dữ liệu | `Skeleton` đúng dáng nội dung, không chữ "Đang tải…" |
| Đang submit | `<Button loading>`, khoá mọi hành động và ô nhập của form, chặn gửi hai lần. Chỉ có một kiểu spinner vòng tròn |
| Rỗng | `EmptyState` có câu mời và nút hành động |
| Lỗi tải | `ErrorState` có nút thử lại |
| Kết quả hành động | `showToast`, không `alert()` |
| Xoá | `await confirmDialog({ danger: true })`, không `confirm()` |
| Lỗi nhập | Nói rõ sai gì và sửa thế nào, `aria-invalid`, `role="alert"`, focus ô sai đầu tiên |

Modal chờ API mở ở kích thước ổn định. Nội dung không được giật khi dữ liệu về.

## 5. Luồng

- Trạng thái nên chia sẻ hoặc quay lại được (bộ lọc, trang, bước đặt hàng) phải nằm trên URL.
- Đa số khách đến từ điện thoại: thiết kế luồng mua cho mobile trước.
- Đặt hàng được khi chưa đăng ký tài khoản. Ít ô bắt buộc, có câu trấn an về giao hàng và đổi trả. Tài khoản khách là tuỳ chọn, chỉ để xem lại đơn và điền sẵn thông tin.
- Trạng thái đăng nhập đọc ở client từ cookie cờ, không đọc cookie ở layout, để trang công khai vẫn tĩnh.
- Thanh dính và nút nổi không che nút hành động chính.
- Người vận hành CMS cần tốc độ: giữ dữ liệu form, Enter để gửi, thao tác lặp không bắt mở nhiều lớp, không giả lập thời gian chờ.

## 6. Tiếp cận

Khách mua trầm có nhiều người lớn tuổi, nên đây là yêu cầu bắt buộc.

- WCAG AA: chữ thường ≥ 4.5:1, chữ lớn và icon ≥ 3:1, cả hai theme.
- Không truyền nghĩa chỉ bằng màu.
- Đi hết được bằng bàn phím. `:focus-visible` viền 2px màu `--wood`, cách 2px, không tắt.
- Nút chỉ có icon phải có nhãn. Icon trang trí đặt `aria-hidden`.
- `<button>` hoặc `<a>` thay `div onClick`. Heading không nhảy cấp. Mục đang xem có `aria-current="page"`.
- Ô nhập có `<label>` thật, không dùng placeholder thay nhãn. Nhóm ô cùng tiêu đề bọc `role="group"` và `aria-labelledby`.
- Bảng thả xuống: nút có `aria-expanded`, Esc đóng và trả focus về nút, bấm ra ngoài thì đóng.
- Drawer đang đóng có `inert`. Khi mở, focus vào nút đóng.
- Nội dung đổi theo lựa chọn của người dùng, như tổng tiền giỏ hàng, đặt trong `aria-live="polite"`.
- Có link "Bỏ qua menu". Phóng to 200% không vỡ bố cục.
- Tôn trọng `prefers-reduced-motion`.

## 7. Responsive

- Mobile-first, bốn mốc `sm` 480, `md` 720, `lg` 960, `xl` 1180. Dự án đã thay mốc mặc định của Tailwind nên không dùng `2xl`. `max-*` chỉ khi có lý do ghi kèm.
- Không cuộn ngang từ 320 đến 2560px. Bảng rộng cuộn trong khung riêng.
- Vùng chạm tối thiểu 44×44px. Ô nhập chữ 16px để iOS không tự phóng to.
- Dùng `100dvh`. Tính `env(safe-area-inset-*)` cho header, drawer, thanh dính.
- Trên mobile: form một cột, modal dạng sheet hoặc toàn màn hình, nút đóng trong tầm ngón cái.

## 8. Code giao diện

**Web (Next.js)**

- Mặc định Server Component. Chỉ thêm `'use client'` khi cần state, effect, sự kiện.
- Không đọc `window`, `localStorage` khi render.
- Theme đặt trên `<html data-theme>` bằng script trong `<head>` để không nháy màu.

**Chung**

- File component ≤ khoảng 250 dòng. Gọi API và biến đổi dữ liệu ở `lib/`.
- Style viết bằng class Tailwind. CSS riêng chỉ khi Tailwind không làm được, `!important` phải có comment lý do.
- Dữ liệu cố định như menu, danh sách lựa chọn đặt trong `lib/`, không viết cứng trong JSX. Menu web chỉ có một nguồn `lib/nav.ts`.
- Đổi giao diện thì xem ở sáng và tối, rộng 375 và 1366px.
