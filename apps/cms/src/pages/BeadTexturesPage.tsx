import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { confirmDialog, Modal } from "../components/ui/Modal";
import { DataTable, PageHeader, td, th } from "../components/ui/Page";
import { EmptyState, ErrorState, TableSkeleton, Tag } from "../components/ui/States";
import { showToast } from "../components/ui/Toast";
import { api, errorMessage, publicUrl } from "../lib/api";
import { ACCEPT, centerCrop, checkTexture, clampCrop, exportTexture, MAX_INPUT_MB, renderCrop, TEXTURE_SIDE, type CheckResult, type Crop } from "../lib/bead-texture";
import { useLoad } from "../lib/use-load";

// three.js chỉ nạp khi mở hộp tải ảnh
const BeadPreview = lazy(() => import("../components/BeadPreview").then((m) => ({ default: m.BeadPreview })));

export type TextureRow = {
  material: string;
  finish: string;
  beads: number;
  minMm: number;
  maxMm: number;
  texture: { id: string; version: number; roughness: number; updatedAt: string } | null;
};

export const textureUrl = (t: NonNullable<TextureRow["texture"]>) => publicUrl(`/bead-textures/${t.id}?v=${t.version}`);
export const loadTextureRows = () => api.get<TextureRow[]>("/bead-textures");
const date = (iso: string) => new Date(iso).toLocaleDateString("vi-VN");

