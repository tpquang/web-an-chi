import { chatProxy } from "@/lib/chat-proxy";

export const POST = chatProxy("/start", { method: "POST", create: true });
