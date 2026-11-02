import { ArrowDownIcon, ArrowUpIcon, PlusIcon, TrashIcon } from "./icons";
import { Button, IconButton } from "./ui/Button";
import { Input } from "./ui/Field";

type Column = { key: string; label: string; placeholder?: string; wide?: boolean };
type Row = Record<string, string>;

type Props = {
  rows: Row[];
  onChange: (rows: Row[]) => void;
  columns: Column[];
  addLabel: string;
  disabled?: boolean;
  max?: number;
};

// Danh sách hàng sửa tại chỗ, đổi thứ tự bằng nút lên xuống, dùng cho thông số và ảnh
export function RowsEditor({ rows, onChange, columns, addLabel, disabled, max = 20 }: Props) {
  const update = (index: number, key: string, value: string) => onChange(rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  const move = (index: number, delta: number) => {
    const next = [...rows];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, index) => (
        <div key={index} role="group" aria-label={`Dòng ${index + 1}`} className="flex flex-col gap-2 rounded-md border border-line p-3 md:flex-row md:items-center md:border-0 md:p-0">
          {columns.map((column) => (
            <Input
              key={column.key}
              aria-label={`${column.label} dòng ${index + 1}`}
              placeholder={column.placeholder ?? column.label}
              value={row[column.key] ?? ""}
              onChange={(e) => update(index, column.key, e.target.value)}
              disabled={disabled}
              className={column.wide ? "md:flex-[2]" : "md:flex-1"}
            />
          ))}
          <div className="flex flex-none">
            <IconButton label={`Đưa dòng ${index + 1} lên`} disabled={disabled || index === 0} onClick={() => move(index, -1)}>
              <ArrowUpIcon size={18} />
            </IconButton>
            <IconButton label={`Đưa dòng ${index + 1} xuống`} disabled={disabled || index === rows.length - 1} onClick={() => move(index, 1)}>
              <ArrowDownIcon size={18} />
            </IconButton>
            <IconButton label={`Xoá dòng ${index + 1}`} disabled={disabled} onClick={() => onChange(rows.filter((_, i) => i !== index))}>
              <TrashIcon size={18} />
            </IconButton>
          </div>
        </div>
      ))}
      {rows.length < max && (
        <div>
          <Button variant="outline" size="sm" disabled={disabled} onClick={() => onChange([...rows, Object.fromEntries(columns.map((c) => [c.key, ""]))])}>
            <PlusIcon size={16} /> {addLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
