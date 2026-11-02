import Link from "next/link";
import type { PostSummary } from "@/lib/api";
import { postHref } from "@/lib/links";
import { formatDate } from "@/lib/site";

export function PostCard({ post }: { post: PostSummary }) {
  return (
    <Link
      href={postHref(post.slug)}
      className="flex h-full flex-col rounded-lg border border-line bg-surface p-5 transition-colors duration-(--d-fast) hover:border-wood"
    >
      <p className="text-[13px] text-ink-3">
        {post.category.name} · <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
      </p>
      <h3 className="mt-2 font-serif text-xl leading-tight font-semibold">{post.title}</h3>
      {post.excerpt && <p className="mt-2 line-clamp-3 text-sm text-ink-2">{post.excerpt}</p>}
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
