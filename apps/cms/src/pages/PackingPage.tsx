import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AdjustModal } from "../components/business/AdjustModal";
import { Button } from "../components/ui/Button";
import { Field, NumberInput, Textarea } from "../components/ui/Field";
import { DataTable, PageHeader, Panel, td, tdMoney, th } from "../components/ui/Page";
import { Select } from "../components/ui/Select";
import { EmptyState, ErrorState, TableSkeleton } from "../components/ui/States";
import { showToast } from "../components/ui/Toast";
import { api } from "../lib/api";
import { formatDateTime, formatVnd } from "../lib/format";
import { formatQty, loadRecipes, type RecipeRow } from "../lib/inventory";
import { useLoad } from "../lib/use-load";
import { useSubmit } from "../lib/use-submit";

type Run = { id: string; quantity: number; unitCostVnd: number; note: string | null; createdAt: string; product: { name: string } };

export function PackingPage() {
  const recipes = useLoad(loadRecipes, []);
  const runs = useLoad(() => api.get<Run[]>("/pack-runs"), []);
  const [productId, setProductId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [adjusting, setAdjusting] = useState<RecipeRow | null>(null);
  const { submitting, errors, run } = useSubmit();

  const list = recipes.state.status === "ready" ? recipes.state.data : [];
  const recipe = list.find((r) => r.id === productId);
  const qty = quantity ?? 0;
  const over = recipe ? qty > recipe.canPack : false;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    run(async () => {
      await api.post("/pack", { productId, quantity, note: note || null });
      showToast(`Đã đóng ${qty} ${recipe?.name ?? "sản phẩm"}.`, { desc: "Kho nguyên liệu đã trừ, tồn thành phẩm trên web đã cộng." });
      setQuantity(null);
      setNote("");
      recipes.reload();
      runs.reload();
    }, "Chưa đóng gói được");
  }

  return (
    <>
      <PageHeader title="Đóng gói" desc="Chọn sản phẩm và số lượng: kho nguyên liệu trừ theo cấu thành, tồn kho thành phẩm bán trên web cộng thêm." />
      {recipes.state.status === "loading" && <div className={recipes.slow ? "" : "invisible"}><TableSkeleton rows={3} /></div>}
      {recipes.state.status === "error" && <ErrorState title="Chưa tải được công thức" desc={recipes.state.error} onRetry={recipes.reload} />}
      {recipes.state.status === "ready" && list.length === 0 && (
        <EmptyState title="Chưa có sản phẩm nào có cấu thành." desc="Mở một sản phẩm, khai báo cấu thành (VD 50 nụ + 1 hộp) rồi quay lại đây." action={<Link to="/products" className="font-medium text-wood underline-offset-4 hover:underline">Đến danh sách sản phẩm</Link>} />
      )}
      {list.length > 0 && (
        <div className="grid gap-6 xl:grid-cols-12 [&>*]:min-w-0">
          <div className="flex flex-col gap-6 xl:col-span-8">
            <DataTable head={<tr><th className={th}>Sản phẩm</th><th className={`${th} text-right`}>Đóng được thêm</th><th className={`${th} text-right`}>Tồn thành phẩm</th><th className={`${th} text-right`}>Giá vốn</th><th className={`${th} text-right`}>Giá bán</th><th className={th}><span className="sr-only">Thao tác</span></th></tr>}>
              {list.map((r) => (
                <tr key={r.id}>
                  <td className={td}>
                    <span className="font-medium">{r.name}</span>
                    <span className="block text-[13px] text-ink-3">{r.components.map((c) => `${c.quantity} ${c.material.unit} ${c.material.name}`).join(" + ")}</span>
                  </td>
                  <td className={tdMoney}>{r.canPack}</td>
                  <td className={tdMoney}>{r.stock}</td>
                  <td className={tdMoney}>{formatVnd(r.materialCostVnd)}</td>
                  <td className={tdMoney}>{formatVnd(r.priceVnd)}</td>
                  <td className={`${td} text-right whitespace-nowrap`}>
                    <Button variant="text" size="sm" onClick={() => setProductId(r.id)}>Đóng gói</Button>
                    <Button variant="text" size="sm" className="ml-4" onClick={() => setAdjusting(r)}>Hao hụt</Button>
                  </td>
                </tr>
              ))}
            </DataTable>
            <section>
              <h2 className="mb-3 font-serif text-xl font-semibold">Lần đóng gói gần đây</h2>
              {runs.state.status === "ready" && runs.state.data.length === 0 && <p className="text-sm text-ink-2">Chưa đóng gói lần nào.</p>}
              {runs.state.status === "ready" && runs.state.data.length > 0 && (
                <DataTable head={<tr><th className={th}>Thời gian</th><th className={th}>Sản phẩm</th><th className={`${th} text-right`}>Số lượng</th><th className={`${th} text-right`}>Giá vốn mỗi cái</th></tr>}>
                  {runs.state.data.map((x) => (
                    <tr key={x.id}><td className={`${td} whitespace-nowrap`}>{formatDateTime(x.createdAt)}</td><td className={td}>{x.product.name}{x.note && <span className="block text-[13px] text-ink-3">{x.note}</span>}</td><td className={tdMoney}>{x.quantity}</td><td className={tdMoney}>{formatVnd(x.unitCostVnd)}</td></tr>
                  ))}
                </DataTable>
              )}
            </section>
          </div>
          <div className="xl:col-span-4">
            <Panel title="Đóng gói thành phẩm">
              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                <Field label="Sản phẩm" error={errors.productId ? "Chọn sản phẩm." : undefined}>
                  <Select value={productId} placeholder="Chọn sản phẩm" options={list.map((r) => ({ value: r.id, label: r.name }))} onChange={setProductId} disabled={submitting} />
                </Field>
                <Field label="Số lượng đóng" hint={recipe ? `Kho đủ đóng tối đa ${recipe.canPack}.` : undefined} error={errors.quantity ?? (over ? "Vượt quá số nguyên liệu trong kho." : undefined)}>
                  <NumberInput value={quantity} onChange={(v) => setQuantity(v == null ? null : Math.round(v))} decimals={0} disabled={submitting} />
                </Field>
                {recipe && qty > 0 && (
                  <dl aria-live="polite" className="flex flex-col gap-1 rounded-xl bg-paper-2 p-3 text-sm">
                    {recipe.components.map((c) => (
                      <div key={c.material.id} className="flex justify-between gap-3">
                        <dt className="text-ink-2">{c.material.name}</dt>
                        <dd className={`tabular-nums ${c.quantity * qty > c.material.stock ? "text-err" : ""}`}>− {formatQty(c.quantity * qty, c.material.unit)} / còn {formatQty(c.material.stock, "")}</dd>
                      </div>
                    ))}
                    <div className="mt-1 flex justify-between gap-3 border-t border-line pt-2 font-medium"><dt>Giá vốn {qty} sản phẩm</dt><dd className="tabular-nums">{formatVnd(recipe.materialCostVnd * qty)}</dd></div>
                  </dl>
                )}
                <Field label="Ghi chú" optional><Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} disabled={submitting} /></Field>
                <Button type="submit" loading={submitting} disabled={!recipe || qty <= 0 || over}>Đóng gói và cộng kho</Button>
              </form>
            </Panel>
          </div>
        </div>
      )}
      <AdjustModal
        target={adjusting && { kind: "products", id: adjusting.id, name: adjusting.name, unit: "sản phẩm", stock: adjusting.stock }}
        onClose={() => setAdjusting(null)}
        onDone={recipes.reload}
      />
    </>
  );
}
