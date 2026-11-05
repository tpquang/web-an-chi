import type { ReactNode } from "react";

export function EmptyState({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-line p-6">
      <p className="font-medium">{title}</p>
      {desc && <p className="text-ink-2">{desc}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ title, desc, onRetry }: { title: string; desc?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl bg-err-soft p-6">
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

export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`block animate-pulse rounded-xl bg-paper-2 motion-reduce:animate-none ${className}`} />;
}

export function Alert({ tone = "info", children }: { tone?: "info" | "warn" | "ok"; children: ReactNode }) {
  const cls = { info: "bg-info-soft", warn: "bg-warn-soft", ok: "bg-ok-soft" }[tone];
  return <div className={`rounded-2xl p-4 text-sm ${cls}`}>{children}</div>;
}
