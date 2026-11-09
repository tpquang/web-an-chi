import type { Block, Heading } from "@/lib/content";

export function PostBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="max-w-[68ch] leading-[1.75]">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "h2":
            return (
              <h2 key={index} id={block.id} className="mt-10 mb-4 scroll-mt-24 font-serif text-[32px] leading-[1.15]">
                {block.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={index} id={block.id} className="mt-8 mb-3 scroll-mt-24 font-serif text-2xl leading-tight">
                {block.text}
              </h3>
            );
          case "img":
            return (
              <figure key={index} className="my-8">
                {/* Ảnh trong bài có kích thước tuỳ ý nên dùng img thường, tải lười */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={block.src} alt={block.alt} loading="lazy" decoding="async" className="h-auto w-full rounded-2xl" />
                {block.caption && <figcaption className="mt-2 text-sm text-ink-3">{block.caption}</figcaption>}
              </figure>
            );
          case "ul":
            return (
              <ul key={index} className="mb-4 list-disc space-y-1 pl-5">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          default:
            return (
              <p key={index} className="mb-4">
                {block.text}
              </p>
            );
        }
      })}
    </div>
  );
}

export function TableOfContents({ blocks }: { blocks: Block[] }) {
  const headings = blocks.filter((block): block is Heading => block.type === "h2");
  if (headings.length < 2) return null;
  return (
    <nav aria-labelledby="muc-luc" className="rounded-3xl border border-edge bg-surface p-5">
      <p id="muc-luc" className="font-serif text-xl">
        Mục lục
      </p>
      <ol className="mt-2 list-decimal pl-5 text-sm">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a href={`#${heading.id}`} className="inline-flex min-h-11 items-center hover:text-wood">
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
