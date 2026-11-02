import { useId } from "react";

type Option<T extends string> = { value: T; label: string; desc?: string };

type Props<T extends string> = {
  name: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  label: string;
  disabled?: boolean;
};

// Dùng radio native nên mũi tên trái phải và Space đã đúng chuẩn bàn phím
export function RadioGroup<T extends string>({ name, value, options, onChange, label, disabled }: Props<T>) {
  const labelId = useId();
  return (
    <div role="radiogroup" aria-labelledby={labelId} className="flex flex-col gap-2">
      <p id={labelId} className="text-sm font-medium">
        {label}
      </p>
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <label
            key={option.value}
            className={`flex min-h-11 cursor-pointer items-start gap-2 rounded-md border bg-surface p-3 ${checked ? "border-wood" : "border-line"} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              disabled={disabled}
              onChange={() => onChange(option.value)}
              className="m-0 mt-0.5 size-4.5 flex-none accent-wood"
            />
            <span className="flex flex-col">
              <span className="font-medium">{option.label}</span>
              {option.desc && <span className="text-sm text-ink-2">{option.desc}</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}
