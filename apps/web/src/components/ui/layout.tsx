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

type SectionProps = { title: string; eyebrow?: string; id?: string; action?: ReactNode; children: ReactNode; className?: string };

// Dòng nhỏ trên tiêu đề, có gạch ngắn phía trước như mẫu trang chủ
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`flex items-center gap-3 text-[13px] font-medium tracking-wide text-wood ${className}`}>
      <span aria-hidden className="h-px w-6 bg-current" />
      {children}
    </p>
  );
}

export function Section({ title, eyebrow, id, action, children, className = "" }: SectionProps) {
  const headingId = id ?? undefined;
  return (
    <section aria-labelledby={headingId} className={`mt-20 lg:mt-24 ${className}`}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
          <h2 id={headingId} className="font-serif text-[clamp(28px,3.2vw,40px)] leading-[1.12] font-medium">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
