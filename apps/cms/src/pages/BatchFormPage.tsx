import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BatchLines, BatchWriteOffs } from "../components/business/BatchLines";
import { BatchPlan } from "../components/business/BatchPlan";
import { BatchSummary } from "../components/business/BatchSummary";
import { PlusIcon, TrashIcon } from "../components/icons";
import { Button, IconButton } from "../components/ui/Button";
import { Checkbox, Field, Input, MoneyInput, NumberInput, Textarea } from "../components/ui/Field";
import { confirmDialog } from "../components/ui/Modal";
import { PageHeader, Panel } from "../components/ui/Page";
import { Select } from "../components/ui/Select";
import { ErrorState, Skeleton, Tag } from "../components/ui/States";
import { showToast } from "../components/ui/Toast";
import { api, errorMessage } from "../lib/api";
import { calcBatch, fillMax, type BatchInput } from "../lib/batch";
import { formatDate } from "../lib/format";
import { loadMaterials, loadRecipes } from "../lib/inventory";
import { batchStatus } from "../lib/labels";
import { useLoad } from "../lib/use-load";
import { useSubmit } from "../lib/use-submit";

type Saved = BatchInput & { id: string; receivedAt: string | null };

const empty: BatchInput = {
  name: "", supplier: null, orderedAt: null, status: "PLANNED", capitalVnd: null, feePct: 0, note: null,
  lines: [{ materialId: "", quantity: null, totalCostVnd: null, inputKg: null, pricePerKgVnd: null }],
  extras: [{ label: "Phí vận chuyển nhập hàng", amountVnd: 0, allocate: true, note: null }],
  writeOffs: [],
  plans: [],
};

// Ngày lưu dạng YYYY-MM-DD, hiện và nhập dạng dd/mm/yyyy
const toDisplay = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "");
const toIso = (text: string) => {
  const m = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null;
};

