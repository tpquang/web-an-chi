import { useRef, useState, type FormEvent } from "react";
import { BrandMark } from "../components/BrandMark";
import { ThemeToggle } from "../components/ThemeToggle";
import { Button } from "../components/ui/Button";
import { Field, Input } from "../components/ui/Field";
import { ApiError, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";

// Ngoại lệ về khung đã ghi trong docs/cms/design/ui.md: thẻ đăng nhập căn giữa
export function LoginPage() {
  const { login, devLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    if (!email.trim() || !password) {
      setError("Bạn nhập đủ email và mật khẩu.");
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  async function handleDevLogin() {
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setError(null);
    try {
      await devLogin();
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 404
          ? "API chưa bật đăng nhập nhanh. Thêm DEV_LOGIN=on vào apps/api/.env rồi chạy lại API."
          : errorMessage(err),
      );
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-paper p-4">
      <div className="fixed top-3 right-3">
        <ThemeToggle />
      </div>
      <form onSubmit={handleSubmit} noValidate className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-line bg-surface p-6">
        <div>
          <BrandMark className="mb-3 size-14 text-wood" />
          <p className="font-serif text-3xl font-semibold text-wood">An Chi CMS</p>
          <h1 className="mt-1 text-ink-2">Đăng nhập để quản lý cửa hàng</h1>
        </div>
        <Field label="Email">
          <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} disabled={submitting} />
        </Field>
        <Field label="Mật khẩu" error={error}>
          <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={submitting} />
        </Field>
        <Button type="submit" loading={submitting} block className="mt-2">
          Đăng nhập
        </Button>
        {import.meta.env.DEV && (
          <div className="flex flex-col gap-2 border-t border-dashed border-line pt-4">
            <Button variant="outline" block onClick={handleDevLogin} disabled={submitting}>
              Đăng nhập nhanh
            </Button>
            <p className="text-sm text-ink-3">Chỉ có khi chạy dev, để test giao diện. Không cần email, mật khẩu.</p>
          </div>
        )}
      </form>
    </div>
  );
}
