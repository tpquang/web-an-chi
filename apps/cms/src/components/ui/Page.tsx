import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function PageHeader({ title, desc, actions, back }: { title: string; desc?: ReactNode; actions?: ReactNode; back?: { to: string; label: string } }) {
  return (
    <header className="mb-6">
      {back && (
        <Link to={back.to} className="mb-2 inline-flex min-h-11 items-center text-sm text-ink-3 hover:text-wood">
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-[clamp(28px,3vw,40px)] leading-[1.1] font-medium">{title}</h1>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {desc && <div className="mt-2 text-ink-2">{desc}</div>}
    </header>
  );
}

export function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-edge bg-surface p-5 md:p-7 ${className}`}>
      {title && <h2 className="mb-4 font-serif text-xl leading-tight font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

// Bảng dữ liệu cuộn ngang trong khung riêng khi hẹp
export function DataTable({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-edge bg-surface px-2">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line text-[13px] text-ink-3">{head}</thead>
        <tbody className="[&>tr]:border-b [&>tr]:border-line [&>tr:last-child]:border-0">{children}</tbody>
      </table>
    </div>
  );
}

export const th = "p-3 font-semibold whitespace-nowrap";
export const td = "p-3 align-middle";
export const tdMoney = "p-3 text-right whitespace-nowrap tabular-nums";

type PaginationProps = { page: number; totalPages: number; onPage: (page: number) => void };

export function Pagination({ page, totalPages, onPage }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Phân trang" className="mt-4 flex items-center gap-2 text-sm">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="min-h-11 rounded-full px-3 hover:bg-paper-2 disabled:opacity-40">
        Trang trước
      </button>
      <span className="px-2 text-ink-2">
        Trang {page}/{totalPages}
      </span>
      <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="min-h-11 rounded-full px-3 hover:bg-paper-2 disabled:opacity-40">
        Trang sau
      </button>
    </nav>
  );
}
