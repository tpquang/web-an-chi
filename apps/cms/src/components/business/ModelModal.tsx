import { lazy, Suspense, useEffect, useState } from "react";
import { api, errorMessage } from "../../lib/api";
import type { MaterialRow } from "../../lib/inventory";
import { Button } from "../ui/Button";
import { confirmDialog, Modal } from "../ui/Modal";
import { showToast } from "../ui/Toast";

// three.js chỉ nạp khi mở hộp này
const ModelPreview = lazy(() => import("../ModelPreview").then((m) => ({ default: m.ModelPreview })));

// Trùng MODEL_SPEC ở API
const MAX_MB = 15;

async function readGlb(file: File): Promise<ArrayBuffer> {
  if (!file.name.toLowerCase().endsWith(".glb")) throw new Error("Chọn file .glb. Trong Blender: File, Export, glTF 2.0, định dạng glTF Binary.");
  if (file.size > MAX_MB * 1_000_000) throw new Error(`File nặng ${(file.size / 1_000_000).toFixed(1)} MB, tối đa ${MAX_MB} MB. Giảm số đa giác hoặc nén ảnh trong file.`);
  const data = await file.arrayBuffer();
  if (new TextDecoder().decode(data.slice(0, 4)) !== "glTF") throw new Error("File không phải .glb hợp lệ.");
  return data;
}

// Tải và xem file 3D của charm
export function ModelModal({ row, onClose, onSaved }: { row: MaterialRow; onClose(): void; onSaved(): void }) {
  const [current, setCurrent] = useState<ArrayBuffer | null>(null);
  const [picked, setPicked] = useState<{ file: File; data: ArrayBuffer } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!row.model) return;
    let live = true;
    api
      .download(`/materials/${row.id}/model`)
      .then((data) => live && setCurrent(data))
      .catch((err) => live && setError(errorMessage(err)));
    return () => {
      live = false;
    };
  }, [row.id, row.model]);

  async function pick(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      setPicked({ file, data: await readGlb(file) });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function save() {
    if (!picked) return;
    setSaving(true);
    try {
      await api.upload(`/materials/${row.id}/model?name=${encodeURIComponent(picked.file.name)}`, new Blob([picked.data], { type: "model/gltf-binary" }));
      showToast(`Đã lưu file 3D ${row.name}.`);
      onSaved();
    } catch (err) {
      showToast("Chưa lưu được file 3D", { type: "error", desc: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!(await confirmDialog({ title: "Xoá file 3D", desc: `Charm ${row.name} sẽ không còn mô hình 3D.`, confirmLabel: "Xoá file 3D", danger: true }))) return;
    try {
      await api.delete(`/materials/${row.id}/model`);
      showToast("Đã xoá file 3D.");
      onSaved();
    } catch (err) {
      showToast("Chưa xoá được", { type: "error", desc: errorMessage(err) });
    }
  }

  const shown = picked?.data ?? current;
  return (
    <Modal
      open
      wide
      onClose={onClose}
      locked={saving}
      title={`File 3D: ${row.name}`}
      footer={
        <>
          {row.model && !picked && (
            <Button variant="text" className="mr-auto text-err" onClick={remove} disabled={saving}>
              Xoá file 3D
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Huỷ
          </Button>
          <Button onClick={save} loading={saving} disabled={!picked}>
            Lưu file 3D
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4 text-sm">
          <div className="flex flex-col gap-2 rounded-xl border border-line bg-paper-2 p-4 text-ink-2">
            <p className="font-medium text-ink">Yêu cầu file</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Định dạng .glb (glTF Binary), tối đa {MAX_MB} MB.</li>
              <li>Tâm charm ở gốc toạ độ, lỗ xâu dây nằm ngang.</li>
              <li>Đơn vị mét, đúng kích thước thật. Charm 10 mm thì dài 0,01.</li>
              <li>Ảnh vân, màu kim loại đóng gói sẵn trong file.</li>
            </ul>
          </div>
          <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-md border border-dashed border-line-strong px-4 text-wood hover:border-wood">
            {picked || row.model ? "Chọn file khác" : "Chọn file .glb"}
            <input type="file" accept=".glb,model/gltf-binary" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} disabled={saving} />
          </label>
          {picked && <p className="truncate text-ink-2">File mới: {picked.file.name} · {(picked.file.size / 1_000_000).toFixed(1)} MB</p>}
          {!picked && row.model && (
            <p className="truncate text-ink-2">
              Đang dùng: {row.model.fileName} · {(row.model.size / 1_000_000).toFixed(1)} MB
            </p>
          )}
          {error && (
            <p role="alert" className="text-err">
              {error}
            </p>
          )}
        </div>
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-line bg-paper-2">
          <Suspense fallback={<p className="flex size-full items-center justify-center text-sm text-ink-3">Đang dựng 3D…</p>}>
            <ModelPreview data={shown} onError={setError} />
          </Suspense>
          <p className="pointer-events-none absolute top-2 left-2 rounded-full bg-surface/90 px-3 py-1 text-xs shadow-e1">
            {picked ? "Xem trước file mới" : shown ? "File đang dùng" : "Chưa có file"} · kéo để xoay
          </p>
        </div>
      </div>
    </Modal>
  );
}
