import { useState, type FormEvent } from "react";
import { PlusIcon, TrashIcon } from "../components/icons";
import { Button, IconButton } from "../components/ui/Button";
import { Field, Input, MoneyInput, Textarea } from "../components/ui/Field";
import { confirmDialog, Modal } from "../components/ui/Modal";
import { DataTable, PageHeader, td, tdMoney, th } from "../components/ui/Page";
import { Select } from "../components/ui/Select";
import { EmptyState, ErrorState, TableSkeleton, Tag } from "../components/ui/States";
import { showToast } from "../components/ui/Toast";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { monthOf, monthOptions, type Expense } from "../lib/finance";
import { dayToIso, formatVnd, isoToDay, todayDay } from "../lib/format";
import { useLoad } from "../lib/use-load";
import { useQueryState } from "../lib/use-query-state";
import { useSubmit } from "../lib/use-submit";

type Values = { day: string; category: string; amountVnd: number | null; note: string };
const FALLBACK_CATEGORIES = ["Khấu hao", "Mặt bằng", "Lương", "Quảng cáo", "Phí sàn", "Vận chuyển", "Bao bì ship", "Khác"];

// Chi phí phát sinh theo tháng: mặt bằng, lương, quảng cáo, khấu hao... trừ vào lợi nhuận ròng
export function ExpensesPage() {
  const { can } = useAuth();
  const editable = can("finance", "edit");
  const query = useQueryState(["month"] as const);
  const month = query.values.month || monthOf(new Date());
  const { state, slow, reload } = useLoad(
    () => fetchExpenses(month),
    [month],
  );
  const [editing, setEditing] = useState<{ id: string | null; values: Values } | null>(null);
  const { submitting, errors, setErrors, run } = useSubmit();
  const categories = state.status === "ready" ? state.data.categories : FALLBACK_CATEGORIES;

  function open(e?: Expense) {
    setErrors({});
    setEditing({
      id: e?.id ?? null,
      values: e ? { day: isoToDay(e.spentAt), category: e.category, amountVnd: e.amountVnd, note: e.note ?? "" } : { day: todayDay(), category: "", amountVnd: null, note: "" },
    });
  }
  const set = <K extends keyof Values>(k: K, v: Values[K]) => setEditing((p) => p && { ...p, values: { ...p.values, [k]: v } });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const v = editing.values;
    const spentAt = dayToIso(v.day);
    if (!spentAt) return setErrors({ spentAt: "Nhập ngày dạng ngày/tháng/năm, ví dụ 05/11/2026." });
    run(async () => {
      const body = { spentAt, category: v.category, amountVnd: v.amountVnd ?? 0, note: v.note };
      if (editing.id) await api.put(`/expenses/${editing.id}`, body);
      else await api.post("/expenses", body);
      showToast(editing.id ? "Đã lưu chi phí." : "Đã thêm chi phí.");
      setEditing(null);
      reload();
    }, "Chưa lưu được chi phí");
  }

  async function remove(e: Expense) {
    if (!(await confirmDialog({ title: `Xoá khoản ${e.category} ${formatVnd(e.amountVnd)}?`, danger: true, confirmLabel: "Xoá" }))) return;
    try {
      await api.delete(`/expenses/${e.id}`);
      showToast("Đã xoá chi phí.");
      reload();
    } catch (err) {
      showToast("Chưa xoá được", { type: "error", desc: errorMessage(err) });
    }
  }

  const v = editing?.values;
  const total = state.status === "ready" ? state.data.rows.reduce((sum, e) => sum + e.amountVnd, 0) : 0;
  return (
    <>
      <PageHeader
        title="Chi phí phát sinh"
        desc="Mặt bằng, lương, quảng cáo, khấu hao máy móc... Tính vào tháng của ngày phát sinh và trừ vào lợi nhuận ròng. Khấu hao gắn với đợt nhập thì nhập ở đợt nhập, bỏ chọn chia vào giá vốn."
        actions={editable && <Button onClick={() => open()}><PlusIcon size={18} /> Thêm chi phí</Button>}
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="w-44"><Select ariaLabel="Tháng" value={month} onChange={(m) => query.set({ month: m })} options={monthOptions()} /></div>
        {state.status === "ready" && <p className="text-sm text-ink-2">Tổng tháng: <span className="font-semibold text-ink tabular-nums">{formatVnd(total)}</span></p>}
      </div>
      {state.status === "loading" && <div className={slow ? "" : "invisible"}><TableSkeleton rows={4} /></div>}
      {state.status === "error" && <ErrorState title="Chưa tải được chi phí" desc={state.error} onRetry={reload} />}
      {state.status === "ready" && state.data.rows.length === 0 && (
        <EmptyState title="Tháng này chưa có chi phí." desc="Thêm các khoản như mặt bằng, quảng cáo, khấu hao để báo cáo lợi nhuận ròng đúng hơn." action={editable && <Button onClick={() => open()}>Thêm chi phí</Button>} />
      )}
      {state.status === "ready" && state.data.rows.length > 0 && (
        <DataTable head={<tr><th className={th}>Ngày</th><th className={th}>Nhóm</th><th className={th}>Ghi chú</th><th className={`${th} text-right`}>Số tiền</th><th className={th}><span className="sr-only">Thao tác</span></th></tr>}>
          {state.data.rows.map((e) => (
            <tr key={e.id}>
              <td className={td}>{isoToDay(e.spentAt)}</td>
              <td className={td}>
                {editable ? <button type="button" onClick={() => open(e)} className="min-h-10 text-left hover:text-wood"><Tag tone={e.category === "Khấu hao" ? "wood" : "neutral"}>{e.category}</Tag></button> : <Tag>{e.category}</Tag>}
              </td>
              <td className={`${td} text-ink-2`}>{e.note}</td>
              <td className={tdMoney}>{formatVnd(e.amountVnd)}</td>
              <td className={`${td} w-12`}>{editable && <IconButton label={`Xoá ${e.category}`} onClick={() => remove(e)}><TrashIcon size={18} /></IconButton>}</td>
            </tr>
          ))}
        </DataTable>
      )}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        locked={submitting}
        title={editing?.id ? "Sửa chi phí" : "Thêm chi phí"}
        footer={<><Button variant="secondary" onClick={() => setEditing(null)} disabled={submitting}>Huỷ</Button><Button type="submit" form="expense-form" loading={submitting}>Lưu</Button></>}
      >
        {v && (
          <form id="expense-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div data-field="spentAt"><Field label="Ngày phát sinh" hint="Dạng ngày/tháng/năm." error={errors.spentAt}><Input value={v.day} onChange={(e) => set("day", e.target.value)} inputMode="numeric" placeholder="VD: 05/11/2026" disabled={submitting} /></Field></div>
              <div data-field="amountVnd"><Field label="Số tiền" error={errors.amountVnd}><MoneyInput value={v.amountVnd} onChange={(x) => set("amountVnd", x)} disabled={submitting} /></Field></div>
            </div>
            <div data-field="category">
              <Field label="Nhóm chi phí" hint="Chọn nhóm có sẵn hoặc gõ nhóm mới." error={errors.category}>
                <Input value={v.category} onChange={(e) => set("category", e.target.value)} list="expense-categories" disabled={submitting} placeholder="VD: Khấu hao" />
              </Field>
              <datalist id="expense-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
              <div className="mt-2 flex flex-wrap gap-1">
                {categories.map((c) => (
                  <button key={c} type="button" onClick={() => set("category", c)} disabled={submitting} className={`min-h-8 rounded-sm border px-2.5 text-xs ${v.category === c ? "border-wood bg-wood-soft text-wood" : "border-line text-ink-2 hover:border-wood"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Ghi chú" optional hint="VD: Máy khoan hạt 12 triệu, chia 24 tháng."><Textarea value={v.note} onChange={(e) => set("note", e.target.value)} disabled={submitting} /></Field>
          </form>
        )}
      </Modal>
    </>
  );
}

async function fetchExpenses(month: string) {
  const res = await api.list<Expense>(`/expenses?from=${month}&to=${month}`);
  const meta = res.meta as unknown as { categories?: string[] };
  return { rows: res.data, categories: meta.categories ?? FALLBACK_CATEGORIES };
}
