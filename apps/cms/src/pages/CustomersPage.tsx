import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { confirmDelete, RowActions } from "../components/RowActions";
import { Button } from "../components/ui/Button";
import { Field, Input, Textarea } from "../components/ui/Field";
import { Modal } from "../components/ui/Modal";
import { DataTable, PageHeader, Pagination, Panel, td, tdMoney, th } from "../components/ui/Page";
import { EmptyState, ErrorState, Skeleton, TableSkeleton, Tag } from "../components/ui/States";
import { showToast } from "../components/ui/Toast";
import { api } from "../lib/api";
import { formatDate, formatDateTime, formatVnd } from "../lib/format";
import { orderStatus } from "../lib/labels";
import type { Customer, CustomerRow } from "../lib/types";
import { useLoad } from "../lib/use-load";
import { useQueryState } from "../lib/use-query-state";
import { useSubmit } from "../lib/use-submit";
import { SearchBox } from "./ProductsPage";

// Xoá hồ sơ: đơn cũ vẫn giữ tên, số điện thoại, địa chỉ lúc đặt để đối soát
const deleteDesc = (name: string) =>
  `Xoá hồ sơ và tài khoản đăng nhập của "${name}". Đơn hàng cũ vẫn giữ thông tin giao hàng lúc đặt. Dùng khi khách yêu cầu xoá dữ liệu cá nhân.`;

export function CustomersPage() {
  const query = useQueryState(["q"] as const);
  const { state, slow, reload } = useLoad(() => api.list<CustomerRow>(`/customers?${query.toQuery({ limit: 20 })}`), [query.toQuery()]);

  return (
    <>
      <PageHeader title="Khách hàng" desc="Khách được tạo tự động khi đặt hàng, nhận diện theo số điện thoại." />
      <div className="mb-4">
        <SearchBox label="Tìm theo tên hoặc số điện thoại" value={query.values.q} onSearch={(q) => query.set({ q })} />
      </div>
      {state.status === "loading" && <div className={slow ? "" : "invisible"}><TableSkeleton /></div>}
      {state.status === "error" && <ErrorState title="Chưa tải được khách hàng" desc={state.error} onRetry={reload} />}
      {state.status === "ready" && state.data.data.length === 0 && <EmptyState title="Không có khách khớp từ khoá." desc="Thử tìm bằng số điện thoại." />}
      {state.status === "ready" && state.data.data.length > 0 && (
        <>
          <DataTable head={<tr><th className={th}>Khách hàng</th><th className={`${th} text-right`}>Số đơn</th><th className={`${th} text-right`}>Đã mua</th><th className={th}>Đơn gần nhất</th><th className={th}>Nhận tin</th><th className={`${th} text-right`}>Thao tác</th></tr>}>
            {state.data.data.map((customer) => (
              <tr key={customer.id} className="hover:bg-paper">
                <td className={td}>
                  <Link to={`/customers/${customer.id}`} className="font-medium hover:text-wood">{customer.name}</Link>
                  <span className="block text-[13px] text-ink-3">{customer.phone}</span>
                </td>
                <td className={tdMoney}>{customer._count.orders}</td>
                <td className={tdMoney}>{formatVnd(customer.spentVnd)}</td>
                <td className={`${td} whitespace-nowrap`}>{customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "—"}</td>
                <td className={td}>{customer.marketingConsent ? <Tag tone="ok">Đồng ý</Tag> : <Tag>Không</Tag>}</td>
                <td className={td}>
                  <RowActions
                    name={customer.name}
                    editTo={`/customers/${customer.id}`}
                    onDelete={async () => {
                      if (await confirmDelete({ what: "khách hàng", name: customer.name, desc: deleteDesc(customer.name), path: `/customers/${customer.id}` })) reload();
                    }}
                  />
                </td>
              </tr>
            ))}
          </DataTable>
          <Pagination page={query.page} totalPages={state.data.meta.totalPages} onPage={(page) => query.set({ page })} />
        </>
      )}
    </>
  );
}

type Editing = { name: string; phone: string; email: string; address: string };

