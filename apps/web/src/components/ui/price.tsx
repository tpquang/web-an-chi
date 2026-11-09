import { formatVnd } from "@/lib/site";

type Props = { value: number; compareAt?: number | null; size?: "card" | "page" };

// Giá gốc chỉ hiện khi có thật và cao hơn giá bán
export function Price({ value, compareAt, size = "card" }: Props) {
  const showCompare = compareAt != null && compareAt > value;
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      <span className={`font-serif whitespace-nowrap ${size === "page" ? "text-[28px] leading-tight text-wood" : "text-xl"}`}>
        {formatVnd(value)}
      </span>
      {showCompare && (
        <s className="text-sm whitespace-nowrap text-ink-3">
          <span className="sr-only">Giá trước đây </span>
          {formatVnd(compareAt)}
        </s>
      )}
    </p>
  );
}
