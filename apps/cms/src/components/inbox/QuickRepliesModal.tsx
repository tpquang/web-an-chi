import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useSubmit } from "../../lib/use-submit";
import { PlusIcon, TrashIcon } from "../icons";
import { Button, IconButton } from "../ui/Button";
import { Input, Textarea } from "../ui/Field";
import { Modal } from "../ui/Modal";
import { showToast } from "../ui/Toast";

type Reply = { title: string; body: string };

// Câu trả lời mẫu dùng chung cho cả shop. "{ten}" được thay bằng tên khách khi chèn
export function QuickRepliesModal({ open, replies, onClose, onSaved }: { open: boolean; replies: Reply[]; onClose: () => void; onSaved: (r: Reply[]) => void }) {
  const [rows, setRows] = useState<Reply[]>(replies);
  const { submitting, run } = useSubmit();
  useEffect(() => {
    if (open) setRows(replies.length ? replies : [{ title: "Chào khách", body: "Chào {ten}, An Chi Trầm Hương có thể giúp gì cho bạn ạ?" }]);
  }, [open, replies]);

  const set = (i: number, patch: Partial<Reply>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  function save() {
    run(async () => {
      const saved = await api.put<Reply[]>("/inbox/quick-replies", { items: rows.filter((r) => r.title.trim() && r.body.trim()) });
      onSaved(saved);
      showToast("Đã lưu câu trả lời mẫu.");
      onClose();
    }, "Chưa lưu được");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      locked={submitting}
      wide
      title="Câu trả lời mẫu"
      footer={<><Button variant="secondary" onClick={onClose} disabled={submitting}>Huỷ</Button><Button onClick={save} loading={submitting}>Lưu</Button></>}
    >
      <p className="mb-4 text-sm text-ink-2">Trong ô chat gõ "/" và vài chữ của tên câu mẫu để chèn. Viết {"{ten}"} để tự điền tên khách.</p>
      <div className="flex flex-col gap-3">
        {rows.map((r, i) => (
          <div key={i} role="group" aria-label={`Câu mẫu ${i + 1}`} className="grid gap-2 sm:grid-cols-[180px_1fr_44px]">
            <Input aria-label={`Tên câu mẫu ${i + 1}`} value={r.title} onChange={(e) => set(i, { title: e.target.value })} placeholder="VD: Phí giao" disabled={submitting} />
            <Textarea aria-label={`Nội dung ${i + 1}`} value={r.body} onChange={(e) => set(i, { body: e.target.value })} rows={2} disabled={submitting} />
            <IconButton label={`Bỏ câu mẫu ${i + 1}`} onClick={() => setRows(rows.filter((_, j) => j !== i))} disabled={submitting}><TrashIcon size={18} /></IconButton>
          </div>
        ))}
        <div><Button variant="outline" size="sm" onClick={() => setRows([...rows, { title: "", body: "" }])} disabled={submitting}><PlusIcon size={16} /> Thêm câu mẫu</Button></div>
      </div>
    </Modal>
  );
}
