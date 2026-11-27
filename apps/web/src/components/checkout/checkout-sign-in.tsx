"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CHECKOUT_PARAM } from "@/lib/cart-drawer";
import { GoogleSection } from "../account/google-section";
import { LoginForm } from "../account/login-form";
import { RegisterForm } from "../account/register-form";

// Bước đặt hàng khi khách chưa đăng nhập: phải có tài khoản mới đặt được (yêu cầu chủ shop 11/2026).
// Đăng nhập, tạo tài khoản ngay trong bảng giỏ; xong thì useSignedIn đổi và bảng hiện form giao hàng.
// Google phải rời trang sang Google, quay về đúng trang này với ?dat-hang=1 để mở lại bảng ở bước đặt hàng
export function CheckoutSignIn({ googleClientId }: { googleClientId: string | null }) {
  const pathname = usePathname();
  const [mode, setMode] = useState<"login" | "register">("login");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const next = `${pathname}?${CHECKOUT_PARAM}=1`;
  const firstMode = useRef(mode);

  // Đổi giữa đăng nhập và tạo tài khoản thì đưa focus về tiêu đề để trình đọc màn hình biết form đã đổi
  useEffect(() => {
    if (mode === firstMode.current) return;
    firstMode.current = mode;
    headingRef.current?.focus();
  }, [mode]);

  return (
    <div className="min-h-0 flex-1 overscroll-contain overflow-y-auto px-5 py-5">
      <h3 ref={headingRef} tabIndex={-1} className="font-serif text-xl leading-tight focus:outline-none">
        {mode === "login" ? "Đăng nhập để đặt hàng" : "Tạo tài khoản để đặt hàng"}
      </h3>
      <p className="mt-2 mb-6 text-sm text-ink-2">
        {mode === "login"
          ? "Shop cần tài khoản để bạn xem lại đơn và nhận gọi xác nhận. Giỏ hàng vẫn được giữ nguyên."
          : "Chỉ cần họ tên, số điện thoại và mật khẩu. Giỏ hàng vẫn được giữ nguyên."}
      </p>
      {mode === "login" ? (
        <LoginForm next={next} onDone={() => {}} onRegister={() => setMode("register")} />
      ) : (
        <RegisterForm next={next} onDone={() => {}} onLogin={() => setMode("login")} />
      )}
      <GoogleSection clientId={googleClientId} next={next} />
    </div>
  );
}