export function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, slow, reload } = useLoad(() => api.get<Customer>(`/customers/${id}`), [id]);
  const [editing, setEditing] = useState<Editing | null>(null);
  const { submitting, errors, run } = useSubmit();
  if (state.status === "error") return <ErrorState title="Chưa tải được khách hàng" desc={state.error} onRetry={reload} />;
  if (state.status === "loading") return <Skeleton className={`h-64 ${slow ? "" : "invisible"}`} />;
  const customer = state.data;
  const set = (key: keyof Editing, value: string) => setEditing((prev) => (prev ? { ...prev, [key]: value } : prev));

  function submit(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      await api.put(`/customers/${id}`, editing);
      showToast("Đã lưu thông tin khách.");
      setEditing(null);
      reload();
    }, "Chưa lưu được thông tin khách");
  }

  async function remove() {
    if (await confirmDelete({ what: "khách hàng", name: customer.name, desc: deleteDesc(customer.name), path: `/customers/${id}` })) navigate("/customers");
  }

  return (
    <>
      <PageHeader
        title={customer.name}
        back={{ to: "/customers", label: "Danh sách khách hàng" }}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditing({ name: customer.name, phone: customer.phone, email: customer.email ?? "", address: customer.address ?? "" })}>
              Sửa thông tin
            </Button>
            <Button variant="text" className="text-err" onClick={remove}>
              Xoá khách hàng
            </Button>
          </>
        }
      />
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        locked={submitting}
        title="Sửa thông tin khách"
        footer={<><Button variant="secondary" onClick={() => setEditing(null)} disabled={submitting}>Huỷ</Button><Button type="submit" form="customer-form" loading={submitting}>Lưu</Button></>}
      >
        {editing && (
          <form id="customer-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
            <div data-field="name"><Field label="Tên" error={errors.name}><Input value={editing.name} onChange={(e) => set("name", e.target.value)} disabled={submitting} /></Field></div>
            <div data-field="phone"><Field label="Số điện thoại" error={errors.phone}><Input value={editing.phone} inputMode="tel" onChange={(e) => set("phone", e.target.value)} disabled={submitting} /></Field></div>
            <div data-field="email"><Field label="Email" optional error={errors.email}><Input value={editing.email} type="email" onChange={(e) => set("email", e.target.value)} disabled={submitting} /></Field></div>
            <Field label="Địa chỉ" optional hint="Đơn cũ giữ địa chỉ lúc đặt, không đổi theo."><Textarea value={editing.address} onChange={(e) => set("address", e.target.value)} disabled={submitting} /></Field>
            <p className="text-sm text-ink-3">Mục nhận tin tiếp thị không sửa ở đây. Chỉ khách tự đồng ý hoặc huỷ.</p>
          </form>
        )}
      </Modal>
      <div className="grid gap-6 xl:grid-cols-12 [&>*]:min-w-0">
        <div className="xl:col-span-4">
          <Panel title="Liên hệ">
            <dl className="grid gap-y-3 text-sm">
              <div><dt className="text-ink-3">Điện thoại</dt><dd><a href={`tel:${customer.phone}`} className="hover:text-wood">{customer.phone}</a></dd></div>
              {customer.email && <div><dt className="text-ink-3">Email</dt><dd>{customer.email}</dd></div>}
              {customer.address && <div><dt className="text-ink-3">Địa chỉ gần nhất</dt><dd>{customer.address}</dd></div>}
              <div><dt className="text-ink-3">Nhận tin tiếp thị</dt><dd>{customer.marketingConsent ? "Đã đồng ý" : "Chưa đồng ý, không gửi tin"}</dd></div>
              <div><dt className="text-ink-3">Lần đầu đặt</dt><dd>{formatDate(customer.createdAt)}</dd></div>
            </dl>
          </Panel>
        </div>
        <div className="xl:col-span-8">
          <h2 className="mb-3 font-serif text-xl font-semibold">Đơn hàng ({customer.orders.length})</h2>
          <DataTable head={<tr><th className={th}>Mã đơn</th><th className={th}>Ngày đặt</th><th className={`${th} text-right`}>Tổng tiền</th><th className={th}>Trạng thái</th></tr>}>
            {customer.orders.map((order) => (
              <tr key={order.id} className="hover:bg-paper">
                <td className={td}><Link to={`/orders/${order.id}`} className="font-medium hover:text-wood">{order.code}</Link></td>
                <td className={`${td} whitespace-nowrap`}>{formatDateTime(order.createdAt)}</td>
                <td className={tdMoney}>{formatVnd(order.totalVnd)}</td>
                <td className={td}><Tag tone={orderStatus[order.status].tone}>{orderStatus[order.status].label}</Tag></td>
              </tr>
            ))}
          </DataTable>
        </div>
      </div>
    </>
  );
}
