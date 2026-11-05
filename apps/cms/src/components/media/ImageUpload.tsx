import { useId, useRef, useState } from "react";
import { formatBytes, MEDIA_ACCEPT, mediaSrc, uploadMedia, type UploadedMedia } from "../../lib/media";
import { errorMessage } from "../../lib/api";
import { ImageIcon } from "../icons";
import { Button } from "../ui/Button";
import { Switch } from "../ui/Field";
import { showToast } from "../ui/Toast";

const KEY = "anchi-cms-compress";
const readCompress = () => {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
};

// Nút chọn ảnh kèm công tắc nén WebP (nhớ lựa chọn trên máy). Trả đường dẫn /api/media/<id>
export function ImageUpload({ value, onChange, label = "Tải ảnh", disabled, preview = true }: { value?: string | null; onChange: (path: string, info: UploadedMedia) => void; label?: string; disabled?: boolean; preview?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const [compress, setCompress] = useState(readCompress);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<string | null>(null);

  function toggle(v: boolean) {
    setCompress(v);
    try {
      localStorage.setItem(KEY, v ? "on" : "off");
    } catch {}
  }

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const saved = await uploadMedia(file, { compress });
      setLast(`${saved.width}×${saved.height} · ${formatBytes(saved.size)}${compress ? " · WebP" : ""}`);
      onChange(saved.path, saved);
    } catch (err) {
      showToast("Chưa tải được ảnh", { type: "error", desc: errorMessage(err) });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {preview && value && (
        <img src={mediaSrc(value)} alt="" className="aspect-[3/2] w-full rounded-lg border border-line bg-paper-2 object-cover" />
      )}
      <div className="flex flex-wrap items-center gap-3">
        <input ref={input} id={id} type="file" accept={MEDIA_ACCEPT} className="sr-only" onChange={(e) => pick(e.target.files?.[0])} disabled={disabled || busy} />
        <Button variant="outline" size="sm" loading={busy} disabled={disabled} onClick={() => input.current?.click()}>
          <ImageIcon size={16} /> {value ? "Đổi ảnh" : label}
        </Button>
        <Switch checked={compress} onChange={toggle} label="Nén sang WebP" disabled={disabled || busy} />
      </div>
      {last && <p className="text-xs text-ink-3" aria-live="polite">Đã tải: {last}</p>}
    </div>
  );
}