export function BatchFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const loaded = useLoad(() => (id ? api.get<Saved>(`/batches/${id}`) : Promise.resolve(null)), [id]);
  const materials = useLoad(loadMaterials, []);
  const recipes = useLoad(loadRecipes, []);
  const [values, setValues] = useState<BatchInput>(empty);
  const [dateText, setDateText] = useState("");
  const [includeStock, setIncludeStock] = useState(false);
  const { submitting, errors, run } = useSubmit();

  const mats = materials.state.status === "ready" ? materials.state.data : [];
  const recs = recipes.state.status === "ready" ? recipes.state.data : [];
  const result = useMemo(() => calcBatch(values, mats, recs, includeStock), [values, mats, recs, includeStock]);
  const saved = loaded.state.status === "ready" ? loaded.state.data : null;
  const locked = saved?.status === "RECEIVED";

  useEffect(() => {
    if (loaded.state.status !== "ready") return;
    const data = loaded.state.data;
    setValues(data ? { ...empty, ...data } : empty);
    setDateText(toDisplay(data?.orderedAt ?? null));
  }, [loaded.state]);

  const set = <K extends keyof BatchInput>(key: K, value: BatchInput[K]) => setValues((prev) => ({ ...prev, [key]: value }));
  const setExtra = (i: number, patch: Partial<BatchInput["extras"][number]>) =>
    setValues((prev) => ({ ...prev, extras: prev.extras.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  const busy = submitting || locked;

  function body() {
    return {
      ...values,
      orderedAt: toIso(dateText),
      status: values.status === "RECEIVED" ? "ORDERED" : values.status,
      lines: values.lines.filter((l) => l.materialId),
      writeOffs: values.writeOffs.filter((w) => w.materialId),
    };
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (dateText && !toIso(dateText)) {
      showToast("Ngày nhập chưa đúng", { type: "error", desc: "Nhập theo dạng ngày/tháng/năm, ví dụ 15/11/2026." });
      return;
    }
    run(async () => {
      if (isNew) {
        const created = await api.post<{ id: string }>("/batches", body());
        showToast("Đã lưu đợt nhập.");
        navigate(`/business/${created.id}`, { replace: true });
      } else {
        await api.put(`/batches/${id}`, body());
        showToast("Đã lưu đợt nhập.");
      }
    }, "Chưa lưu được đợt nhập");
  }

  async function handleReceive() {
    const ok = await confirmDialog({
      title: "Nhập kho đợt này",
      desc: "Nguyên liệu (đã trừ hao hụt) sẽ cộng vào kho và cập nhật giá vốn bình quân. Sau khi nhập kho, đợt này không sửa được nữa.",
      confirmLabel: "Lưu và nhập kho",
    });
    if (!ok) return;
    run(async () => {
      await api.put(`/batches/${id}`, body());
      await api.post(`/batches/${id}/receive`, {});
      showToast("Đã nhập kho.", { desc: "Giờ bạn có thể đóng gói thành phẩm." });
      loaded.reload();
      materials.reload();
    }, "Chưa nhập kho được");
  }

  async function handleDelete() {
    if (!(await confirmDialog({ title: "Xoá đợt nhập", desc: `Xoá "${values.name}"?`, confirmLabel: "Xoá đợt nhập", danger: true }))) return;
    try {
      await api.delete(`/batches/${id}`);
      showToast("Đã xoá đợt nhập.");
      navigate("/business");
    } catch (err) {
      showToast("Chưa xoá được đợt nhập", { type: "error", desc: errorMessage(err) });
    }
  }

  if (loaded.state.status === "error") return <ErrorState title="Chưa tải được đợt nhập" desc={loaded.state.error} onRetry={loaded.reload} />;
  if (loaded.state.status === "loading" || materials.state.status === "loading") return <Skeleton className={`h-96 ${loaded.slow ? "" : "invisible"}`} />;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <PageHeader
        title={isNew ? "Thêm đợt nhập" : values.name || "Đợt nhập"}
        back={{ to: "/business", label: "Danh sách đợt nhập" }}
        desc={locked ? <span className="flex flex-wrap items-center gap-2"><Tag tone="ok">Đã nhập kho {saved?.receivedAt ? formatDate(saved.receivedAt) : ""}</Tag> Chỉ xem. Tiếp theo: <Link to="/packing" className="text-wood underline-offset-4 hover:underline">đóng gói thành phẩm</Link>.</span> : undefined}
      />
      {mats.length === 0 && <p className="mb-4 text-sm">Chưa có nguyên liệu thô. <Link to="/materials" className="font-medium text-wood underline-offset-4 hover:underline">Thêm nguyên liệu</Link> trước khi tạo đợt nhập.</p>}
      <div className="grid gap-6 xl:grid-cols-12 [&>*]:min-w-0">
        <fieldset disabled={busy} className="flex min-w-0 flex-col gap-6 xl:col-span-8">
          <Panel title="Thông tin đợt">
            <div className="grid gap-4 md:grid-cols-2">
              <div data-field="name"><Field label="Tên đợt" error={errors.name}><Input value={values.name} onChange={(e) => set("name", e.target.value)} placeholder="VD: Đợt 1 bán thử" /></Field></div>
              <Field label="Nhà cung cấp" optional><Input value={values.supplier ?? ""} onChange={(e) => set("supplier", e.target.value || null)} /></Field>
              <Field label="Ngày nhập" optional hint="Dạng ngày/tháng/năm."><Input value={dateText} onChange={(e) => setDateText(e.target.value)} placeholder="VD: 15/11/2026" inputMode="numeric" /></Field>
              <Field label="Trạng thái"><Select value={values.status === "RECEIVED" ? "RECEIVED" : values.status} options={[{ value: "PLANNED", label: batchStatus.PLANNED.label }, { value: "ORDERED", label: batchStatus.ORDERED.label }, ...(locked ? [{ value: "RECEIVED", label: batchStatus.RECEIVED.label }] : [])]} onChange={(v) => set("status", v as BatchInput["status"])} disabled={busy} /></Field>
              <Field label="Vốn đang có cho đợt này" optional><MoneyInput value={values.capitalVnd} onChange={(v) => set("capitalVnd", v)} /></Field>
              <Field label="Phí bán ước tính trên doanh thu" hint="Phí sàn, phí thanh toán. Bán trực tiếp để 0."><NumberInput value={values.feePct} onChange={(v) => set("feePct", v ?? 0)} suffix="%" /></Field>
            </div>
          </Panel>
          <Panel title="Nguyên liệu nhập">
            <BatchLines lines={values.lines} costs={result.costs} materials={mats} errors={errors} disabled={busy} onChange={(lines) => set("lines", lines)} />
          </Panel>
          <Panel title="Chi phí phát sinh">
            <p className="mb-3 text-sm text-ink-2">Ship nhập, thuế: chọn Chia vào giá vốn, chia theo tỉ lệ tiền hàng. Khấu hao và chi phí khác: bỏ chọn, không vào giá vốn mà tính tỉ lệ % riêng trong báo cáo lợi nhuận.</p>
            <div className="flex flex-col gap-3">
              {values.extras.map((extra, i) => (
                <div key={i} role="group" aria-label={`Chi phí ${i + 1}`} className="flex flex-col gap-2 rounded-lg border border-line p-2">
                  <div className="grid gap-2 sm:grid-cols-[1fr_180px_44px]">
                    <Input aria-label={`Tên khoản chi ${i + 1}`} value={extra.label} onChange={(e) => setExtra(i, { label: e.target.value })} placeholder="VD: Khấu hao máy khoan" />
                    <MoneyInput aria-label={`Số tiền ${i + 1}`} value={extra.amountVnd} onChange={(v) => setExtra(i, { amountVnd: v ?? 0 })} />
                    <IconButton label={`Bỏ khoản chi ${i + 1}`} onClick={() => set("extras", values.extras.filter((_, j) => j !== i))}><TrashIcon size={18} /></IconButton>
                  </div>
                  <div className="grid items-center gap-2 sm:grid-cols-[220px_1fr]">
                    <Checkbox label="Chia vào giá vốn" checked={extra.allocate !== false} onChange={(e) => setExtra(i, { allocate: e.target.checked })} />
                    <Input aria-label={`Ghi chú khoản chi ${i + 1}`} value={extra.note ?? ""} onChange={(e) => setExtra(i, { note: e.target.value || null })} placeholder="Ghi chú, VD: chia 24 tháng" />
                  </div>
                </div>
              ))}
              <div><Button variant="outline" size="sm" onClick={() => set("extras", [...values.extras, { label: "", amountVnd: 0, allocate: true, note: null }])}><PlusIcon size={16} /> Thêm khoản chi</Button></div>
            </div>
          </Panel>
          <Panel title="Hao hụt khi nhận hàng">
            <p className="mb-3 text-sm text-ink-2">Hàng móp, vỡ, ẩm, phải tiêu huỷ. Phần này không vào kho; tiền của nó dồn vào giá vốn phần còn lại.</p>
            <BatchWriteOffs writeOffs={values.writeOffs} lines={values.lines} materials={mats} errors={errors} disabled={busy} onChange={(w) => set("writeOffs", w)} />
          </Panel>
          <Panel title="Quy đổi thành phẩm">
            <BatchPlan
              recipes={recs}
              plans={values.plans}
              result={result}
              includeStock={includeStock}
              disabled={busy}
              onChange={(plans) => set("plans", plans)}
              onIncludeStock={setIncludeStock}
              onFillMax={() => set("plans", fillMax({ ...values, plans: recs.map((r) => values.plans.find((p) => p.productId === r.id) ?? { productId: r.id, quantity: 0 }).sort((a, b) => b.quantity - a.quantity) }, mats, recs, includeStock))}
            />
          </Panel>
          <Panel title="Ghi chú"><Textarea aria-label="Ghi chú đợt nhập" value={values.note ?? ""} onChange={(e) => set("note", e.target.value || null)} placeholder="VD: báo giá, điều kiện đổi lô lỗi, thời gian giao" /></Panel>
        </fieldset>

        <div className="xl:col-span-4">
          <div className="flex flex-col gap-4 xl:sticky xl:top-8">
            <BatchSummary batch={values} result={result} />
            {!locked && (
              <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
                <Button type="submit" loading={submitting}>Lưu đợt nhập</Button>
                {!isNew && <Button variant="outline" onClick={handleReceive} disabled={submitting}>Nhập kho</Button>}
                {!isNew && <Button variant="text" onClick={handleDelete} disabled={submitting} className="text-err">Xoá đợt nhập</Button>}
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
