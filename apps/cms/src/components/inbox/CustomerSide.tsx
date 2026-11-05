import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../../lib/api";
import { formatDate, formatVnd } from "../../lib/format";
import { conversationStatus, type ConversationDetail, type ConversationRow, type ConversationStatus } from "../../lib/inbox";
import { orderStatus } from "../../lib/labels";
import { Field, Input, Textarea } from "../ui/Field";
import { Select } from "../ui/Select";
import { Tag } from "../ui/States";
import { showToast } from "../ui/Toast";

type Props = {
  conversation: ConversationDetail;
  staff: { id: string; name: string }[];
  onUpdated: (row: ConversationRow) => void;
};

// Thông tin khách, phân công, trạng thái, thẻ và ghi chú nội bộ. Lưu ngay khi đổi
export function CustomerSide({ conversation, staff, onUpdated }: Props) {
  const [tags, setTags] = useState(conversation.tags.join(", "));
  const [note, setNote] = useState(conversation.note ?? "");
  useEffect(() => {
    setTags(conversation.tags.join(", "));
    setNote(conversation.note ?? "");
    // Chỉ nạp lại khi đổi sang hội thoại khác, không ghi đè lúc đang gõ
  }, [conversation.id]);

  async function patch(data: Record<string, unknown>, done = "Đã lưu.") {
    try {
      onUpdated(await api.patch<ConversationRow>(`/inbox/conversations/${conversation.id}`, data));
      showToast(done);
    } catch (err) {
      showToast("Chưa lưu được", { type: "error", desc: errorMessage(err) });
    }
  }

  const c = conversation.customer;
  return (
    <div className="flex min-h-0 flex-col gap-5 overflow-y-auto p-4">
      <section aria-labelledby="xu-ly" className="flex flex-col gap-3">
        <h2 id="xu-ly" className="font-serif text-lg font-semibold">Xử lý</h2>
        <div role="group" aria-label="Trạng thái" className="flex flex-wrap gap-1">
          {(Object.keys(conversationStatus) as ConversationStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={conversation.status === s}
              onClick={() => patch({ status: s }, `Đã chuyển sang "${conversationStatus[s].label}".`)}
              className={`min-h-9 rounded-full border px-3 text-sm ${conversation.status === s ? "border-wood bg-wood-soft text-wood" : "border-line hover:border-wood"}`}
            >
              {conversationStatus[s].label}
            </button>
          ))}
        </div>
        <Field label="Người phụ trách">
          <Select value={conversation.assignee?.id ?? ""} options={[{ value: "", label: "Chưa ai nhận" }, ...staff.map((s) => ({ value: s.id, label: s.name }))]} onChange={(v) => patch({ assigneeId: v || null }, "Đã phân công.")} />
        </Field>
        <Field label="Thẻ" hint="Cách nhau bằng dấu phẩy, VD: hỏi giá, khách sỉ.">
          <Input value={tags} onChange={(e) => setTags(e.target.value)} onBlur={() => tags !== conversation.tags.join(", ") && patch({ tags: tags.split(",").map((t) => t.trim()).filter(Boolean) })} />
        </Field>
        <Field label="Ghi chú nội bộ" hint="Khách không thấy.">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => note !== (conversation.note ?? "") && patch({ note })} rows={3} />
        </Field>
      </section>

      <section aria-labelledby="khach" className="flex flex-col gap-2 border-t border-line pt-4 text-sm">
        <h2 id="khach" className="font-serif text-lg font-semibold">Khách hàng</h2>
        {c ? (
          <>
            <Link to={`/customers/${c.id}`} className="font-medium hover:text-wood">{c.name}</Link>
            <a href={`tel:${c.phone}`} className="text-ink-2 hover:text-wood">{c.phone}</a>
            {c.email && <span className="text-ink-2">{c.email}</span>}
            {c.address && <span className="text-ink-2">{c.address}</span>}
            <span className="text-ink-3">{c.marketingConsent ? "Đồng ý nhận tin" : "Chưa đồng ý nhận tin tiếp thị"}</span>
            <h3 className="mt-2 font-medium">Đơn gần đây</h3>
            {c.orders.length === 0 && <p className="text-ink-3">Chưa có đơn.</p>}
            <ul className="flex flex-col gap-1">
              {c.orders.map((o) => (
                <li key={o.id}>
                  <Link to={`/orders/${o.id}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-paper-2">
                    <span>{o.code}<span className="block text-xs text-ink-3">{formatDate(o.createdAt)} · {formatVnd(o.totalVnd)}</span></span>
                    <Tag tone={orderStatus[o.status].tone}>{orderStatus[o.status].label}</Tag>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-ink-2">
            Chưa khớp khách hàng nào{conversation.phone ? ` với số ${conversation.phone}` : ""}. Khách đặt hàng bằng số điện thoại này thì lần chat sau tự gắn.
          </p>
        )}
      </section>
    </div>
  );
}
