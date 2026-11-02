import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

const variants = {
  primary: "bg-wood text-on-wood hover:bg-wood-hover",
  outline: "border border-wood text-wood hover:bg-wood-soft",
  secondary: "bg-paper-2 text-ink hover:bg-line",
  danger: "bg-err text-surface hover:opacity-90",
  text: "text-wood underline-offset-4 hover:underline",
};

const sizes = { sm: "min-h-9 px-3 text-sm", md: "min-h-11 px-5", lg: "min-h-13 px-6 text-lg" };

type Common = { variant?: keyof typeof variants; size?: keyof typeof sizes; block?: boolean; className?: string; children: ReactNode };

export function buttonClass({ variant = "primary", size = "md", block, className = "" }: Omit<Common, "children">) {
  // Nút chữ thẳng mép với chữ xung quanh nên bỏ padding ngang của size
  const sizeClass = variant === "text" ? sizes[size].replace(/\bpx-\d+\s?/, "") : sizes[size];
  return `relative inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors duration-(--d-fast) disabled:cursor-not-allowed disabled:opacity-60 ${sizeClass} ${variants[variant]} ${block ? "w-full" : ""} ${className}`;
}

export function Spinner({ size = 16 }: { size?: 16 | 20 | 32 }) {
  const cls = size === 32 ? "size-8 border-3" : size === 20 ? "size-5 border-2" : "size-4 border-2";
  return (
    <span
      aria-hidden
      className={`inline-block animate-spin rounded-full border-current border-r-transparent [animation-duration:700ms] motion-reduce:[animation-duration:2s] ${cls}`}
    />
  );
}

type ButtonProps = Common & ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean };

export function Button({ variant, size, block, className, children, loading, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass({ variant, size, block, className })}
      {...rest}
    >
      <span className={`inline-flex items-center gap-2 ${loading ? "invisible" : ""}`}>{children}</span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </span>
      )}
    </button>
  );
}

export function ButtonLink({ to, children, ...style }: Common & { to: string }) {
  return (
    <Link to={to} className={buttonClass(style)}>
      {children}
    </Link>
  );
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode };

export function IconButton({ label, children, className = "", type = "button", ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex size-11 items-center justify-center rounded-md text-ink-2 hover:bg-paper-2 hover:text-wood disabled:opacity-40 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
