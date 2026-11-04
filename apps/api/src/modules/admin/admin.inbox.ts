import { Router } from "express";
import { z } from "zod";
import { ConversationStatus, MessageSender, type Prisma } from "../../generated/prisma/client.js";
import type { StaffContext } from "../../lib/auth.js";
import { inboxChannel, publish, streamEvents } from "../../lib/chat-bus.js";
import { prisma } from "../../lib/prisma.js";
import { optionalText } from "../../lib/text.js";

export const adminInboxRouter = Router();

const listSelect = {
  id: true, channel: true, name: true, phone: true, status: true, tags: true, unreadForStaff: true, lastMessage: true, lastMessageAt: true,
  assignee: { select: { id: true, name: true } },
} as const;

const listQuery = z.object({
  view: z.enum(["all", "mine", "unassigned", "closed"]).default("all"),
  q: z.string().trim().optional(),
});

adminInboxRouter.get("/inbox/conversations", async (req, res) => {
  const { view, q } = listQuery.parse(req.query);
  const me = res.locals.staff as StaffContext;
  const where: Prisma.ConversationWhereInput = {
    ...(view === "closed" ? { status: ConversationStatus.CLOSED } : { status: { not: ConversationStatus.CLOSED } }),
    ...(view === "mine" ? { assigneeId: me.id } : {}),
    ...(view === "unassigned" ? { assigneeId: null } : {}),
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q.replace(/\s/g, "") } }, { tags: { has: q } }] } : {}),
  };
  const data = await prisma.conversation.findMany({ where, select: listSelect, orderBy: { lastMessageAt: "desc" }, take: 100 });
  res.json({ data });
});

adminInboxRouter.get("/inbox/unread", async (_req, res) => {
  const agg = await prisma.conversation.aggregate({ where: { status: { not: ConversationStatus.CLOSED } }, _sum: { unreadForStaff: true } });
  res.json({ data: { unread: agg._sum.unreadForStaff ?? 0 } });
});

adminInboxRouter.get("/inbox/conversations/:id", async (req, res) => {
  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: req.params.id },
    include: {
      assignee: { select: { id: true, name: true } },
      customer: {
        select: {
          id: true, name: true, phone: true, email: true, address: true, marketingConsent: true,
          orders: { orderBy: { createdAt: "desc" }, take: 5, select: { id: true, code: true, totalVnd: true, status: true, createdAt: true } },
        },
      },
    },
  });
  const messages = await prisma.chatMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 500,
    include: { staff: { select: { name: true } } },
  });
  res.json({ data: { conversation, messages } });
});

adminInboxRouter.post("/inbox/conversations/:id/messages", async (req, res) => {
  const me = res.locals.staff as StaffContext;
  const { body } = z.object({ body: z.string().trim().min(1, "Nhập nội dung trả lời.").max(2000) }).parse(req.body);
  const message = await prisma.chatMessage.create({
    data: { conversationId: req.params.id, sender: MessageSender.STAFF, staffId: me.id, body },
    include: { staff: { select: { name: true } } },
  });
  const current = await prisma.conversation.findUniqueOrThrow({ where: { id: req.params.id }, select: { assigneeId: true } });
  // Người trả lời đầu tiên tự nhận hội thoại
  const conversation = await prisma.conversation.update({
    where: { id: req.params.id },
    data: {
      // Đã trả lời thì chuyển sang chờ khách; khách nhắn lại sẽ về "cần trả lời"
      unreadForCustomer: { increment: 1 }, unreadForStaff: 0, lastMessageAt: message.createdAt, lastMessage: body.slice(0, 200), status: "PENDING",
      ...(current.assigneeId ? {} : { assigneeId: me.id }),
    },
    select: listSelect,
  });
  publish({ type: "message", conversationId: conversation.id, data: { message, conversation } });
  res.status(201).json({ data: message });
});

const patchInput = z.object({
  status: z.enum(ConversationStatus).optional(),
  assigneeId: z.string().nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
  note: optionalText.optional(),
  name: z.string().trim().min(1).max(80).optional(),
  phone: optionalText.optional(),
  customerId: z.string().nullable().optional(),
});

adminInboxRouter.patch("/inbox/conversations/:id", async (req, res) => {
  const conversation = await prisma.conversation.update({ where: { id: req.params.id }, data: patchInput.parse(req.body), select: listSelect });
  publish({ type: "conversation", conversationId: conversation.id, data: { conversation } });
  res.json({ data: conversation });
});

adminInboxRouter.post("/inbox/conversations/:id/read", async (req, res) => {
  const conversation = await prisma.conversation.update({ where: { id: req.params.id }, data: { unreadForStaff: 0 }, select: listSelect });
  publish({ type: "conversation", conversationId: conversation.id, data: { conversation } });
  res.json({ data: conversation });
});

adminInboxRouter.get("/inbox/stream", (req, res) => streamEvents(req, res, inboxChannel));

// Danh sách nhân viên để phân công, ai cũng xem được tên
adminInboxRouter.get("/inbox/staff", async (_req, res) => {
  res.json({ data: await prisma.staffUser.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }) });
});

adminInboxRouter.get("/inbox/quick-replies", async (_req, res) => {
  res.json({ data: await prisma.quickReply.findMany({ orderBy: { position: "asc" } }) });
});

adminInboxRouter.put("/inbox/quick-replies", async (req, res) => {
  const { items } = z.object({ items: z.array(z.object({ title: z.string().trim().min(1), body: z.string().trim().min(1).max(2000) })).max(50) }).parse(req.body);
  await prisma.$transaction([prisma.quickReply.deleteMany(), prisma.quickReply.createMany({ data: items.map((x, position) => ({ ...x, position })) })]);
  res.json({ data: await prisma.quickReply.findMany({ orderBy: { position: "asc" } }) });
});
