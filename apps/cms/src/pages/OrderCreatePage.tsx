import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PlusIcon, TrashIcon } from "../components/icons";
import { Button, IconButton } from "../components/ui/Button";
import { Field, Input, MoneyInput, NumberInput, Textarea } from "../components/ui/Field";
import { PageHeader, Panel } from "../components/ui/Page";
import { Select } from "../components/ui/Select";
import { ErrorState, Skeleton } from "../components/ui/States";
import { showToast } from "../components/ui/Toast";
import { api } from "../lib/api";
import { dayToIso, formatVnd, todayDay } from "../lib/format";
import { options, paymentMethod, paymentStatus, salesChannel, type PaymentMethod, type PaymentStatus, type SalesChannel } from "../lib/labels";
import type { ProductRow } from "../lib/types";
import { useLoad } from "../lib/use-load";
import { useSubmit } from "../lib/use-submit";

type Line = { productId: string | null; quantity: number | null; unitPriceVnd: number | null };
type Status = "CONFIRMED" | "SHIPPING" | "COMPLETED";
const statuses: Record<Status, string> = { COMPLETED: "Hoàn tất", SHIPPING: "Đang giao", CONFIRMED: "Đã xác nhận" };

// Nhập đơn bán ngoài web: Shopee, TikTok, khách quen giới thiệu. Lưu là trừ kho, giá vốn chốt theo lúc nhập
export function OrderCreatePage() {
  const navigate = useNavigate();
  const products = useLoad(() => api.list<ProductRow & { type: string }>("/products?limit=100"), []);
  const [channel, setChannel] = useState<SalesChannel>("REFERRAL");
  const [externalCode, setExternalCode] = useState("");
  const [day, setDay] = useState(todayDay());
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [lines, setLines] = useState<Line[]>([{ productId: null, quantity: 1, unitPriceVnd: null }]);
  const [money, setMoney] = useState({ shippingVnd: 0 as number | null, shippingCostVnd: 0 as number | null, platformFeeVnd: 0 as number | null });
  const [payment, setPayment] = useState<{ method: PaymentMethod; status: PaymentStatus }>({ method: "BANK_TRANSFER", status: "PAID" });
  const [status, setStatus] = useState<Status>("COMPLETED");
  const [note, setNote] = useState("");
  const { submitting, errors, setErrors, run } = useSubmit();

  if (products.state.status === "error") return <ErrorState title="Chưa tải được sản phẩm" desc={products.state.error} onRetry={products.reload} />;
  if (products.state.status === "loading") return <Skeleton className={`h-96 ${products.slow ? "" : "invisible"}`} />;
  const list = products.state.data.data.filter((p) => p.type !== "SUPPLY");
  const byId = new Map(list.map((p) => [p.id, p]));
  const productOptions = list.map((p) => ({ value: p.id, label: `${p.name} · còn ${p.stock}`, disabled: p.stock <= 0 }));

  const setLine = (i: number, patch: Partial<Line>) => setLines((prev) => prev.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const subtotal = lines.reduce((sum, l) => sum + (l.unitPriceVnd ?? 0) * (l.quantity ?? 0), 0);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const createdAt = dayToIso(day);
    if (!createdAt) return setErrors({ createdAt: "Nhập ngày dạng ngày/tháng/năm." });
    run(async () => {
      const order = await api.post<{ id: string; code: string }>("/orders", {
        channel,
        externalCode,
        createdAt,
        customer,
        items: lines.filter((l) => l.productId).map((l) => ({ productId: l.productId, quantity: l.quantity ?? 0, unitPriceVnd: l.unitPriceVnd ?? 0 })),
        shippingVnd: money.shippingVnd ?? 0,
        shippingCostVnd: money.shippingCostVnd ?? 0,
        platformFeeVnd: money.platformFeeVnd ?? 0,
        paymentMethod: payment.method,
        paymentStatus: payment.status,
        status,
        note,
      });
      showToast(`Đã nhập đơn ${order.code}.`, { desc: "Kho đã trừ theo số lượng trong đơn." });
      navigate(`/orders/${order.id}`);
    }, "Chưa lưu được đơn");
  }

  return (
    <>
      <PageHeader title="Nhập đơn" back={{ to: "/orders", label: "Danh sách đơn hàng" }} desc="Lưu là trừ kho ngay. Vòng xâu hạt trừ thẳng hạt trong kho." />
      <form onSubmit={handleSubmit} noValidate className="grid gap-5 xl:grid-cols-12 [&>*]:min-w-0">
        <div className="flex flex-col gap-5 xl:col-span-8">
          <Panel title="Sản phẩm">
            <div className="flex flex-col gap-3" data-field="items">
              {lines.map((line, i) => (
                <div key={i} className="grid items-end gap-2 sm:grid-cols-[1fr_88px_140px_auto]">
                  <Field label={i === 0 ? "Sản phẩm" : ""} error={errors[`items.${i}.productId`]}>
                    <Select
                      ariaLabel={`Sản phẩm dòng ${i + 1}`}
                      searchable
                      value={line.productId}
                      onChange={(id) => setLine(i, { productId: id, unitPriceVnd: line.unitPriceVnd ?? byId.get(id)?.priceVnd ?? 0 })}
                      options={productOptions}
                      placeholder="Chọn sản phẩm"
                      disabled={submitting}
                    />
                  </Field>
                  <Field label={i === 0 ? "SL" : ""}><NumberInput aria-label={`Số lượng dòng ${i + 1}`} value={line.quantity} onChange={(q) => setLine(i, { quantity: q == null ? null : Math.round(q) })} decimals={0} disabled={submitting} /></Field>
                  <Field label={i === 0 ? "Đơn giá thực bán" : ""}><MoneyInput aria-label={`Đơn giá dòng ${i + 1}`} value={line.unitPriceVnd} onChange={(v) => setLine(i, { unitPriceVnd: v })} disabled={submitting} /></Field>
                  <IconButton label={`Bỏ dòng ${i + 1}`} onClick={() => setLines((prev) => prev.filter((_, j) => j !== i))} disabled={submitting || lines.length === 1}><TrashIcon size={18} /></IconButton>
                </div>
              ))}
              {errors.items && <p role="alert" className="text-sm text-err">{errors.items}</p>}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button variant="outline" size="sm" onClick={() => setLines([...lines, { productId: null, quantity: 1, unitPriceVnd: null }])} disabled={submitting}><PlusIcon size={16} /> Thêm dòng</Button>
                <p className="text-sm">Tiền hàng <span className="font-semibold tabular-nums">{formatVnd(subtotal)}</span></p>
              </div>
            </div>
          </Panel>
          <Panel title="Khách hàng">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tên khách" error={errors.customer}><Input value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} disabled={submitting} /></Field>
              <Field label="Số điện thoại" optional hint="Có số thì gộp vào hồ sơ khách."><Input value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} inputMode="tel" disabled={submitting} /></Field>
            </div>
            <div className="mt-4"><Field label="Địa chỉ" optional><Input value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} disabled={submitting} /></Field></div>
            <div className="mt-4"><Field label="Ghi chú" optional><Textarea value={note} onChange={(e) => setNote(e.target.value)} disabled={submitting} /></Field></div>
          </Panel>
        </div>
        <div className="flex flex-col gap-5 xl:col-span-4">
          <Panel title="Đơn">
            <div className="flex flex-col gap-4">
              <Field label="Kênh bán"><Select value={channel} onChange={(v) => setChannel(v as SalesChannel)} options={options(salesChannel).filter((o) => o.value !== "WEB")} disabled={submitting} /></Field>
              <Field label="Mã đơn bên sàn" optional><Input value={externalCode} onChange={(e) => setExternalCode(e.target.value)} disabled={submitting} /></Field>
              <div data-field="createdAt"><Field label="Ngày bán" hint="Dạng ngày/tháng/năm. Báo cáo tính theo ngày này." error={errors.createdAt}><Input value={day} onChange={(e) => setDay(e.target.value)} inputMode="numeric" disabled={submitting} /></Field></div>
              <Field label="Trạng thái"><Select value={status} onChange={(v) => setStatus(v as Status)} options={(Object.keys(statuses) as Status[]).map((s) => ({ value: s, label: statuses[s] }))} disabled={submitting} /></Field>
            </div>
          </Panel>
          <Panel title="Tiền">
            <div className="flex flex-col gap-4">
              <Field label="Ship thu của khách" optional><MoneyInput value={money.shippingVnd} onChange={(v) => setMoney({ ...money, shippingVnd: v })} disabled={submitting} /></Field>
              <Field label="Ship thực trả" optional><MoneyInput value={money.shippingCostVnd} onChange={(v) => setMoney({ ...money, shippingCostVnd: v })} disabled={submitting} /></Field>
              <Field label="Phí sàn, phí thanh toán" optional><MoneyInput value={money.platformFeeVnd} onChange={(v) => setMoney({ ...money, platformFeeVnd: v })} disabled={submitting} /></Field>
              <Field label="Hình thức"><Select value={payment.method} onChange={(v) => setPayment({ ...payment, method: v as PaymentMethod })} options={options(paymentMethod)} disabled={submitting} /></Field>
              <Field label="Thanh toán"><Select value={payment.status} onChange={(v) => setPayment({ ...payment, status: v as PaymentStatus })} options={options(paymentStatus)} disabled={submitting} /></Field>
              <Button type="submit" loading={submitting} block>Lưu đơn, trừ kho</Button>
            </div>
          </Panel>
        </div>
      </form>
    </>
  );
}
