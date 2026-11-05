import { useId, useRef, useState } from "react";
import { api, errorMessage, publicUrl } from "../../lib/api";
import { ACCEPT, prepareSiteImage, type SiteImage } from "../../lib/site-image";
import { Button } from "../ui/Button";

type Props = { label: string; hint: string; imageId: string | null; ratio: string; disabled?: boolean; onChange(id: string | null): void };

// Chọn ảnh là tải lên ngay để xem trước; cấu hình trang chủ chỉ đổi khi bấm Lưu
export function ImageField({ label, hint, imageId, ratio, disabled, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  async function pick(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const saved = await api.upload<SiteImage>("/site-images", await prepareSiteImage(file), "POST");
      onChange(saved.id);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div role="group" aria-labelledby={`${id}-label`} className="flex flex-col gap-1.5">
      <p id={`${id}-label`} className="text-sm font-medium">{label}</p>
      <div className={`relative overflow-hidden rounded-2xl bg-paper-2 ${ratio}`}>
        {imageId ? (
          <img src={publicUrl(`/settings/images/${imageId}`)} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <p className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-ink-3">Chưa có ảnh. Website hiện nền trơn.</p>
        )}
      </div>
      <p id={`${id}-hint`} className="text-sm text-ink-3">{hint}</p>
      {error && <p role="alert" className="text-sm text-err">{error}</p>}
      <div className="flex flex-wrap items-center gap-4">
        <input ref={input} type="file" accept={ACCEPT} className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => pick(e.target.files?.[0])} />
        <Button variant="secondary" size="sm" loading={uploading} disabled={disabled} aria-describedby={`${id}-hint`} onClick={() => input.current?.click()}>
          {imageId ? "Thay ảnh" : "Chọn ảnh"}
        </Button>
        {imageId && (
          <Button variant="text" size="sm" className="text-err" disabled={disabled || uploading} onClick={() => onChange(null)}>
            Bỏ ảnh
          </Button>
        )}
      </div>
    </div>
  );
}
