import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getToken, setToken } from "./api";

type Auth = {
  signedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  devLogin: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(() => Boolean(getToken()));

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
