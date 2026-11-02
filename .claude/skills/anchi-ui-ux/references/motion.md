# Animation

Nhanh, mượt, phần tử đi đúng hướng và dừng lại êm. Dùng chủ yếu slide, fade in, fade out. Chuyển động chỉ để trả lời hành động của người dùng.

## Đặc điểm cần giữ

- **Vào nhanh rồi chậm dần.** Phần tử phản hồi ngay ở đầu và đi chậm khi gần tới đích.
- **Ra nhanh hơn vào.** Thời gian ra bằng khoảng 70% thời gian vào.
- **Có quan hệ không gian.** Đi ra theo đúng đường đi vào. Sheet lên từ đáy thì xuống về đáy.
- **Vật lớn đi lâu hơn vật nhỏ.** Nút dưới 120ms, sheet tới 400ms.
- **Ngắt được.** Đang mở mà bấm đóng thì quay lại ngay từ vị trí hiện tại. Dùng `transition` cho phần tử mở đóng, vì `@keyframes` không ngắt êm được.

Không dùng hiệu ứng nảy vượt đích, vì trái với nguyên tắc trang nhã.

## Token

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--d-fast` | 120ms | Hover, nhấn, focus, thoát của menu nhỏ |
| `--d-base` | 180ms | Menu, tooltip, tab, thoát của modal |
| `--d-modal` | 250ms | Modal, toast, accordion |
| `--d-slow` | 280ms | Thoát của sheet và drawer |
| `--d-page` | 350ms | Chuyển bước đặt hàng, drawer |
| `--d-sheet` | 400ms | Bottom sheet |

| Token | Đường cong | Dùng cho |
|---|---|---|
| `--ease-ios` | `cubic-bezier(.32, .72, 0, 1)` | Phần tử đi vào, slide |
| `--ease-exit` | `cubic-bezier(.4, 0, 1, 1)` | Phần tử đi ra |
| `--ease-out` | `cubic-bezier(.2, .7, .2, 1)` | Fade, hover, đổi màu |
| `linear` | | Chỉ cho spinner và skeleton |

## Bảng chuyển động

| Thành phần | Vào | Thời gian vào | Ra | Thời gian ra |
|---|---|---|---|---|
| Nút khi nhấn | `scale(.98)` hoặc đổi nền | `--d-fast` | Về như cũ | `--d-fast` |
| Thẻ sản phẩm khi hover | Đổi viền, ảnh `scale(1.02)` | `--d-base` | Về như cũ | `--d-fast` |
| Tooltip | Fade | `--d-base` | Fade | `--d-fast` |
| Dropdown, Select, DatePicker | Fade, `translateY(-4px)→0` | `--d-base` | Fade | `--d-fast` |
| Link menu chính khi hover | Gạch chân 1px `scale-x` từ trái | `--d-base` | Thu về | `--d-base` |
| Menu sổ xuống "Sản phẩm" | Hover hoặc focus bên trong, fade và `translateY(-4px)→0` | `--d-base` | Fade | `--d-fast` |
| Modal giữa màn hình | Fade, `scale(.96)→1` | `--d-modal` | Fade | `--d-base` |
| Lớp phủ sau modal | Fade | Theo modal | Fade | Theo modal |
| Bottom sheet | Slide từ đáy | `--d-sheet` | Slide về đáy | `--d-slow` |
| Drawer menu, giỏ trượt | Slide từ cạnh | `--d-page` | Slide về cạnh | `--d-slow` |
| Toast | Slide 16px và fade | `--d-modal` | Fade | `--d-base` |
| Chuyển bước đặt hàng | Slide ngang 24px và fade | `--d-page` | Fade | `--d-base` |
| Đổi tab, đổi ảnh sản phẩm | Fade | `--d-base` | Không có | |
| Accordion | Mũi tên xoay, nội dung fade | `--d-modal` | Như vào | `--d-base` |
| Dữ liệu về thay skeleton | Fade | `--d-base` | Không có | |

Thời gian dài nhất là 500ms. Vượt mức này phải ghi lý do trong docs `design/ui.md` của app.

## Cách viết

```css
.ui-sheet {
  transform: translateY(100%);
  visibility: hidden;
  transition:
    transform var(--d-slow) var(--ease-exit),
    visibility 0s linear var(--d-slow);
}
.ui-sheet.is-open {
  transform: none;
  visibility: visible;
  transition: transform var(--d-sheet) var(--ease-ios);
}
```

- Chỉ animate `transform` và `opacity`. Không animate `width`, `height`, `top`, `left`, vì gây giật trên điện thoại yếu.
- Thời gian vào và ra đặt khác nhau: `transition` ở trạng thái mở là của lúc vào, ở trạng thái đóng là của lúc ra.
- Muốn có animation ra thì phần tử phải còn trong DOM cho tới khi hết hiệu ứng.
- Không dùng `will-change` thường trực.
- Ảnh chính, giá và nút mua không có animation khi tải, để không giật và không làm chậm LCP.

## Giảm chuyển động

Khi `prefers-reduced-motion: reduce`:

- Bỏ slide, scale, xoay. Phần tử chỉ fade trong `--d-fast`.
- Spinner vẫn quay, chậm lại theo [loading.md](loading.md).
