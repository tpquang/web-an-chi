// Nội dung bài viết lưu dạng văn bản thuần, quy ước ghi ở schema Post.
// Chuyển thành khối để render bằng React, không dùng HTML thô nên không có XSS.
export type Heading = { type: "h2" | "h3"; text: string; id: string };
export type Block =
  | Heading
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "img"; src: string; alt: string; caption: string | null };

// Ảnh một dòng riêng: ![alt](url "chú thích"). Chỉ nhận ảnh đã tải lên hoặc link http(s)
const IMAGE_LINE = /^!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]*)")?\)$/;
const safeSrc = (src: string) => /^\/api\/media\/[a-z0-9]+$/i.test(src) || /^https?:\/\//.test(src);

export function anchorId(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseContent(source: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of source.replace(/\r\n/g, "\n").split(/\n{2,}/)) {
    const lines = chunk.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    const [first] = lines;
    const image = lines.length === 1 ? IMAGE_LINE.exec(first) : null;
    if (image && safeSrc(image[2])) {
      blocks.push({ type: "img", alt: image[1].trim(), src: image[2], caption: image[3]?.trim() || null });
    } else if (first.startsWith("### ")) {
      const text = first.slice(4);
      blocks.push({ type: "h3", text, id: anchorId(text) });
    } else if (first.startsWith("## ")) {
      const text = first.slice(3);
      blocks.push({ type: "h2", text, id: anchorId(text) });
    } else if (first.startsWith("# ")) {
      // Trang đã có H1 là tiêu đề bài, mỗi trang chỉ một H1, nên "# " trong nội dung hiện như H2
      const text = first.slice(2);
      blocks.push({ type: "h2", text, id: anchorId(text) });
    } else if (lines.every((line) => line.startsWith("- "))) {
      blocks.push({ type: "ul", items: lines.map((line) => line.slice(2)) });
    } else {
      blocks.push({ type: "p", text: lines.join(" ") });
    }
  }
  return blocks;
}

export function wordCount(source: string) {
  return source.split(/\s+/).filter(Boolean).length;
}

// Văn bản nhiều đoạn của sản phẩm, danh mục: tách theo dòng trống
export function paragraphs(text: string | null | undefined) {
  return (text ?? "").split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
}
