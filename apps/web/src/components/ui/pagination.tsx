import Link from "next/link";

type Props = { page: number; totalPages: number; hrefFor: (page: number) => string; label: string };

// Link thật để Google đi được hết các trang
export function Pagination({ page, totalPages, hrefFor, label }: Props) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );
  const item = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-3";

  return (
    <nav aria-label={label} className="mt-10">
      <ul className="flex flex-wrap items-center gap-1">
        {page > 1 && (
          <li>
            <Link href={hrefFor(page - 1)} className={`${item} hover:bg-paper-2`}>
              Trang trước
            </Link>
          </li>
        )}
        {pages.map((p, index) => (
          <li key={p} className="flex items-center gap-1">
            {index > 0 && p - pages[index - 1] > 1 && <span aria-hidden className="px-1 text-ink-3">…</span>}
            {p === page ? (
              <span aria-current="page" className={`${item} bg-wood font-medium text-on-wood`}>
                {p}
              </span>
            ) : (
              <Link href={hrefFor(p)} className={`${item} hover:bg-paper-2`} aria-label={`Trang ${p}`}>
                {p}
              </Link>
            )}
          </li>
        ))}
        {page < totalPages && (
          <li>
            <Link href={hrefFor(page + 1)} className={`${item} hover:bg-paper-2`}>
              Trang sau
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