export function BeadTexturesPage() {
  const { state, slow, reload } = useLoad(loadTextureRows, []);
  const [editing, setEditing] = useState<TextureRow | null>(null);

  async function remove(row: TextureRow) {
    if (!(await confirmDialog({ title: "Xoá ảnh vân", desc: `Hạt ${row.material} sẽ hiện bằng màu trơn cho tới khi có ảnh mới.`, confirmLabel: "Xoá ảnh vân", danger: true }))) return;
    try {
      await api.delete(`/bead-textures/${encodeURIComponent(row.material)}`);
      showToast("Đã xoá ảnh vân.");
      reload();
    } catch (err) {
      showToast("Chưa xoá được", { type: "error", desc: errorMessage(err) });
    }
  }

  return (
    <>
      <PageHeader
        title="Vân vật liệu hạt"
        desc="Ảnh vân bọc lên hạt 3D ở trang tự thiết kế vòng. Mỗi chất liệu một ảnh, dùng chung cho mọi cỡ hạt. Chất liệu chưa có ảnh thì hạt hiện màu trơn."
      />
      {state.status === "loading" && <div className={slow ? "" : "invisible"}><TableSkeleton rows={4} /></div>}
      {state.status === "error" && <ErrorState title="Chưa tải được danh sách chất liệu" desc={state.error} onRetry={reload} />}
      {state.status === "ready" && state.data.length === 0 && <EmptyState title="Chưa có hạt nào." desc="Thêm hạt vào kho trước, chất liệu của hạt sẽ hiện ở đây." />}
      {state.status === "ready" && state.data.length > 0 && (
        <DataTable head={<tr><th className={th}>Chất liệu</th><th className={th}>Ảnh vân</th><th className={th}><span className="sr-only">Thao tác</span></th></tr>}>
          {state.data.map((row) => (
            <tr key={row.material}>
              <td className={td}>
                <span className="font-medium">{row.material}</span>
                <span className="block text-[13px] text-ink-3">{row.beads} loại hạt · {row.minMm === row.maxMm ? `${row.minMm} mm` : `${row.minMm}–${row.maxMm} mm`}</span>
              </td>
              <td className={td}>
                {row.texture ? (
                  <span className="flex items-center gap-3">
                    <img src={textureUrl(row.texture)} alt="" width={44} height={44} className="size-11 rounded-full border border-line object-cover" />
                    <span className="text-[13px] text-ink-2">Cập nhật {date(row.texture.updatedAt)}</span>
                  </span>
                ) : (
                  <Tag tone={row.finish === "metal" ? "neutral" : "warn"}>{row.finish === "metal" ? "Kim loại không cần ảnh" : "Chưa có ảnh"}</Tag>
                )}
              </td>
              <td className={`${td} text-right whitespace-nowrap`}>
                <Button variant="secondary" size="sm" onClick={() => setEditing(row)}>{row.texture ? "Thay ảnh" : "Tải ảnh vân"}</Button>
                {row.texture && <Button variant="text" size="sm" className="ml-4 text-err" onClick={() => remove(row)}>Xoá</Button>}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
      {editing && <UploadModal row={editing} onClose={() => setEditing(null)} onSaved={() => (setEditing(null), reload())} />}
    </>
  );
}

// ---- Hộp tải ảnh: yêu cầu, ảnh mẫu, khung cắt, kiểm chất lượng, xem trước hạt 3D

const SIZES = [6, 8, 10, 12, 14];

export function UploadModal({ row, onClose, onSaved }: { row: TextureRow; onClose(): void; onSaved(): void }) {
  const [image, setImage] = useState<{ bitmap: ImageBitmap; name: string } | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [version, setVersion] = useState(0);
  const [roughness, setRoughness] = useState(row.texture?.roughness ?? (row.finish === "stone" ? 0.15 : 0.5));
  const [sizeMm, setSizeMm] = useState(() => SIZES.find((s) => s >= row.minMm) ?? 8);
  const [saving, setSaving] = useState(false);
  const output = useRef<HTMLCanvasElement | null>(null);
  if (!output.current && typeof document !== "undefined") output.current = document.createElement("canvas");

  // Ảnh đang dùng hiện sẵn trên hạt để so với ảnh mới
  useEffect(() => {
    if (!row.texture) return;
    let live = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!live || image) return;
      renderCrop(img, { x: 0, y: 0, side: img.naturalWidth }, output.current!);
      setVersion((v) => v + 1);
    };
    img.src = textureUrl(row.texture);
    return () => {
      live = false;
    };
  }, [row.texture]); // eslint-disable-line react-hooks/exhaustive-deps

  // Vẽ lại ảnh cắt và kiểm chất lượng mỗi khi khung cắt đổi, gộp theo khung hình
  useEffect(() => {
    if (!image || !crop) return;
    const frame = requestAnimationFrame(() => {
      renderCrop(image.bitmap, crop, output.current!);
      setVersion((v) => v + 1);
    });
    const timer = setTimeout(() => setChecks(checkTexture(output.current!, crop.side)), 180);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [image, crop]);

  async function pick(file: File | undefined) {
    if (!file) return;
    setFileError(null);
    if (!ACCEPT.split(",").includes(file.type)) return setFileError("Chỉ nhận ảnh JPG, PNG hoặc WebP.");
    if (file.size > MAX_INPUT_MB * 1024 * 1024) return setFileError(`Ảnh nặng quá ${MAX_INPUT_MB} MB.`);
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      const short = Math.min(bitmap.width, bitmap.height);
      if (short < TEXTURE_SIDE) {
        bitmap.close();
        return setFileError(`Ảnh chỉ ${bitmap.width}×${bitmap.height} px. Cạnh ngắn cần ít nhất ${TEXTURE_SIDE} px, bạn chụp lại bằng camera điện thoại ở chất lượng cao nhất.`);
      }
      image?.bitmap.close();
      setImage({ bitmap, name: file.name });
      setCrop(centerCrop(bitmap.width, bitmap.height));
    } catch {
      setFileError("Không đọc được ảnh này. Bạn thử xuất lại sang JPG.");
    }
  }

  const blocking = checks.some((c) => c.level === "error");
  const ready = Boolean(image && crop && checks.length && !blocking);

  async function save() {
    if (!ready) return;
    setSaving(true);
    try {
      const blob = await exportTexture(output.current!);
      await api.upload(`/bead-textures/${encodeURIComponent(row.material)}?roughness=${roughness}`, blob);
      showToast(`Đã lưu ảnh vân ${row.material}.`);
      onSaved();
    } catch (err) {
      showToast("Chưa lưu được ảnh vân", { type: "error", desc: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  async function saveRoughness() {
    setSaving(true);
    try {
      await api.patch(`/bead-textures/${encodeURIComponent(row.material)}`, { roughness });
      showToast("Đã lưu độ bóng.");
      onSaved();
    } catch (err) {
      showToast("Chưa lưu được", { type: "error", desc: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      wide
      onClose={onClose}
      locked={saving}
      title={`Ảnh vân: ${row.material}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Huỷ</Button>
          {!image && row.texture ? (
            <Button onClick={saveRoughness} loading={saving}>Lưu độ bóng</Button>
          ) : (
            <Button onClick={save} loading={saving} disabled={!ready}>Lưu ảnh vân</Button>
          )}
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          {!image ? (
            <>
              <Requirements />
              <FilePicker onPick={pick} error={fileError} />
            </>
          ) : (
            <>
              <CropStage bitmap={image.bitmap} crop={crop!} onChange={(c) => setCrop(clampCrop(c, image.bitmap.width, image.bitmap.height))} />
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Phóng to khung cắt</span>
                <input
                  type="range"
                  min={TEXTURE_SIDE}
                  max={Math.min(image.bitmap.width, image.bitmap.height)}
                  step={1}
                  // Kéo sang phải là khung nhỏ lại, tức phóng to vân
                  value={Math.min(image.bitmap.width, image.bitmap.height) + TEXTURE_SIDE - crop!.side}
                  onChange={(e) => {
                    const side = Math.min(image.bitmap.width, image.bitmap.height) + TEXTURE_SIDE - Number(e.target.value);
                    const cx = crop!.x + crop!.side / 2;
                    const cy = crop!.y + crop!.side / 2;
                    setCrop(clampCrop({ side, x: cx - side / 2, y: cy - side / 2 }, image.bitmap.width, image.bitmap.height));
                  }}
                  className="accent-(--wood)"
                />
                <span className="text-ink-3">Vân to hay nhỏ trên hạt tuỳ khung cắt. Khung nhỏ thì vân to. So với hạt thật để chọn cho đúng.</span>
              </label>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="min-w-0 flex-1 truncate text-ink-2">{image.name}</span>
                <label className="cursor-pointer text-wood underline-offset-4 hover:underline">
                  Chọn ảnh khác
                  <input type="file" accept={ACCEPT} className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
                </label>
              </div>
              {fileError && <p role="alert" className="text-sm text-err">{fileError}</p>}
              <Checks checks={checks} />
            </>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-line bg-paper-2">
            <Suspense fallback={<p className="flex size-full items-center justify-center text-sm text-ink-3">Đang dựng hạt 3D…</p>}>
              <BeadPreview source={version ? output.current : null} version={version} sizeMm={sizeMm} roughness={roughness} finish={row.finish} />
            </Suspense>
            <p className="pointer-events-none absolute top-2 left-2 rounded-full bg-surface/90 px-3 py-1 text-xs shadow-e1">
              {image ? "Xem trước ảnh mới" : row.texture ? "Ảnh đang dùng" : "Chưa có ảnh"} · kéo để xoay
            </p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Cỡ hạt xem trước">
            {SIZES.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={sizeMm === s}
                onClick={() => setSizeMm(s)}
                className="min-h-9 rounded-sm border border-line-strong px-3 text-sm tabular-nums transition-colors duration-(--d-fast) hover:border-wood aria-pressed:border-wood aria-pressed:bg-wood-soft aria-pressed:text-wood"
              >
                {s} mm
              </button>
            ))}
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="flex justify-between font-medium">
              Độ bóng mặt hạt <span className="font-normal text-ink-3">{roughness < 0.3 ? "Bóng" : roughness < 0.6 ? "Bóng nhẹ" : "Mờ"}</span>
            </span>
            <input type="range" min={0.05} max={0.95} step={0.05} value={1 - roughness} onChange={(e) => setRoughness(Math.round((1 - Number(e.target.value)) * 100) / 100)} className="accent-(--wood)" />
            <span className="text-ink-3">Hạt trầm đánh bóng thì kéo sang phải, hạt để mộc thì kéo sang trái.</span>
          </label>
        </div>
      </div>
    </Modal>
  );
}

function Requirements() {
  return (
    <section aria-labelledby="yeu-cau-anh" className="flex flex-col gap-3">
      <h3 id="yeu-cau-anh" className="font-medium">Yêu cầu ảnh</h3>
      <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm text-ink-2">
        <li><b className="text-ink">Chụp mặt phẳng của miếng vật liệu</b>, không chụp hạt tròn. Mặt cong làm méo vân và có vệt sáng.</li>
        <li><b className="text-ink">Vân phủ kín khung</b>: không lọt nền, mép miếng gỗ, ngón tay hay bóng điện thoại.</li>
        <li><b className="text-ink">Ánh sáng tản và đều</b>: cạnh cửa sổ ban ngày, không flash, không nắng chiếu thẳng.</li>
        <li><b className="text-ink">Chụp thẳng góc</b>, điện thoại song song mặt gỗ, cách khoảng 15–20 cm, chạm màn hình để lấy nét.</li>
        <li><b className="text-ink">Cạnh ngắn từ {TEXTURE_SIDE} px</b>, file JPG, PNG hoặc WebP dưới {MAX_INPUT_MB} MB. Ảnh chụp điện thoại thường đã đủ.</li>
      </ol>
      <p className="text-sm text-ink-3">
        Không cần chỉnh hay kéo giãn ảnh. Hệ thống tự cắt vuông {TEXTURE_SIDE}×{TEXTURE_SIDE} px và bọc quanh hạt theo chiều lỗ xâu, giống vân thật của hạt khoan. Hai đầu lỗ bị dây che nên không lộ chỗ nối.
      </p>
      <SampleFrames />
    </section>
  );
}

// Ảnh mẫu đúng và sai vẽ bằng canvas theo màu gỗ của thương hiệu
function SampleFrames() {
  const samples = [
    { id: "dung", ok: true, label: "Đúng: vân phủ kín, sáng đều" },
    { id: "hat-tron", ok: false, label: "Sai: chụp hạt tròn" },
    { id: "lot-nen", ok: false, label: "Sai: lọt nền, mép gỗ" },
    { id: "bong-do", ok: false, label: "Sai: sáng một bên" },
  ] as const;
  return (
    <ul className="grid grid-cols-4 gap-2">
      {samples.map((s) => (
        <li key={s.id} className="flex flex-col gap-1">
          <SampleCanvas kind={s.id} />
          <span className={`text-xs leading-tight ${s.ok ? "text-ok" : "text-err"}`}>{s.label}</span>
        </li>
      ))}
    </ul>
  );
}

function SampleCanvas({ kind }: { kind: "dung" | "hat-tron" | "lot-nen" | "bong-do" }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const css = getComputedStyle(canvas);
    const tone = (name: string) => css.getPropertyValue(name).trim();
    const W = 120;
    canvas.width = W;
    canvas.height = W;
    const grainTile = () => {
      ctx.fillStyle = tone("--wood-700");
      ctx.fillRect(0, 0, W, W);
      const shades = [tone("--wood-500"), tone("--wood-800"), tone("--wood-600"), tone("--wood-900")];
      let seed = 7;
      const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 34; i++) {
        ctx.strokeStyle = shades[i % shades.length];
        ctx.globalAlpha = 0.35 + rand() * 0.45;
        ctx.lineWidth = 0.6 + rand() * 2.2;
        ctx.beginPath();
        const y = rand() * W;
        ctx.moveTo(0, y);
        for (let x = 0; x <= W; x += 8) ctx.lineTo(x, y + Math.sin(x / 14 + i) * 3);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
    if (kind === "hat-tron") {
      ctx.fillStyle = tone("--paper-2");
      ctx.fillRect(0, 0, W, W);
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, W / 2, W * 0.36, 0, Math.PI * 2);
      ctx.clip();
      grainTile();
      const g = ctx.createRadialGradient(W * 0.38, W * 0.36, 2, W / 2, W / 2, W * 0.4);
      g.addColorStop(0, tone("--surface"));
      g.addColorStop(0.18, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, W);
      ctx.restore();
    } else if (kind === "lot-nen") {
      ctx.fillStyle = tone("--paper-2");
      ctx.fillRect(0, 0, W, W);
      ctx.save();
      ctx.translate(W * 0.18, W * 0.12);
      ctx.rotate(0.12);
      ctx.beginPath();
      ctx.rect(0, 0, W, W);
      ctx.clip();
      grainTile();
      ctx.restore();
    } else {
      grainTile();
      if (kind === "bong-do") {
        const g = ctx.createLinearGradient(0, 0, W, W);
        g.addColorStop(0, "transparent");
        g.addColorStop(1, tone("--ink"));
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, W);
        ctx.globalAlpha = 1;
      }
    }
  }, [kind]);
  return <canvas ref={ref} aria-hidden className="aspect-square w-full rounded-xl border border-line" />;
}

function FilePicker({ onPick, error }: { onPick(file: File | undefined): void; error: string | null }) {
  const [over, setOver] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <label
        onDragOver={(e) => (e.preventDefault(), setOver(true))}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => (e.preventDefault(), setOver(false), onPick(e.dataTransfer.files[0]))}
        className={`flex min-h-36 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed p-4 text-center transition-colors duration-(--d-fast) has-focus-visible:outline-2 has-focus-visible:outline-wood ${over ? "border-wood bg-wood-soft" : "border-line-strong hover:border-wood"}`}
      >
        <span className="font-medium">Chọn ảnh vân hoặc kéo ảnh vào đây</span>
        <span className="text-sm text-ink-3">JPG, PNG, WebP · cạnh ngắn từ {TEXTURE_SIDE} px</span>
        <input type="file" accept={ACCEPT} className="sr-only" onChange={(e) => onPick(e.target.files?.[0])} />
      </label>
      {error && <p role="alert" className="text-sm text-err">{error}</p>}
    </div>
  );
}

// Ảnh gốc với khung cắt vuông kéo được; ngoài khung bị phủ tối để thấy rõ phần sẽ dùng
function CropStage({ bitmap, crop, onChange }: { bitmap: ImageBitmap; crop: Crop; onChange(c: Crop): void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = canvas.current!;
    const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
    c.width = Math.round(bitmap.width * scale);
    c.height = Math.round(bitmap.height * scale);
    c.getContext("2d")!.drawImage(bitmap, 0, 0, c.width, c.height);
  }, [bitmap]);

  function startDrag(event: React.PointerEvent) {
    event.preventDefault();
    const el = event.currentTarget as HTMLElement;
    el.setPointerCapture(event.pointerId);
    const start = { x: event.clientX, y: event.clientY, crop };
    const ratio = bitmap.width / stage.current!.getBoundingClientRect().width;
    const move = (e: PointerEvent) => onChange({ ...start.crop, x: start.crop.x + (e.clientX - start.x) * ratio, y: start.crop.y + (e.clientY - start.y) * ratio });
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  }

  function onKey(event: React.KeyboardEvent) {
    const step = (event.shiftKey ? 0.1 : 0.02) * crop.side;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const m = moves[event.key];
    if (!m) return;
    event.preventDefault();
    onChange({ ...crop, x: crop.x + m[0], y: crop.y + m[1] });
  }

  const pct = (v: number, total: number) => `${(v / total) * 100}%`;
  return (
    <div ref={stage} className="relative w-full overflow-hidden rounded-2xl border border-line bg-paper-2 select-none" style={{ aspectRatio: `${bitmap.width} / ${bitmap.height}` }}>
      <canvas ref={canvas} aria-hidden className="block size-full" />
      <div
        role="slider"
        tabIndex={0}
        aria-label="Khung cắt ảnh vân, dùng phím mũi tên để dời"
        aria-valuetext={`Khung ${Math.round(crop.side)} px`}
        onPointerDown={startDrag}
        onKeyDown={onKey}
        className="absolute cursor-move touch-none shadow-[0_0_0_9999px_var(--scrim)] outline-2 outline-on-wood focus-visible:outline-wood"
        style={{ left: pct(crop.x, bitmap.width), top: pct(crop.y, bitmap.height), width: pct(crop.side, bitmap.width), height: pct(crop.side, bitmap.height) }}
      >
        {/* Lưới chia ba để căn vân và soi mép */}
        <span aria-hidden className="absolute inset-y-0 left-1/3 w-px bg-on-wood/60" />
        <span aria-hidden className="absolute inset-y-0 left-2/3 w-px bg-on-wood/60" />
        <span aria-hidden className="absolute inset-x-0 top-1/3 h-px bg-on-wood/60" />
        <span aria-hidden className="absolute inset-x-0 top-2/3 h-px bg-on-wood/60" />
        <span className="absolute -top-7 left-0 rounded-full bg-surface px-1.5 py-0.5 text-xs whitespace-nowrap text-ink shadow-e1">Kéo khung vào vùng vân đẹp nhất</span>
      </div>
    </div>
  );
}

function Checks({ checks }: { checks: CheckResult[] }) {
  if (!checks.length) return <p className="text-sm text-ink-3">Đang kiểm ảnh…</p>;
  const tone = { ok: "ok", warn: "warn", error: "err" } as const;
  const label = { ok: "Đạt", warn: "Nên xem lại", error: "Chưa đạt" };
  return (
    <section aria-labelledby="kiem-anh" aria-live="polite">
      <h3 id="kiem-anh" className="mb-2 font-medium">Kiểm tra ảnh</h3>
      <ul className="flex flex-col gap-2">
        {checks.map((c) => (
          <li key={c.label} className="flex items-start gap-2 text-sm">
            <Tag tone={tone[c.level]}>{label[c.level]}</Tag>
            <span><b className="font-medium">{c.label}.</b> <span className="text-ink-2">{c.detail}</span></span>
          </li>
        ))}
      </ul>
      {checks.some((c) => c.level === "error") && <p className="mt-2 text-sm text-err">Sửa các mục chưa đạt thì mới lưu được.</p>}
    </section>
  );
}
