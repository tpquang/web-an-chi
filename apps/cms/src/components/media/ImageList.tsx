import { mediaSrc } from "../../lib/media";
import { ArrowDownIcon, ArrowUpIcon, TrashIcon } from "../icons";
import { IconButton } from "../ui/Button";
import { Field, Input } from "../ui/Field";
import { ImageUpload } from "./ImageUpload";

type Img = { url: string; alt: string };

// Ảnh sản phẩm: tải lên (nén WebP tuỳ chọn), sửa alt, đổi thứ tự. Ảnh đầu là ảnh đại diện
export function ImageList({ images, onChange, disabled, max = 12 }: { images: Img[]; onChange: (images: Img[]) => void; disabled?: boolean; max?: number }) {
  const move = (i: number, d: -1 | 1) => {
    const next = [...images];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-3">
      {images.map((img, i) => (
        <div key={`${img.url}-${i}`} className="grid gap-3 rounded-lg border border-line p-2 sm:grid-cols-[96px_1fr_auto]">
          <img src={mediaSrc(img.url)} alt="" className="aspect-square w-24 rounded-md bg-paper-2 object-cover" />
          <Field label={i === 0 ? "Alt ảnh đại diện" : `Alt ảnh ${i + 1}`} error={img.alt.trim() ? undefined : "Ảnh cần alt, tả đúng thứ trong ảnh."}>
            <Input value={img.alt} onChange={(e) => onChange(images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))} placeholder="VD: Vòng trầm 21 hạt 8mm trên nền gỗ" disabled={disabled} />
          </Field>
          <div className="flex items-start gap-1">
            <IconButton label={`Đưa ảnh ${i + 1} lên`} onClick={() => move(i, -1)} disabled={disabled || i === 0}><ArrowUpIcon size={18} /></IconButton>
            <IconButton label={`Đưa ảnh ${i + 1} xuống`} onClick={() => move(i, 1)} disabled={disabled || i === images.length - 1}><ArrowDownIcon size={18} /></IconButton>
            <IconButton label={`Bỏ ảnh ${i + 1}`} onClick={() => onChange(images.filter((_, j) => j !== i))} disabled={disabled}><TrashIcon size={18} /></IconButton>
          </div>
        </div>
      ))}
      {images.length < max && <ImageUpload label="Thêm ảnh" onChange={(url) => onChange([...images, { url, alt: "" }])} disabled={disabled} preview={false} />}
    </div>
  );
}
