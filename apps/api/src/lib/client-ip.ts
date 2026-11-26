import type { Request } from "express";

const LOOPBACK = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);

// IP thật của khách để giới hạn số lần thử. Request đi qua nginx hoặc route handler của web đều tới từ máy chủ
// (127.0.0.1), nên chỉ tin X-Real-IP khi kết nối đến từ chính máy chủ; gọi thẳng từ ngoài thì header bị bỏ qua
export function clientIp(req: Request) {
  const remote = req.socket.remoteAddress ?? "";
  const forwarded = req.get("x-real-ip")?.trim();
  return LOOPBACK.has(remote) && forwarded ? forwarded : remote || "unknown";
}
