---
name: anchi-auth
description: Quy tắc tài khoản và đăng nhập An Chi gồm tài khoản khách theo số điện thoại, mật khẩu, đổi và quên mật khẩu, đăng nhập Google, gộp tài khoản, phiên đăng nhập và thu hồi token, cookie, tài khoản nhân viên CMS. Dùng khi sửa đăng ký, đăng nhập, đăng xuất, trang tài khoản, đổi mật khẩu, thêm đăng nhập mạng xã hội, sửa phân quyền nhân viên, kể cả khi người dùng chỉ nói "thêm login Google", "quên mật khẩu".
---

# An Chi Auth

## 1. Nguyên tắc

- **Tài khoản khách là tuỳ chọn.** Đặt hàng, tra cứu đơn không cần đăng nhập. Tài khoản chỉ để xem lại đơn, điền sẵn thông tin.
- **Số điện thoại là định danh chính** của khách (đơn hàng, giao hàng, gộp hội thoại). Không bắt khách dùng email. Đăng nhập Google là cách đăng nhập thêm, không thay số điện thoại.
- Không lộ một số điện thoại hay email đã có tài khoản hay chưa ở form đăng nhập: báo chung "chưa đúng". Riêng form đăng ký được báo trùng vì khách cần biết để chuyển sang đăng nhập.

## 2. Mật khẩu

- Băm bằng scrypt qua `hashPassword` / `verifyPassword` (`apps/api/src/lib/password.ts`). Không tự viết hàm băm khác.
- Tối thiểu 8 ký tự, tối đa 100. Không bắt ký tự đặc biệt.
- Đổi mật khẩu phải nhập mật khẩu hiện tại (trừ tài khoản chưa có mật khẩu, như tài khoản chỉ đăng nhập Google: lúc đó là **đặt** mật khẩu).
- Đổi hoặc đặt lại mật khẩu thì tăng `Customer.sessionVersion`: mọi phiên cũ hết hiệu lực, phiên hiện tại được cấp token mới.
- Endpoint kiểm mật khẩu dùng `failureLimiter`, đếm theo số điện thoại hoặc id khách.
- Quên mật khẩu cần kênh xác minh chủ số (OTP SMS hoặc Zalo ZNS). Chưa có kênh thì hướng khách nhắn shop, nhân viên đặt lại trong CMS; không gửi mật khẩu qua chat.

## 3. Phiên đăng nhập

- Token ký HMAC (`apps/api/src/lib/auth.ts`), có `kind` tách khách và nhân viên. Token khách 30 ngày, mang `sessionVersion`; API so với database mỗi request cần đăng nhập.
- Web giữ token trong cookie httpOnly `anchi-session`, cookie cờ `anchi-signed-in` cho giao diện biết đã đăng nhập (`apps/web/src/lib/session.ts`). JS của trang không bao giờ thấy token.
- Mọi thao tác tài khoản từ trình duyệt đi qua route handler `apps/web/src/app/api/account/*` bằng `routeProxy`. API trả token mới thì dùng `session: "start"` để cất cookie.
- Đăng xuất xoá cả hai cookie.

## 4. Đăng nhập Google

- Luồng OAuth 2.0 authorization code + PKCE, do **web** điều hướng, **API** đổi code và xác minh:
  1. `GET /api/account/google` (web): tạo `state`, `code_verifier`, cất trong cookie httpOnly ngắn hạn (10 phút), chuyển sang Google với `scope=openid email profile`.
  2. `GET /api/account/google/callback` (web): so `state`, gửi `code` + `code_verifier` + `redirect_uri` tới API `POST /account/google`.
  3. API gọi token endpoint của Google, đọc `id_token`, kiểm `iss`, `aud` = client id, `exp`, `email_verified`.
- Khoá liên kết là `sub` của Google (`Customer.googleSub`, unique), không phải email.
- Gộp tài khoản: đã có khách gắn `sub` thì đăng nhập vào khách đó. Chưa có thì tạo khách mới chưa có số điện thoại; số điện thoại bổ sung ở trang tài khoản hoặc lúc đặt hàng. Không tự gộp với khách khác chỉ vì trùng email.
- Đang đăng nhập bằng số điện thoại mà bấm Google thì gắn `sub` vào chính tài khoản đó (nếu `sub` chưa thuộc ai).
- Thiếu `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` thì web ẩn nút Google, API trả 404 cho endpoint Google. Không làm hỏng đăng nhập bằng số điện thoại.
- `redirect_uri` là `NEXT_PUBLIC_SITE_URL` + `/api/account/google/callback` (`apps/web/src/lib/google-auth.ts`), khai đúng trong Google Cloud Console cho từng môi trường.
- Khoá chỉ đặt ở `apps/api/.env`. Web hỏi client id qua `GET /account/google` (cache 60 giây), không có biến Google riêng.
- Chuyển hướng trong route handler dựng từ `site.url` và `new Response(null, { status: 303, headers: { location } })`, không dùng `Response.redirect` (header bất biến, Next không gắn được cookie phiên) và không dùng `request.url` (sau nginx là địa chỉ nội bộ).
- Tài khoản tạo qua Google có `phone = null`. Code đọc `Customer.phone` phải xử lý trường hợp này.

## 5. Nhân viên CMS

- Mỗi nhân viên một tài khoản `StaffUser`, quyền theo ma trận (xem [anchi-backend](../anchi-backend/SKILL.md) mục 3). Tài khoản trong `.env` tự thành chủ shop ở lần đăng nhập đầu.
- Khoá nhân viên làm token cũ hết hiệu lực ngay (API đọc `active` mỗi request).
- `DEV_LOGIN=on` chỉ dùng khi dev; API bỏ qua khi `NODE_ENV=production`, route web trả 404 khi không phải `next dev`.
