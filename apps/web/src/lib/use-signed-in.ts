"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export const SESSION_EVENT = "anchi-session";

// Đọc cookie cờ sau khi hydrate để trang vẫn tĩnh; đăng nhập, đăng xuất phát sự kiện để header đổi ngay
export function useSignedIn() {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    const read = () => setSignedIn(document.cookie.split("; ").some((part) => part === "anchi-signed-in=1"));
    read();
    window.addEventListener(SESSION_EVENT, read);
    return () => window.removeEventListener(SESSION_EVENT, read);
  }, [pathname]);
  return signedIn;
}
