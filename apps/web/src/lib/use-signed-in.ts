"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const SESSION_EVENT = "anchi-session";

const readFlag = () => document.cookie.split("; ").some((part) => part === "anchi-signed-in=1");

// Đọc cookie cờ sau khi hydrate để trang vẫn tĩnh; đăng nhập, đăng xuất phát sự kiện để header đổi ngay
export function useSignedIn() {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    const read = () => setSignedIn(readFlag());
    read();
    window.addEventListener(SESSION_EVENT, read);
    return () => window.removeEventListener(SESSION_EVENT, read);
  }, [pathname]);
  return signedIn;
}

// Cho thành phần chỉ render ở client (bảng giỏ mở qua portal): đọc cờ ngay lần render đầu, không nháy form đăng nhập
// rồi mới đổi. Thành phần render ở server dùng useSignedIn để HTML khớp khi hydrate
export function useSignedInClient() {
  const signedIn = useSignedIn();
  const [first] = useState(readFlag);
  const [settled, setSettled] = useState(false);
  useEffect(() => setSettled(true), []);
  return settled ? signedIn : first;
}
