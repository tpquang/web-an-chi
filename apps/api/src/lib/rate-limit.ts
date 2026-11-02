import { HttpError } from "../middleware/errors.js";

// Đếm lần thất bại theo khoá (thường là IP) trong bộ nhớ. Đủ cho một tiến trình API
export function failureLimiter({ max, windowMs, message }: { max: number; windowMs: number; message: string }) {
  const fails = new Map<string, { count: number; resetAt: number }>();
  return {
    check(key: string) {
      const entry = fails.get(key);
      if (entry && entry.resetAt > Date.now() && entry.count >= max) throw new HttpError(429, message, "TOO_MANY_ATTEMPTS");
    },
    fail(key: string) {
      const now = Date.now();
      const entry = fails.get(key);
      const fresh = !entry || entry.resetAt <= now;
      fails.set(key, { count: fresh ? 1 : entry.count + 1, resetAt: fresh ? now + windowMs : entry.resetAt });
    },
    reset(key: string) {
      fails.delete(key);
    },
  };
}
