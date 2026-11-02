import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./spinner";

const variants = {
  primary: "bg-wood text-on-wood hover:bg-wood-hover",
  outline: "border border-wood text-wood hover:bg-wood-soft",
  secondary: "bg-paper-2 text-ink hover:bg-line",
  danger: "bg-err text-surface hover:opacity-90",
  text: "text-wood underline-offset-4 hover:underline",
};

const sizes = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-11 px-5",
  lg: "min-h-13 px-6 text-lg",
};

type Common = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  block?: boolean;
  className?: string;
  children: ReactNode;
};

type AsButton = Common & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined; loading?: boolean };
type AsLink = Common & { href: string; external?: boolean; prefetch?: boolean };

export function buttonClass({ variant = "primary", size = "md", block, className = "" }: Omit<Common, "children">) {
  // Nút chữ thẳng mép với chữ xung quanh nên bỏ padding ngang của size
  const sizeClass = variant === "text" ? sizes[size].replace(/\bpx-\d+\s?/, "") : sizes[size];
  return `relative inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-(--d-fast) disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizeClass} ${block ? "w-full" : ""} ${className}`;
}

export function Button(props: AsButton | AsLink) {
  if (props.href !== undefined) {
    const { href, external, prefetch, variant, size, block, className, children } = props as AsLink;
    const cls = buttonClass({ variant, size, block, className });
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener" className={cls}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} prefetch={prefetch} className={cls}>
        {children}
      </Link>
    );
  }

  const { variant, size, block, className, children, loading, disabled, type = "button", ...rest } = props as AsButton;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass({ variant, size, block, className })}
      {...rest}
    >
      {/* Nhãn giữ nguyên chỗ để nút không đổi kích thước khi loading */}
      <span className={`inline-flex items-center gap-2 ${loading ? "invisible" : ""}`}>{children}</span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </span>
      )}
    </button>
  );
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { label: string; badge?: number; children: ReactNode };

export function IconButton({ label, badge, children, className = "", type = "button", ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={badge ? `${label}, ${badge}` : label}
      className={`relative inline-flex size-11 items-center justify-center rounded-md text-ink-2 hover:bg-paper-2 hover:text-wood disabled:opacity-60 ${className}`}
      {...rest}
    >
      {children}
      {!!badge && <Badge value={badge} />}
    </button>
  );
}

export function Badge({ value }: { value: number }) {
  return (
    <span
      aria-hidden
      className="absolute top-1 right-0.5 inline-flex min-w-4.5 items-center justify-center rounded-full bg-wood px-1 text-[11px] leading-4.5 font-semibold text-on-wood"
    >
      {value > 99 ? "99+" : value}
    </span>
  );
}
