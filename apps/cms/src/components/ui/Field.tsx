import {
  cloneElement,
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { formatNumber } from "../../lib/format";

type FieldProps = {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  optional?: boolean;
  counter?: { value: number; max: number };
  children: ReactElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>;
};

export function Field({ label, hint, error, optional, counter, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
          {optional && <span className="font-normal text-ink-3"> (không bắt buộc)</span>}
        </label>
        {counter && (
          <span className={`text-xs tabular-nums ${counter.value > counter.max ? "text-err" : "text-ink-3"}`}>
            {counter.value}/{counter.max}
          </span>
        )}
      </div>
      {cloneElement(children, { id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {hint && !error && (
        <p id={hintId} className="text-sm text-ink-3">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-err">
          {error}
        </p>
      )}
    </div>
  );
}

export const controlClass =
  "w-full rounded-md border border-line-strong bg-surface px-3 text-base text-ink placeholder:text-ink-3 focus:border-wood focus:shadow-[0_0_0_3px_var(--wood-soft)] focus:outline-none disabled:bg-paper-2 aria-invalid:border-err";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className = "", ...props }, ref) {
  return <input ref={ref} className={`${controlClass} h-11 ${className}`} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className = "", ...props },
  ref,
) {
  return <textarea ref={ref} className={`${controlClass} min-h-24 py-2.5 ${className}`} {...props} />;
});

type MoneyProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: number | null;
  onChange: (value: number | null) => void;
};

// Hiện phân cách hàng nghìn, trả số nguyên VND
export const MoneyInput = forwardRef<HTMLInputElement, MoneyProps>(function MoneyInput({ value, onChange, className = "", ...props }, ref) {
  return (
    <div className="relative">
      <input
        ref={ref}
        inputMode="numeric"
        value={value === null ? "" : formatNumber(value)}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "");
          onChange(digits ? Math.min(Number(digits), 2_000_000_000) : null);
        }}
        className={`${controlClass} h-11 pr-11 text-right tabular-nums ${className}`}
        {...props}
      />
      <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-3">
        ₫
      </span>
    </div>
  );
});

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & { label: ReactNode };

export function Checkbox({ label, className = "", ...props }: CheckboxProps) {
  return (
    <label className={`flex min-h-11 cursor-pointer items-center gap-2 text-sm ${className}`}>
      <input type="checkbox" className="m-0 size-4.5 flex-none accent-wood" {...props} />
      <span>{label}</span>
    </label>
  );
}

type SwitchProps = { checked: boolean; onChange: (checked: boolean) => void; label: string; disabled?: boolean };

export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-10 flex-none rounded-full transition-colors duration-(--d-fast) disabled:opacity-60 ${checked ? "bg-wood" : "bg-line-strong"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-surface shadow-e1 transition-transform duration-(--d-fast) ${checked ? "translate-x-4" : ""}`}
        />
      </button>
      <span>{label}</span>
    </label>
  );
}
