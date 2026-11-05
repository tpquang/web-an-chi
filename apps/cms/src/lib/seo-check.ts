import { plain, slugify } from "./format";

// Chấm SEO bài viết kiểu Yoast, theo quy tắc trong .claude/skills/anchi-seo:
// title cả hậu tố ~65 ký tự (hậu tố " | An Chi Trầm Hương" nên phần riêng ≤ 45), description 120–158,
// đúng một H1 (tiêu đề bài), từ khoá có trong H1, title, description, slug, đoạn đầu, ảnh có alt.
export const LIMITS = { metaTitle: 45, descMin: 120, descMax: 158, minWords: 600, densityMin: 0.5, densityMax: 2.5 } as const;

export type Check = { level: "good" | "warn" | "bad"; text: string };
export type SeoInput = { title: string; slug: string; excerpt: string; content: string; metaTitle: string; metaDescription: string; focusKeyword: string; coverUrl: string; coverAlt: string };

const IMAGE_LINE = /^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)$/;

export type ContentImage = { line: number; alt: string; src: string; caption: string };

export function contentImages(content: string): ContentImage[] {
  return content.split("\n").flatMap((raw, line) => {
    const m = IMAGE_LINE.exec(raw.trim());
    return m ? [{ line, alt: m[1], src: m[2], caption: m[3] ?? "" }] : [];
  });
}

export const imageLine = (img: { alt: string; src: string; caption: string }) =>
  `![${img.alt.replace(/[[\]]/g, "")}](${img.src}${img.caption.trim() ? ` "${img.caption.replace(/"/g, "'").trim()}"` : ""})`;

function words(text: string) {
  return plain(text).split(/\s+/).filter(Boolean);
}

function countPhrase(text: string, phrase: string) {
  const hay = ` ${words(text).join(" ")} `;
  const needle = ` ${words(phrase).join(" ")} `;
  if (needle.trim() === "") return 0;
  let count = 0;
  for (let i = hay.indexOf(needle); i !== -1; i = hay.indexOf(needle, i + 1)) count++;
  return count;
}

const has = (text: string, phrase: string) => countPhrase(text, phrase) > 0;

export function analyzeSeo(input: SeoInput) {
  const checks: Check[] = [];
  const kw = input.focusKeyword.trim();
  const title = input.metaTitle.trim() || input.title.trim();
  const desc = input.metaDescription.trim() || input.excerpt.trim();
  const lines = input.content.split("\n").map((l) => l.trim());
  const body = lines.filter((l) => !IMAGE_LINE.test(l)).map((l) => l.replace(/^#{1,3}\s|^-\s/, "")).join(" ");
  const bodyWords = words(body).length;
  const firstParagraph = input.content.split(/\n{2,}/).map((p) => p.trim()).find((p) => p && !p.startsWith("#") && !IMAGE_LINE.test(p)) ?? "";
  const h1InContent = lines.filter((l) => /^#\s/.test(l)).length;
  const h2 = lines.filter((l) => /^##\s/.test(l));
  const images = contentImages(input.content);

  if (!kw) {
    checks.push({ level: "bad", text: "Chưa có từ khoá chính. Nhập cụm khách hay tìm, ví dụ “cách phân biệt trầm hương”." });
  } else {
    checks.push(has(input.title, kw) ? { level: "good", text: "Tiêu đề bài (H1) có từ khoá." } : { level: "bad", text: "Tiêu đề bài (H1) chưa có từ khoá." });
    checks.push(has(title, kw) ? { level: "good", text: "Tiêu đề trên Google có từ khoá." } : { level: "warn", text: "Tiêu đề trên Google chưa có từ khoá." });
    checks.push(has(desc, kw) ? { level: "good", text: "Mô tả có từ khoá." } : { level: "warn", text: "Mô tả trên Google chưa có từ khoá." });
    checks.push(input.slug.includes(slugify(kw)) ? { level: "good", text: "Slug có từ khoá." } : { level: "warn", text: `Slug nên chứa “${slugify(kw)}”.` });
    checks.push(has(firstParagraph, kw) ? { level: "good", text: "Đoạn mở đầu có từ khoá." } : { level: "warn", text: "Nhắc từ khoá trong đoạn mở đầu." });
    checks.push(h2.some((h) => has(h, kw)) ? { level: "good", text: "Có tiêu đề mục (H2) chứa từ khoá." } : { level: "warn", text: "Nên có ít nhất một H2 chứa từ khoá hoặc biến thể." });
    const density = bodyWords > 0 ? (countPhrase(body, kw) * words(kw).length * 100) / bodyWords : 0;
    const d = Math.round(density * 10) / 10;
    checks.push(
      density < LIMITS.densityMin ? { level: "warn", text: `Mật độ từ khoá ${d}%, hơi ít (nên ${LIMITS.densityMin}–${LIMITS.densityMax}%).` }
      : density > LIMITS.densityMax ? { level: "bad", text: `Mật độ từ khoá ${d}%, nhồi nhiều quá (nên dưới ${LIMITS.densityMax}%).` }
      : { level: "good", text: `Mật độ từ khoá ${d}%.` },
    );
  }

  const tLen = title.length;
  checks.push(
    tLen === 0 ? { level: "bad", text: "Chưa có tiêu đề." }
    : tLen > LIMITS.metaTitle ? { level: "warn", text: `Tiêu đề trên Google ${tLen} ký tự, dài hơn ${LIMITS.metaTitle} nên dễ bị cắt.` }
    : { level: "good", text: `Tiêu đề trên Google ${tLen}/${LIMITS.metaTitle} ký tự.` },
  );
  const dLen = desc.length;
  checks.push(
    dLen === 0 ? { level: "bad", text: "Chưa có mô tả trên Google (hoặc tóm tắt)." }
    : dLen < LIMITS.descMin ? { level: "warn", text: `Mô tả ${dLen} ký tự, nên ${LIMITS.descMin}–${LIMITS.descMax}.` }
    : dLen > LIMITS.descMax ? { level: "warn", text: `Mô tả ${dLen} ký tự, quá ${LIMITS.descMax} sẽ bị cắt.` }
    : { level: "good", text: `Mô tả ${dLen} ký tự.` },
  );
  checks.push(bodyWords >= LIMITS.minWords ? { level: "good", text: `Bài dài ${bodyWords} chữ.` } : { level: "warn", text: `Bài mới ${bodyWords} chữ, bài kiến thức nên từ ${LIMITS.minWords} chữ.` });
  checks.push(h2.length >= 2 ? { level: "good", text: `Có ${h2.length} tiêu đề mục H2.` } : { level: "warn", text: "Chia bài bằng ít nhất 2 tiêu đề mục H2." });
  if (h1InContent > 0) checks.push({ level: "warn", text: `Nội dung có ${h1InContent} dòng H1. Trang đã có H1 là tiêu đề bài nên web hiện các dòng này như H2.` });
  const noAlt = images.filter((i) => !i.alt.trim()).length;
  if (images.length > 0) checks.push(noAlt === 0 ? { level: "good", text: "Mọi ảnh trong bài có alt." } : { level: "bad", text: `${noAlt} ảnh trong bài chưa có alt.` });
  if (input.coverUrl) checks.push(input.coverAlt.trim() ? { level: "good", text: "Ảnh bìa có alt." } : { level: "warn", text: "Ảnh bìa chưa có alt." });

  const score = Math.round((checks.reduce((s, c) => s + (c.level === "good" ? 1 : c.level === "warn" ? 0.5 : 0), 0) / checks.length) * 100);
  return { checks, score };
}
