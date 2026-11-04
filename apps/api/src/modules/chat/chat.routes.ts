import { createHash } from "node:crypto";
import { Router, type Request } from "express";
import { z } from "zod";
import { MessageSender } from "../../generated/prisma/client.js";
import { customerIdFrom } from "../../lib/auth.js";
import { conversationChannel, publish, streamEvents } from "../../lib/chat-bus.js";
import { prisma } from "../../lib/prisma.js";
import { failureLimiter } from "../../lib/rate-limit.js";
import { HttpError } from "../../middleware/errors.js";
import { phoneField } from "../orders/orders.service.js";

export const chatRouter = Router();

// Web tạo mã ngẫu nhiên cho mỗi trình duyệt, cất trong cookie httpOnly và gửi kèm header này. API chỉ lưu bản băm
function visitorHash(req: Request) {
  const key = req.get("x-visitor-key") ?? "";
  if (!/^[\w-]{32,128}$/.test(key)) throw new HttpError(400, "Phiên chat không hợp lệ. Bạn tải lại trang giúp shop.", "BAD_VISITOR");
  return createHash("sha256").update(key).digest("hex");
}

// Chống spam: tối đa 30 tin mỗi trình duyệt trong 5 phút
const spam = failureLimiter({ max: 30, windowMs: 5 * 60 * 1000, message: "Bạn gửi nhanh quá. Đợi một chút rồi gửi tiếp nhé." });

const publicConversation = { id: true, name: true, status: true, unreadForCustomer: true } as const;
const publicMessage = { id: true, sender: true, body: true, createdAt: true, staff: { select: { name: true } } } as const;
const body = z.string().trim().min(1, "Bạn nhập nội dung tin nhắn.").max(2000, "Tin nhắn dài quá, tối đa 2.000 ký tự.");

async function addCustomerMessage(conversationId: string, text: string) {
  const message = await prisma.chatMessage.create({ data: { conversationId, sender: MessageSender.CUSTOMER, body: text }, select: publicMessage });
  const conversation = await prisma.conversation.update({
    where: { id: conversationId },
    data: { unreadForStaff: { increment: 1 }, lastMessageAt: message.createdAt, lastMessage: text.slice(0, 200), status: "OPEN" },
  });
  publish({ type: "message", conversationId, data: { message, conversation } });
  return message;
}

chatRouter.get("/conversation", async (req, res) => {
  const conversation = await prisma.conversation.findUnique({ where: { visitorKeyHash: visitorHash(req) }, select: publicConversation });
  if (!conversation) throw new HttpError(404, "Chưa có cuộc trò chuyện.");
  const messages = await prisma.chatMessage.findMany({ where: { conversationId: conversation.id }, orderBy: { createdAt: "asc" }, take: 200, select: publicMessage });
  res.json({ data: { conversation, messages } });
});

const startInput = z.object({
  name: z.string().trim().min(2, "Bạn cho shop biết tên để tiện xưng hô.").max(80),
  phone: z.union([z.literal(""), phoneField]).optional().transform((v) => v || null),
  body,
  pageUrl: z.string().max(300).optional(),
});

chatRouter.post("/start", async (req, res) => {
  const hash = visitorHash(req);
  spam.check(hash);
  spam.fail(hash);
  const input = startInput.parse(req.body);
  let conversation = await prisma.conversation.findUnique({ where: { visitorKeyHash: hash } });
  if (!conversation) {
    // Gắn với khách đã có: ưu tiên tài khoản đang đăng nhập, sau đó theo số điện thoại
    const accountId = customerIdFrom(req);
    const byPhone = !accountId && input.phone ? await prisma.customer.findUnique({ where: { phone: input.phone }, select: { id: true } }) : null;
    conversation = await prisma.conversation.create({
      data: { visitorKeyHash: hash, name: input.name, phone: input.phone, pageUrl: input.pageUrl, customerId: accountId ?? byPhone?.id ?? null },
    });
  }
  await addCustomerMessage(conversation.id, input.body);
  res.status(201).json({ data: { id: conversation.id } });
});

chatRouter.post("/messages", async (req, res) => {
  const hash = visitorHash(req);
  spam.check(hash);
  spam.fail(hash);
  const { body: text } = z.object({ body }).parse(req.body);
  const conversation = await prisma.conversation.findUnique({ where: { visitorKeyHash: hash }, select: { id: true } });
  if (!conversation) throw new HttpError(404, "Chưa có cuộc trò chuyện.");
  res.status(201).json({ data: await addCustomerMessage(conversation.id, text) });
});

chatRouter.post("/read", async (req, res) => {
  await prisma.conversation.updateMany({ where: { visitorKeyHash: visitorHash(req) }, data: { unreadForCustomer: 0 } });
  res.json({ data: { ok: true } });
});

chatRouter.get("/stream", async (req, res) => {
  const conversation = await prisma.conversation.findUnique({ where: { visitorKeyHash: visitorHash(req) }, select: { id: true } });
  if (!conversation) throw new HttpError(404, "Chưa có cuộc trò chuyện.");
  streamEvents(req, res, conversationChannel(conversation.id));
});
