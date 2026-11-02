import Link from "next/link";
import type { PostCategory } from "@/lib/api";
import { postsHref, topicHref } from "@/lib/links";

const chip = "inline-flex min-h-11 items-center rounded-md border px-4 text-sm";

// Hàng chủ đề trên đầu danh sách bài viết; mục đang xem có aria-current
export function TopicNav({ topics, current }: { topics: PostCategory[]; current?: string }) {
  return (
    <nav aria-label="Chủ đề bài viết" className="mb-8">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link
            href={postsHref}
            aria-current={!current ? "page" : undefined}
            className={`${chip} ${!current ? "border-wood bg-wood-soft text-wood" : "border-line hover:border-wood hover:text-wood"}`}
          >
            Tất cả
          </Link>
        </li>
        {topics.map((topic) => {
          const active = topic.slug === current;
          return (
            <li key={topic.id}>
              <Link
                href={topicHref(topic.slug)}
                aria-current={active ? "page" : undefined}
                className={`${chip} ${active ? "border-wood bg-wood-soft text-wood" : "border-line hover:border-wood hover:text-wood"}`}
              >
                {topic.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
