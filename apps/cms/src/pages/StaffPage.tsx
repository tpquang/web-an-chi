import { useState, type FormEvent } from "react";
import { PlusIcon } from "../components/icons";
import { confirmDelete, RowActions } from "../components/RowActions";
import { Button } from "../components/ui/Button";
import { Field, Input, Switch } from "../components/ui/Field";
import { Modal } from "../components/ui/Modal";
import { DataTable, PageHeader, td, th } from "../components/ui/Page";
import { ErrorState, TableSkeleton, Tag } from "../components/ui/States";
import { showToast } from "../components/ui/Toast";
import { api } from "../lib/api";
import { useAuth, type Level, type PermissionKey, type Permissions } from "../lib/auth";
import { useLoad } from "../lib/use-load";
import { useSubmit } from "../lib/use-submit";

type Role = "OWNER" | "SALES";
type StaffRow = { id: string; email: string; name: string; role: Role; active: boolean; permissions: Permissions };
type Values = { email: string; name: string; role: Role; active: boolean; password: string; permissions: Permissions };

// Cùng thứ tự với PERMISSION_MODULES ở apps/api/src/lib/permissions.ts
const MODULES: { key: PermissionKey; label: string }[] = [
  { key: "dashboard", label: "Tổng quan" },
  { key: "orders", label: "Đơn hàng, khách hàng" },
  { key: "products", label: "Sản phẩm, danh mục, hạt" },
  { key: "inventory", label: "Kho, đóng gói, kiểm kho" },
  { key: "batches", label: "Đợt nhập hàng" },
  { key: "finance", label: "Chi phí, lợi nhuận" },
  { key: "posts", label: "Bài viết" },
  { key: "home", label: "Trang chủ" },
  { key: "inbox", label: "Hộp thư" },
];
const LEVELS: { value: Level; label: string }[] = [
  { value: "none", label: "Không" },
  { value: "view", label: "Xem" },
  { value: "edit", label: "Sửa" },
];
const SALES_DEFAULT: Permissions = { dashboard: "view", orders: "edit", products: "edit", inventory: "none", batches: "none", finance: "none", posts: "edit", home: "none", inbox: "edit" };

