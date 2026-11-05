import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getToken, setToken } from "./api";

// Cùng danh sách mục với apps/api/src/lib/permissions.ts
export type PermissionKey = "dashboard" | "orders" | "products" | "inventory" | "batches" | "finance" | "posts" | "home" | "inbox";
export type Level = "none" | "view" | "edit";
export type Permissions = Record<PermissionKey, Level>;
export type Staff = { id: string; email: string; name: string; role: "OWNER" | "SALES"; permissions: Permissions };

type Auth = {
  signedIn: boolean;
  staff: Staff | null;
  isOwner: boolean;
  // Xem được mục này không; edit thì có quyền sửa
  can: (key: PermissionKey, level?: Level) => boolean;
  login: (email: string, password: string) => Promise<void>;
  devLogin: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(() => Boolean(getToken()));
  const [staff, setStaff] = useState<Staff | null>(null);

  // Lấy tên và vai trò để hiện menu đúng quyền
  useEffect(() => {
    if (!signedIn) return setStaff(null);
    api.get<Staff>("/me").then(setStaff).catch(() => setStaff(null));
  }, [signedIn]);

  // API trả 401 thì api.ts xoá token và phát sự kiện này
  useEffect(() => {
    const sync = () => setSignedIn(Boolean(getToken()));
    window.addEventListener("anchi-auth", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("anchi-auth", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const value: Auth = {
    signedIn,
    staff,
    isOwner: staff?.role === "OWNER",
    can(key, level = "view") {
      if (!staff) return false;
      if (staff.role === "OWNER") return true;
      const have = staff.permissions?.[key] ?? "none";
      return level === "view" ? have !== "none" : have === "edit";
    },
    async login(email, password) {
      const { token } = await api.post<{ token: string }>("/login", { email, password });
      setToken(token);
    },
    // API chỉ mở endpoint này khi DEV_LOGIN=on, nên không có mật khẩu nào nằm trong CMS
    async devLogin() {
      const { token } = await api.post<{ token: string }>("/dev-login", {});
      setToken(token);
    },
    logout() {
      setToken(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth cần nằm trong AuthProvider");
  return auth;
}
