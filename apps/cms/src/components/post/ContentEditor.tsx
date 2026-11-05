import { useRef, useState } from "react";
import { mediaSrc } from "../../lib/media";
import { contentImages, imageLine } from "../../lib/seo-check";
import { ImageUpload } from "../media/ImageUpload";
import { Button } from "../ui/Button";
import { Field, Input, Textarea } from "../ui/Field";
import { Modal } from "../ui/Modal";

// Soạn nội dung văn bản thuần theo quy ước ở schema Post. Thanh công cụ đặt tiền tố cho dòng đang đứng
// (# H1, ## H2, ### H3, - gạch đầu dòng) và chèn ảnh ![alt](url "chú thích") thành một đoạn riêng
type Props = { value: string; onChange: (value: string) => void; disabled?: boolean; error?: string };

const BLOCKS = [
  { label: "Đoạn", prefix: "", title: "Đoạn văn thường" },
  { label: "H1", prefix: "# ", title: "Tiêu đề cấp 1. Trang đã có H1 là tiêu đề bài, web sẽ hiện như H2" },
  { label: "H2", prefix: "## ", title: "Tiêu đề mục" },
  { label: "H3", prefix: "### ", title: "Tiêu đề mục con" },
  { label: "• Danh sách", prefix: "- ", title: "Gạch đầu dòng" },
] as const;

const PREFIX = /^(#{1,3}\s|-\s)/;

export function ContentEditor({ value, onChange, disabled, error }: Props) {
  const area = useRef<HTMLTextAreaElement>(null);
  const [inserting, setInserting] = useState<{ src: string; alt: string; caption: string } | null>(null);
  const images = contentImages(value);

  // Đổi tiền tố cho mọi dòng trong vùng chọn
  function applyPrefix(prefix: string) {
    const el = area.current;
    if (!el) return;
    const start = value.lastIndexOf("\n", el.selectionStart - 1) + 1;
    const endIdx = value.indexOf("\n", el.selectionEnd);
    const end = endIdx === -1 ? value.length : endIdx;
    const block = value
      .slice(start, end)
      .split("\n")
      .map((line) => (line.trim() ? prefix + line.replace(PREFIX, "") : line))
      .join("\n");
    onChange(value.slice(0, start) + block + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start, start + block.length);
    });
  }

  function insertImage() {
    if (!inserting?.src) return;
    const el = area.current;
    const at = el ? el.selectionEnd : value.length;
    const lineEnd = value.indexOf("\n", at);
    const pos = lineEnd === -1 ? value.length : lineEnd;
    const before = value.slice(0, pos).replace(/\s+$/, "");
    const after = value.slice(pos).replace(/^\s+/, "");
    onChange(`${before}${before ? "\n\n" : ""}${imageLine(inserting)}\n\n${after}`);
    setInserting(null);
  }

  function editImage(line: number, patch: Partial<{ alt: string; caption: string }>) {
    const lines = value.split("\n");
    const img = contentImages(value).find((i) => i.line === line);
    if (!img) return;
    lines[line] = imageLine({ ...img, ...patch });
    onChange(lines.join("\n"));
  }

  return (
    <div className="flex flex-col gap-3">
      <Field label="Nội dung" error={error} hint="Đoạn cách nhau một dòng trống. Đặt con trỏ vào dòng rồi chọn kiểu ở thanh công cụ.">
        <div className="overflow-hidden rounded-xl border border-line-strong focus-within:border-wood">
          <div role="toolbar" aria-label="Định dạng nội dung" className="flex flex-wrap gap-1 border-b border-line bg-paper-2 p-1">
            {BLOCKS.map((b) => (
              <button key={b.label} type="button" title={b.title} onClick={() => applyPrefix(b.prefix)} disabled={disabled} className="min-h-9 rounded-md px-2.5 text-xs font-semibold text-ink-2 hover:bg-surface hover:text-wood">
                {b.label}
              </button>
            ))}
            <span className="mx-1 w-px self-stretch bg-line" aria-hidden />
            <button type="button" onClick={() => setInserting({ src: "", alt: "", caption: "" })} disabled={disabled} className="min-h-9 rounded-md px-2.5 text-xs font-semibold text-ink-2 hover:bg-surface hover:text-wood">
              + Ảnh
            </button>
          </div>
          <textarea
            ref={area}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            rows={22}
            aria-invalid={Boolean(error)}
            className="block w-full resize-y bg-surface px-3 py-2 font-mono text-sm leading-relaxed outline-none"
          />
        </div>
      </Field>

      {images.length > 0 && (
        <div role="group" aria-labelledby="anh-trong-bai" className="flex flex-col gap-2">
          <p id="anh-trong-bai" className="text-sm font-medium">Ảnh trong bài ({images.length})</p>
          {images.map((img) => (
            <div key={img.line} className="grid gap-2 rounded-lg border border-line p-2 sm:grid-cols-[96px_1fr]">
              <img src={mediaSrc(img.src)} alt="" className="aspect-square w-24 rounded-md bg-paper-2 object-cover" />
              <div className="grid gap-2">
                <Field label="Alt (mô tả ảnh cho Google, người khiếm thị)" error={img.alt.trim() ? undefined : "Ảnh cần alt."}>
                  <Input value={img.alt} onChange={(e) => editImage(img.line, { alt: e.target.value })} disabled={disabled} />
                </Field>
                <Field label="Chú thích dưới ảnh" optional>
                  <Input value={img.caption} onChange={(e) => editImage(img.line, { caption: e.target.value })} disabled={disabled} />
                </Field>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(inserting)}
        onClose={() => setInserting(null)}
        title="Chèn ảnh"
        footer={<><Button variant="secondary" onClick={() => setInserting(null)}>Huỷ</Button><Button onClick={insertImage} disabled={!inserting?.src || !inserting.alt.trim()}>Chèn vào bài</Button></>}
      >
        {inserting && (
          <div className="flex flex-col gap-4">
            <ImageUpload value={inserting.src} onChange={(src) => setInserting({ ...inserting, src })} />
            <Field label="Alt" hint="Tả đúng thứ trong ảnh, có từ khoá nếu tự nhiên. VD: Nụ trầm cháy trên lư gốm men nâu.">
              <Input value={inserting.alt} onChange={(e) => setInserting({ ...inserting, alt: e.target.value })} />
            </Field>
            <Field label="Chú thích dưới ảnh" optional>
              <Textarea value={inserting.caption} rows={2} onChange={(e) => setInserting({ ...inserting, caption: e.target.value })} />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
}
