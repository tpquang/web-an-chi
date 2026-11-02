import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client.js";

// Lỗi có chủ đích: message là câu tiếng Việt hiển thị thẳng cho người dùng
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Không tìm thấy" });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, code: err.code, details: err.details });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Dữ liệu gửi lên chưa đúng", code: "INVALID", issues: err.issues });
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ error: "Giá trị này đã được dùng, ví dụ slug trùng", code: "DUPLICATE" });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ error: "Không tìm thấy", code: "NOT_FOUND" });
      return;
    }
    if (err.code === "P2003") {
      res.status(409).json({ error: "Còn dữ liệu khác đang dùng mục này", code: "IN_USE" });
      return;
    }
  }
  console.error(err);
  res.status(500).json({ error: "Lỗi máy chủ" });
};
