import type { ReactNode } from "react";
import type { Crumb } from "@/lib/seo";
import { PageBreadcrumb } from "./page-breadcrumb";

// Khung 1180px và lề, chỉ viết ở đây theo anchi-ui-ux/references/layout.md
export const frameClass = "mx-auto w-full max-w-[calc(var(--page-max)+2*var(--page-gutter))] px-(--page-gutter)";

export function PageFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${frameClass} ${className}`}>{children}</div>;
}

type HeaderProps = { title: string; desc?: ReactNode; crumbs?: Crumb[]; actions?: ReactNode };

export function PageHeader({ title, desc, crumbs, actions }: HeaderProps) {
  return (
    <header className="mb-8">
      {crumbs && <PageBreadcrumb crumbs={crumbs} />}
      <h1 className="font-serif text-[clamp(32px,4vw,48px)] leading-[1.1] font-medium">{title}</h1>
      {desc && <div className="mt-3 max-w-[68ch] text-lg text-ink-2">{desc}</div>}
      {actions && <div className="mt-6 flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

type SectionProps = { title: string; id?: string; action?: ReactNode; children: ReactNode; className?: string };

export function Section({ title, id, action, children, className = "" }: SectionProps) {
  const headingId = id ?? undefined;
  return (
    <section aria-labelledby={headingId} className={`mt-16 ${className}`}>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id={headingId} className="font-serif text-[32px] leading-[1.15] font-medium">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
