import { mediaSrc } from "../lib/media";
import { ImageUpload } from "./media/ImageUpload";
import { Button } from "./ui/Button";
import { Field, Input, Textarea } from "./ui/Field";

export type OgValues = { ogTitle: string; ogDescription: string; ogImageUrl: string };
type Fallback = { title: string; description: string; image: string | null; imageHint: string };
type Props = {
  values: OgValues;
  set<K extends keyof OgValues>(key: K, value: OgValues[K]): void;
  fallback: Fallback;
  disabled?: boolean;
};

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? "";
// Ảnh web dùng khi trang không có ảnh riêng, xem apps/web/src/lib/seo.ts
const DEFAULT_OG = `${SITE_URL}/brand/default-og.png`;

// Chữ và ảnh khi dán link lên Facebook, Zalo. Trống thì dùng tiêu đề, mô tả trên Google và ảnh dự phòng
export function OgFields({ values, set, fallback, disabled }: Props) {
  const image = values.ogImageUrl || fallback.image;
  const title = values.ogTitle || fallback.title;
  const desc = values.ogDescription || fallback.description;

  return (
    <div className="flex flex-col gap-4">
      <Field label="Tiêu đề khi chia sẻ" optional hint="Để trống thì dùng tiêu đề trên Google." counter={{ value: values.ogTitle.length, max: 60 }}>
        <Input value={values.ogTitle} onChange={(e) => set("ogTitle", e.target.value)} placeholder={fallback.title} disabled={disabled} />
      </Field>
      <Field label="Mô tả khi chia sẻ" optional hint="Để trống thì dùng mô tả trên Google." counter={{ value: values.ogDescription.length, max: 200 }}>
        <Textarea value={values.ogDescription} onChange={(e) => set("ogDescription", e.target.value)} rows={2} placeholder={fallback.description} disabled={disabled} />
      </Field>
      <Field label="Ảnh chia sẻ" optional hint={`Tỉ lệ 1200×630. ${fallback.imageHint}`}>
        <ImageUpload value={values.ogImageUrl || null} onChange={(path) => set("ogImageUrl", path)} disabled={disabled} preview={false} />
      </Field>
      {values.ogImageUrl && (
        <div>
          <Button variant="text" size="sm" onClick={() => set("ogImageUrl", "")} disabled={disabled}>Bỏ ảnh chia sẻ riêng</Button>
        </div>
      )}
      <div className="max-w-md overflow-hidden rounded-lg border border-line" aria-label="Xem trước thẻ chia sẻ">
        <img src={image ? mediaSrc(image) : DEFAULT_OG} alt="" className="aspect-[1200/630] w-full bg-paper-2 object-cover" />
        <div className="bg-paper-2 px-3 py-2">
          <p className="text-xs text-ink-3 uppercase">{SITE_URL.replace(/^https?:\/\//, "")}</p>
          <p className="truncate text-sm font-semibold">{title || "Tiêu đề"}</p>
          <p className="line-clamp-1 text-xs text-ink-2">{desc}</p>
        </div>
      </div>
    </div>
  );
}
