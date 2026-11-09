import Image from "next/image";
import Link from "next/link";
import type { PostSummary } from "@/lib/api";
import { postHref } from "@/lib/links";
import { formatDate } from "@/lib/site";
import { ArrowRightIcon } from "./icons";

export function PostCard({ post }: { post: PostSummary }) {
  return (
    <Link href={postHref(post.slug)} className="group flex h-full flex-col rounded-3xl border border-edge bg-surface p-2 transition-shadow duration-(--d-base) hover:shadow-e2">
      {post.coverUrl && (
        <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-paper-2">
          {/* Ảnh bìa có thể ở bất kỳ tên miền nào nên không qua bộ tối ưu ảnh */}
          <Image src={post.coverUrl} alt="" fill unoptimized className="object-cover transition-transform duration-(--d-slow) ease-(--ease-out) group-hover:scale-[1.03] motion-reduce:transition-none" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[13px] text-ink-3">
          {post.category.name} · <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
        </p>
        <h3 className="mt-2 font-serif text-xl leading-tight group-hover:text-wood">{post.title}</h3>
        {post.excerpt && <p className="mt-2 line-clamp-3 text-sm text-ink-2">{post.excerpt}</p>}
        <span className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-medium text-wood">
          Đọc bài
          <ArrowRightIcon size={16} className="transition-transform duration-(--d-base) group-hover:translate-x-1 motion-reduce:transition-none" />
        </span>
      </div>
    </Link>
  );
}

export function PostGrid({ posts }: { posts: PostSummary[] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      {posts.map((post) => (
        <li key={post.id}>
          <PostCard post={post} />
        </li>
      ))}
    </ul>
  );
}
