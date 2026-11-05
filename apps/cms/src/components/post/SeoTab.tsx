import { mediaSrc } from "../../lib/media";
import { analyzeSeo, LIMITS, type SeoInput } from "../../lib/seo-check";
import { CheckIcon, AlertIcon, CloseIcon } from "../icons";
import { ImageUpload } from "../media/ImageUpload";
import { Button } from "../ui/Button";
import { Field, Input, Textarea } from "../ui/Field";
import { Panel } from "../ui/Page";

type Values = SeoInput & { ogTitle: string; ogDescription: string; ogImageUrl: string };
type Props = { values: Values; set: <K extends keyof Values>(key: K, value: Values[K]) => void; disabled?: boolean; siteUrl: string };

const tone = { good: "text-ok", warn: "text-warn", bad: "text-err" } as const;
const Icon = { good: CheckIcon, warn: AlertIcon, bad: CloseIcon } as const;
const word = { good: "Tốt", warn: "Nên sửa", bad: "Cần sửa" } as const;

export function SeoTab({ values, set, disabled, siteUrl }: Props) {
  const { checks, score } = analyzeSeo(values);
  const title = values.metaTitle || values.title;
  const desc = values.metaDescription || values.excerpt;
  const ogImage = values.ogImageUrl || values.coverUrl;
  const scoreTone = score >= 80 ? "text-ok" : score >= 50 ? "text-warn" : "text-err";

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px] [&>*]:min-w-0">
      <div className="flex flex-col gap-5">
        <Panel title="Từ khoá và thẻ meta">
          <div className="flex flex-col gap-4">
            <Field label="Từ khoá chính" hint="Một cụm khách hay gõ trên Google, mỗi bài một cụm khác nhau.">
              <Input value={values.focusKeyword} onChange={(e) => set("focusKeyword", e.target.value)} placeholder="VD: cách phân biệt trầm hương" disabled={disabled} />
            </Field>
            <Field label="Tiêu đề trên Google" optional hint="Để trống thì dùng tiêu đề bài. Web tự thêm “| An Chi Trầm Hương”." counter={{ value: values.metaTitle.length, max: LIMITS.metaTitle }}>
              <Input value={values.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} placeholder={values.title} disabled={disabled} />
            </Field>
            <Field label="Mô tả trên Google" optional hint={`${LIMITS.descMin}–${LIMITS.descMax} ký tự. Để trống thì dùng tóm tắt.`} counter={{ value: values.metaDescription.length, max: LIMITS.descMax }}>
              <Textarea value={values.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} rows={3} placeholder={values.excerpt} disabled={disabled} />
            </Field>
            <div className="rounded-lg border border-line bg-paper p-3" aria-label="Xem trước kết quả trên Google">
              <p className="text-xs text-ink-3">Xem trước trên Google</p>
              <p className="mt-1 truncate text-xs text-ink-2">{siteUrl}/bai-viet/{values.slug || "..."}</p>
              <p className="truncate text-base font-medium text-info">{title || "Tiêu đề bài"} | An Chi Trầm Hương</p>
              <p className="line-clamp-2 text-sm text-ink-2">{desc ? desc.slice(0, LIMITS.descMax) : "Mô tả sẽ hiện ở đây."}</p>
            </div>
          </div>
        </Panel>
        <Panel title="Chia sẻ mạng xã hội (Open Graph)">
          <div className="flex flex-col gap-4">
            <Field label="Tiêu đề khi chia sẻ" optional hint="Để trống thì dùng tiêu đề trên Google." counter={{ value: values.ogTitle.length, max: 60 }}>
              <Input value={values.ogTitle} onChange={(e) => set("ogTitle", e.target.value)} placeholder={title} disabled={disabled} />
            </Field>
            <Field label="Mô tả khi chia sẻ" optional counter={{ value: values.ogDescription.length, max: 200 }}>
              <Textarea value={values.ogDescription} onChange={(e) => set("ogDescription", e.target.value)} rows={2} placeholder={desc} disabled={disabled} />
            </Field>
            <Field label="Ảnh chia sẻ" optional hint="Tỉ lệ 1200×630. Để trống thì dùng ảnh bìa.">
              <ImageUpload value={values.ogImageUrl || null} onChange={(path) => set("ogImageUrl", path)} disabled={disabled} preview={false} />
            </Field>
            {values.ogImageUrl && <div><Button variant="text" size="sm" onClick={() => set("ogImageUrl", "")} disabled={disabled}>Bỏ ảnh chia sẻ riêng</Button></div>}
            <div className="max-w-md overflow-hidden rounded-lg border border-line" aria-label="Xem trước thẻ chia sẻ">
              {ogImage ? <img src={mediaSrc(ogImage)} alt="" className="aspect-[1200/630] w-full bg-paper-2 object-cover" /> : <div className="aspect-[1200/630] bg-paper-2" />}
              <div className="bg-paper-2 px-3 py-2">
                <p className="text-xs text-ink-3 uppercase">{siteUrl.replace(/^https?:\/\//, "")}</p>
                <p className="truncate text-sm font-semibold">{values.ogTitle || title || "Tiêu đề"}</p>
                <p className="line-clamp-1 text-xs text-ink-2">{values.ogDescription || desc}</p>
              </div>
            </div>
          </div>
        </Panel>
      </div>
      <Panel title="Kiểm tra SEO">
        <p className={`text-3xl font-semibold tabular-nums ${scoreTone}`} aria-live="polite">{score}<span className="text-base text-ink-3">/100</span></p>
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          {checks.map((c) => {
            const I = Icon[c.level];
            return (
              <li key={c.text} className="flex gap-2">
                <span className={`mt-0.5 flex-none ${tone[c.level]}`}><I size={16} /></span>
                <span><span className="sr-only">{word[c.level]}: </span>{c.text}</span>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
