import type { ReactNode } from "react";
import type { Tone } from "../../lib/labels";

export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`block animate-pulse rounded-md bg-paper-2 motion-reduce:animate-none ${className}`} />;
}

// Khung bảng chờ dữ liệu, cùng chiều cao hàng với bảng thật
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div aria-busy className="rounded-lg border border-line bg-surface">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-line px-3 py-4 last:border-0">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-line p-6">
      <p className="font-medium">{title}</p>
      {desc && <p className="text-ink-2">{desc}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ title, desc, onRetry }: { title: string; desc?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-lg bg-err-soft p-6">
      <p className="font-medium text-err">{title}</p>
      {desc && <p className="text-ink-2">{desc}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="min-h-11 font-medium text-wood underline-offset-4 hover:underline">
          Thử lại
        </button>
      )}
    </div>
  );
}

const tones: Record<Tone, string> = {
  neutral: "bg-paper-2 text-ink-2",
  wood: "bg-wood-soft text-wood",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  err: "bg-err-soft text-err",
  info: "bg-info-soft text-info",
};

export function Tag({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex h-5.5 items-center rounded-sm px-2 text-xs font-semibold whitespace-nowrap ${tones[tone]}`}>{children}</span>;
}
