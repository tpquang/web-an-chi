# Kế hoạch hoàn thiện theo goal (11/2026)

Đối chiếu goal của chủ dự án với code ngày 27/11/2026. Việc làm theo thứ tự, mỗi mục xong thì đánh dấu và cập nhật docs liên quan.

## Đã có, không làm lại

SEO kỹ thuật, giỏ hàng, thanh toán COD và chuyển khoản, đặt cọc, đặt chờ, countdown mở bán, hết hàng, sáng tối, vòng tự thiết kế 3D, tin tức trên CMS, kho nguyên liệu, đợt nhập, công thức đóng gói, giá vốn, lợi nhuận theo đợt và tháng, nhà cung cấp, chat web với Hộp thư CMS, nén ảnh WebP tuỳ chọn, ảnh vân vật liệu hạt, `.glb` cho charm, đăng ký bằng số điện thoại, sửa hồ sơ.

## Việc làm

| # | Việc | Rule | Trạng thái |
|---|---|---|---|
| 1 | Antigravity nạp rule: `AGENTS.md`, `.agents/skills.json` | | Xong |
| 2 | Skill `anchi-backend`, `anchi-media`, `anchi-auth`; bảng độ rộng phải xem trong `layout.md`; khung trang tự soạn | | Xong |
| 3 | Dọn docs cũ (backlog, roadmap, `docs/README.md`, comment schema) | | Xong |
| 4 | Đổi mật khẩu tài khoản khách, thu hồi phiên cũ (`sessionVersion`) | `anchi-auth` | Xong |
| 5 | Trang nội dung tự soạn (`Page`): CMS soạn, web hiện ở `/<slug>`, sitemap, footer. Nội dung mẫu cho bảo hành, đại lý, cộng tác viên | `anchi-seo`, `anchi-brand` | Xong |
| 6 | Đăng nhập Google (OAuth code + PKCE), tự tắt khi thiếu khoá | `anchi-auth` | Xong, chờ khoá |
| 7 | Tải `.glb` cho sản phẩm từ CMS (`ProductModel`), trình xem GLB chung trên web | `anchi-media` | Xong |
| 8 | Điểm hoà vốn: theo đợt nhập (số thành phẩm cần bán) và theo tháng (doanh thu cần có để bù chi phí cố định) | `anchi-backend` | Xong |

## Cần chủ dự án quyết định hoặc cấp khoá

- **Google login:** tạo OAuth client trong Google Cloud Console, điền `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` vào `apps/api/.env`, khai redirect URI `<SITE_URL>/api/account/google/callback`.
- **"CMS đọc đơn, chat với web bên ngoài":** nối Facebook Page, Zalo OA vào Hộp thư, hay kéo đơn Shopee/TikTok về, hay nhúng khung chat lên website khác. Chưa làm tới khi rõ.
- **Cổng thanh toán online:** chọn VNPay, MoMo, PayOS hay VietQR tự đối soát (cần tài khoản doanh nghiệp).
- **Quên mật khẩu:** cần kênh OTP (SMS hoặc Zalo ZNS). Trước mắt nhân viên đặt lại mật khẩu cho khách.
- **Nơi lưu ảnh và 3D:** chuyển khỏi PostgreSQL trước khi tải nhiều dữ liệu thật.
- Nội dung thật của trang bảo hành, đại lý, cộng tác viên: bản mẫu chỉ là khung để sửa.

## Sau đó

Test tự động cho `inventory`, `pricing`, `order-flow`, cọc; CI chạy typecheck, build, test. Trang web hiển thị charm `.glb` trên vòng (CMS đã tải được nhưng web chưa dùng).
