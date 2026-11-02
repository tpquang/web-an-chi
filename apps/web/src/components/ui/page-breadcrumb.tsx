import Link from "next/link";
import { breadcrumbJsonLd, safeJsonLd, type Crumb } from "@/lib/seo";

// Phần hiển thị và BreadcrumbList sinh từ cùng một danh sách. Mục cuối là trang hiện tại
export function PageBreadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  const last = crumbs.length - 1;
  return (
    <nav aria-label="Đường dẫn" className="mb-4 text-sm text-ink-3">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd(crumbs)) }} />
      <ol className="flex flex-wrap items-center gap-x-2">
        {crumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center gap-x-2">
            {index === last ? (
              <span aria-current="page" className="text-ink-2">
                {crumb.name}
              </span>
            ) : (
              <>
                <Link href={crumb.href} className="inline-flex min-h-11 items-center hover:text-wood">
                  {crumb.name}
                </Link>
                <span aria-hidden>/</span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
