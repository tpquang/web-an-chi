import { cloneElement, forwardRef, useId, type InputHTMLAttributes, type ReactElement, type ReactNode, type TextareaHTMLAttributes } from "react";

type FieldProps = {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  optional?: boolean;
  children: ReactElement<{ id?: string; "aria-describedby"?: string; "aria-invalid"?: boolean }>;
};

// Tự nối id, aria-describedby, aria-invalid cho ô bên trong
export function Field({ label, hint, error, optional, children }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {optional && <span className="font-normal text-ink-3"> (không bắt buộc)</span>}
      </label>
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

const control =
  "w-full rounded-md border border-line-strong bg-surface px-3 text-base text-ink transition-shadow duration-(--d-fast) placeholder:text-ink-3 focus:border-wood focus:shadow-[0_0_0_3px_var(--wood-soft)] focus:outline-none disabled:bg-paper-2 aria-invalid:border-err read-only:bg-paper-2";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className = "", ...props },
  ref,
) {
  return <input ref={ref} className={`${control} h-11 ${className}`} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className = "", ...props },
  ref,
) {
  return <textarea ref={ref} className={`${control} min-h-24 py-2.5 ${className}`} {...props} />;
});

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & { label: ReactNode };

export function Checkbox({ label, className = "", ...props }: CheckboxProps) {
  return (
    <label className={`flex min-h-11 cursor-pointer items-start gap-2 py-3 text-sm ${className}`}>
      <input type="checkbox" className="m-0 mt-0.5 size-4.5 flex-none accent-wood" {...props} />
      <span>{label}</span>
    </label>
  );
}
