"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { hasConversation, loadChat, markChatRead, mergeMessage, sendChat, startChat, subscribeChat, type ChatMessage } from "@/lib/chat-client";
import { normalizePhone } from "@/lib/checkout";
import { BrandMark } from "../brand-mark";
import { CloseIcon, SendIcon } from "../icons";
import { Button } from "../ui/button";
import { Field, Input, Textarea } from "../ui/field";
import { Spinner } from "../ui/spinner";

const time = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" });

export function ChatPanel({ onClose, onRead }: { onClose: () => void; onRead: () => void }) {
  const [status, setStatus] = useState<"loading" | "new" | "chat">("loading");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", body: "" });
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const inFlight = useRef(false);
  const listRef = useRef<HTMLOListElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Đóng kết nối nghe tin khi thu nhỏ khung chat
  const stopRef = useRef<() => void>(() => {});
  useEffect(() => () => stopRef.current(), []);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!hasConversation()) {
      setStatus("new");
      // Khách đã đăng nhập thì điền sẵn tên, số điện thoại
      if (document.cookie.includes("anchi-signed-in=1")) {
        fetch("/api/account/me").then((r) => (r.ok ? r.json() : null)).then((b) => b && setForm((f) => ({ ...f, name: b.data.name, phone: b.data.phone }))).catch(() => {});
      }
      return;
    }
    loadChat().then((state) => {
      if (!state) return setStatus("new");
      setMessages(state.messages);
      setStatus("chat");
      markChatRead();
      onRead();
      stopRef.current = subscribeChat((message) => {
        setMessages((list) => mergeMessage(list, message));
        markChatRead();
      });
    });
  }, [onRead]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, status]);

  async function guard(action: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setSending(true);
    setError(null);
    try {
      await action();
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }

  function handleStart(event: FormEvent) {
    event.preventDefault();
    if (form.name.trim().length < 2) return setError("Bạn cho shop biết tên để tiện xưng hô.");
    if (form.phone && !/^0\d{9}$/.test(normalizePhone(form.phone))) return setError("Số điện thoại cần đủ 10 chữ số, bắt đầu bằng 0. Hoặc để trống.");
    if (!form.body.trim()) return setError("Bạn nhập câu hỏi cho shop.");
    guard(async () => {
      const result = await startChat(form);
      if (!result.ok) return setError(result.error);
      const state = await loadChat();
      setMessages(state?.messages ?? []);
      setStatus("chat");
      onRead();
      stopRef.current = subscribeChat((message) => setMessages((list) => mergeMessage(list, message)));
    });
  }

  function handleSend(event?: FormEvent) {
    event?.preventDefault();
    const body = draft.trim();
    if (!body) return;
    guard(async () => {
      const result = await sendChat(body);
      if (!result.ok) return setError(result.error);
      setDraft("");
      setMessages((list) => mergeMessage(list, result.data));
    });
  }

  // Enter để gửi, Shift + Enter để xuống dòng
  function onKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Nhắn tin với shop"
      className="fixed inset-0 z-(--z-overlay) flex flex-col bg-surface pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] sm:inset-auto sm:right-4 sm:bottom-4 sm:h-[min(560px,calc(100dvh-32px))] sm:w-90 sm:rounded-xl sm:border sm:border-line sm:shadow-e4"
    >
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <BrandMark className="size-9 text-wood" />
        <div className="min-w-0 flex-1">
          <p className="font-serif text-lg leading-tight font-semibold">An Chi Trầm Hương</p>
          <p className="text-[13px] text-ink-3">Shop trả lời trong giờ làm việc</p>
        </div>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Thu nhỏ khung chat" className="inline-flex size-11 items-center justify-center rounded-md text-ink-2 hover:bg-paper-2">
          <CloseIcon />
        </button>
      </div>

      {status === "loading" && <div aria-busy className="flex flex-1 items-center justify-center text-wood"><Spinner size="lg" /></div>}

      {status === "new" && (
        <form onSubmit={handleStart} noValidate className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <p className="text-sm text-ink-2">Bạn hỏi về sản phẩm, cách dùng hay đơn hàng, shop trả lời ngay tại đây.</p>
          <Field label="Tên của bạn"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" disabled={sending} /></Field>
          <Field label="Số điện thoại" optional hint="Để shop gọi lại khi cần, không dùng để quảng cáo."><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" autoComplete="tel" disabled={sending} /></Field>
          <Field label="Bạn cần shop hỗ trợ gì?"><Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={3} placeholder="VD: Nụ trầm hộp 50 viên đốt được bao lâu?" disabled={sending} /></Field>
          {error && <p role="alert" className="text-sm text-err">{error}</p>}
          <Button type="submit" loading={sending}>Gửi tin nhắn</Button>
        </form>
      )}

      {status === "chat" && (
        <>
          <ol ref={listRef} aria-live="polite" className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
            {messages.map((m) => {
              const mine = m.sender === "CUSTOMER";
              return (
                <li key={m.id} className={`flex max-w-[85%] flex-col ${mine ? "self-end items-end" : "self-start items-start"}`}>
                  {!mine && m.staff && <span className="mb-0.5 text-xs text-ink-3">{m.staff.name}</span>}
                  <span className={`rounded-lg px-3 py-2 text-[15px] whitespace-pre-line ${mine ? "bg-wood text-on-wood" : "bg-paper-2 text-ink"}`}>{m.body}</span>
                  <span className="mt-0.5 text-xs text-ink-3">{time.format(new Date(m.createdAt))}</span>
                </li>
              );
            })}
          </ol>
          <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-line p-3">
            {/* Ô một dòng, tự cao lên khi xuống dòng; Textarea chung có chiều cao tối thiểu 96px nên không dùng ở đây */}
            <textarea
              aria-label="Tin nhắn"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              rows={Math.min(4, draft.split("\n").length)}
              placeholder="Nhập tin nhắn"
              disabled={sending}
              className="min-h-11 w-full resize-none rounded-md border border-line-strong bg-surface px-3 py-2.5 text-base text-ink placeholder:text-ink-3 focus:border-wood focus:outline-none disabled:bg-paper-2"
            />
            <button type="submit" aria-label="Gửi" disabled={sending || !draft.trim()} className="inline-flex size-11 flex-none items-center justify-center rounded-md bg-wood text-on-wood hover:bg-wood-hover disabled:opacity-50">
              {sending ? <Spinner /> : <SendIcon size={20} />}
            </button>
          </form>
          {error && <p role="alert" className="px-3 pb-3 text-sm text-err">{error}</p>}
        </>
      )}
    </div>,
    document.body,
  );
}