export function StaffPage() {
  const { staff } = useAuth();
  const { state, slow, reload } = useLoad(() => api.get<StaffRow[]>("/staff"), []);
  const [editing, setEditing] = useState<{ id: string | null; values: Values } | null>(null);
  const { submitting, errors, setErrors, run } = useSubmit();

  function open(s?: StaffRow) {
    setErrors({});
    setEditing({
      id: s?.id ?? null,
      values: s ? { ...s, password: "" } : { email: "", name: "", role: "SALES", active: true, password: "", permissions: SALES_DEFAULT },
    });
  }
  const set = <K extends keyof Values>(k: K, v: Values[K]) => setEditing((p) => p && { ...p, values: { ...p.values, [k]: v } });
  const setLevel = (key: PermissionKey, level: Level) => editing && set("permissions", { ...editing.values.permissions, [key]: level });
  const setAll = (level: Level) => set("permissions", Object.fromEntries(MODULES.map((m) => [m.key, level])) as Permissions);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    run(async () => {
      if (editing.id) await api.put(`/staff/${editing.id}`, editing.values);
      else await api.post("/staff", editing.values);
      showToast(editing.id ? "Đã lưu tài khoản." : "Đã tạo tài khoản.", { desc: editing.id ? undefined : "Gửi email và mật khẩu cho nhân viên để đăng nhập CMS." });
      setEditing(null);
      reload();
    }, "Chưa lưu được tài khoản");
  }

  const v = editing?.values;
  const summary = (p: Permissions) => {
    const edit = MODULES.filter((m) => p[m.key] === "edit").length;
    const view = MODULES.filter((m) => p[m.key] === "view").length;
    return `Sửa ${edit} mục, chỉ xem ${view} mục`;
  };

  return (
    <>
      <PageHeader
        title="Tài khoản, phân quyền"
        desc="Mỗi người một tài khoản. Quyền đặt theo từng mục: Không, Xem hoặc Sửa. Nghỉ việc thì khoá tài khoản, lịch sử vẫn giữ."
        actions={<Button onClick={() => open()}><PlusIcon size={18} /> Tạo tài khoản</Button>}
      />
      {state.status === "loading" && <div className={slow ? "" : "invisible"}><TableSkeleton rows={3} /></div>}
      {state.status === "error" && <ErrorState title="Chưa tải được tài khoản" desc={state.error} onRetry={reload} />}
      {state.status === "ready" && (
        <DataTable head={<tr><th className={th}>Tài khoản</th><th className={th}>Quyền</th><th className={th}>Trạng thái</th><th className={`${th} text-right`}>Thao tác</th></tr>}>
          {state.data.map((s) => (
            <tr key={s.id}>
              <td className={td}><button type="button" onClick={() => open(s)} className="min-h-10 text-left font-medium hover:text-wood">{s.name}<span className="block text-xs font-normal text-ink-3">{s.email}</span></button></td>
              <td className={td}>{s.role === "OWNER" ? <Tag tone="wood">Chủ shop · toàn quyền</Tag> : <span className="text-ink-2">{summary(s.permissions)}</span>}</td>
              <td className={td}>{s.active ? <Tag tone="ok">Đang dùng</Tag> : <Tag>Đã khoá</Tag>}</td>
              <td className={td}>
                {/* Không tự xoá tài khoản đang đăng nhập, để luôn còn một chủ shop */}
                <RowActions
                  name={s.name}
                  onEdit={() => open(s)}
                  onDelete={
                    s.id === staff?.id
                      ? undefined
                      : async () => {
                          const desc = `Xoá hẳn tài khoản "${s.name}" (${s.email}). Người này không đăng nhập CMS được nữa. Hội thoại họ phụ trách vẫn giữ. Chỉ tạm nghỉ thì nên khoá tài khoản.`;
                          if (await confirmDelete({ what: "tài khoản", name: s.name, desc, path: `/staff/${s.id}` })) reload();
                        }
                  }
                />
              </td>
            </tr>
          ))}
        </DataTable>
      )}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        locked={submitting}
        wide
        title={editing?.id ? "Sửa tài khoản" : "Tạo tài khoản"}
        footer={<><Button variant="secondary" onClick={() => setEditing(null)} disabled={submitting}>Huỷ</Button><Button type="submit" form="staff-form" loading={submitting}>Lưu</Button></>}
      >
        {v && (
          <form id="staff-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tên hiển thị" hint="Khách thấy tên này trong khung chat." error={errors.name}><Input value={v.name} onChange={(e) => set("name", e.target.value)} disabled={submitting} /></Field>
              <Field label="Email đăng nhập" error={errors.email}><Input type="email" value={v.email} onChange={(e) => set("email", e.target.value)} disabled={submitting} /></Field>
            </div>
            <Field label={editing?.id ? "Mật khẩu mới" : "Mật khẩu"} optional={Boolean(editing?.id)} hint={editing?.id ? "Để trống nếu không đổi." : "Ít nhất 8 ký tự."} error={errors.password}>
              <Input type="password" autoComplete="new-password" value={v.password} onChange={(e) => set("password", e.target.value)} disabled={submitting} />
            </Field>
            <Switch checked={v.role === "OWNER"} onChange={(x) => set("role", x ? "OWNER" : "SALES")} label="Chủ shop: toàn quyền, kể cả quản lý tài khoản" disabled={submitting} />
            {v.role !== "OWNER" && (
              <fieldset className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <legend className="text-sm font-medium">Ma trận quyền</legend>
                  <div className="flex gap-1 text-xs">
                    {LEVELS.map((l) => (
                      <button key={l.value} type="button" onClick={() => setAll(l.value)} disabled={submitting} className="min-h-9 rounded-md px-2 text-ink-2 hover:bg-paper-2 hover:text-wood">
                        Tất cả: {l.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto rounded-lg border border-line">
                  <table className="w-full text-sm">
                    <thead className="bg-paper-2 text-xs text-ink-3">
                      <tr>
                        <th className="p-2 text-left font-semibold">Mục</th>
                        {LEVELS.map((l) => <th key={l.value} className="w-20 p-2 text-center font-semibold">{l.label}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {MODULES.map((m) => (
                        <tr key={m.key}>
                          <td className="p-2">{m.label}</td>
                          {LEVELS.map((l) => (
                            <td key={l.value} className="p-0 text-center">
                              <label className="inline-flex min-h-10 w-full cursor-pointer items-center justify-center">
                                <input
                                  type="radio"
                                  name={`perm-${m.key}`}
                                  checked={v.permissions[m.key] === l.value}
                                  onChange={() => setLevel(m.key, l.value)}
                                  disabled={submitting}
                                  aria-label={`${m.label}: ${l.label}`}
                                  className="size-4 accent-wood"
                                />
                              </label>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-ink-3">Xem: mở được trang, không sửa được. Sửa: thêm, sửa, xoá. Quản lý tài khoản chỉ dành cho chủ shop.</p>
              </fieldset>
            )}
            <Switch checked={v.active} onChange={(x) => set("active", x)} label="Cho phép đăng nhập" disabled={submitting} />
          </form>
        )}
      </Modal>
    </>
  );
}
