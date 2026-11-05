import type { HomeLink, HomeSlide } from "../../lib/types";
import { ArrowDownIcon, ArrowUpIcon, TrashIcon } from "../icons";
import { IconButton } from "../ui/Button";
import { Field, Input, Textarea } from "../ui/Field";
import { ImageField } from "./ImageField";

type Errors = Record<string, string>;

// Nhãn và link của một nút. Để trống cả hai ở nút không bắt buộc thì website không hiện nút đó
export function LinkFields({ label, link, path, errors, optional, disabled, onChange }: {
  label: string;
  link: HomeLink;
  path: string;
  errors: Errors;
  optional?: boolean;
  disabled?: boolean;
  onChange(link: HomeLink): void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div data-field={`${path}.label`}>
        <Field label={`${label}: chữ trên nút`} optional={optional} error={errors[`${path}.label`]}>
          <Input value={link.label} maxLength={40} onChange={(e) => onChange({ ...link, label: e.target.value })} disabled={disabled} />
        </Field>
      </div>
      <div data-field={`${path}.href`}>
        <Field label={`${label}: link`} optional={optional} hint="Trang trong web bắt đầu bằng /, ví dụ /san-pham" error={errors[`${path}.href`]}>
          <Input value={link.href} maxLength={300} inputMode="url" onChange={(e) => onChange({ ...link, href: e.target.value })} disabled={disabled} />
        </Field>
      </div>
    </div>
  );
}

export type SlideValues = Omit<HomeSlide, "cta"> & { cta: HomeLink };

type SlideProps = {
  slide: SlideValues;
  index: number;
  count: number;
  errors: Errors;
  disabled?: boolean;
  onChange(slide: SlideValues): void;
  onMove(step: -1 | 1): void;
  onRemove(): void;
};

export function SlideFields({ slide, index, count, errors, disabled, onChange, onMove, onRemove }: SlideProps) {
  const path = `slides.${index}`;
  const set = <K extends keyof SlideValues>(key: K, value: SlideValues[K]) => onChange({ ...slide, [key]: value });
  return (
    <li className="rounded-3xl border border-line p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="font-serif text-lg font-semibold">Slide {index + 1}</h3>
        <div className="flex">
          <IconButton label={`Đưa slide ${index + 1} lên trước`} disabled={disabled || index === 0} onClick={() => onMove(-1)}><ArrowUpIcon size={18} /></IconButton>
          <IconButton label={`Đưa slide ${index + 1} xuống sau`} disabled={disabled || index === count - 1} onClick={() => onMove(1)}><ArrowDownIcon size={18} /></IconButton>
          <IconButton label={`Xoá slide ${index + 1}`} disabled={disabled || count === 1} onClick={onRemove}><TrashIcon size={18} /></IconButton>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Field label="Dòng nhỏ trên tiêu đề" optional><Input value={slide.eyebrow} maxLength={60} onChange={(e) => set("eyebrow", e.target.value)} disabled={disabled} /></Field>
          <div data-field={`${path}.title`}>
            <Field label="Tiêu đề" error={errors[`${path}.title`]}><Input value={slide.title} maxLength={90} onChange={(e) => set("title", e.target.value)} disabled={disabled} /></Field>
          </div>
          <Field label="Nội dung" optional hint="Hai, ba câu. Chỉ nêu điều shop kiểm chứng được."><Textarea value={slide.text} maxLength={240} onChange={(e) => set("text", e.target.value)} disabled={disabled} /></Field>
        </div>
        <div className="flex flex-col gap-4">
          <ImageField label="Ảnh nền" hint="Ảnh ngang, rộng từ 1200 px. Chữ nằm bên trái nên để chủ thể lệch phải." ratio="aspect-[5/2]" imageId={slide.imageId} disabled={disabled} onChange={(id) => set("imageId", id)} />
          {slide.imageId && <Field label="Mô tả ảnh" hint="Cho người dùng trình đọc màn hình. Để trống nếu ảnh chỉ để trang trí." optional><Input value={slide.imageAlt} maxLength={160} onChange={(e) => set("imageAlt", e.target.value)} disabled={disabled} /></Field>}
        </div>
      </div>
      <div className="mt-4">
        <LinkFields label="Nút" link={slide.cta} path={`${path}.cta`} errors={errors} optional disabled={disabled} onChange={(cta) => set("cta", cta)} />
      </div>
    </li>
  );
}
