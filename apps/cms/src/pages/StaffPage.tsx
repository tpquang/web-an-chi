import { useState, type FormEvent } from "react";
import { PlusIcon } from "../components/icons";
import { Button } from "../components/ui/Button";
import { Field, Input, Switch } from "../components/ui/Field";
import { Modal } from "../components/ui/Modal";
import { DataTable, PageHeader, td, th } from "../components/ui/Page";
import { Select } from "../components/ui/Select";
import { ErrorState, TableSkeleton, Tag } from "../components/ui/States";
import { showToast } from "../components/ui/Toast";
import { api } from "../lib/api";
import { useLoad } from "../lib/use-load";
import { useSubmit } from "../lib/use-submit";

type Role = "OWNER" | "SALES";
type StaffRow = { id: string; email: string; name: string; role: Role; active: boolean };
type Values = { email: string; name: string; role: Role; active: boolean; password: string };

const roles: Record<Role, string> = { OWNER: "Chủ shop: toàn quyền", SALES: "Bán hàng: hộp thư, đơn, khách, sản phẩm, bài viết" };

export function StaffPage() {
  const { state, slow, reload } = useLoad(() => api.get<StaffRow[]>("/staff"), []);
  const [editing, setEditing] = useState<{ id: string | null; values: Values } | null>(null);
  const { submitting, errors, setErrors, run } = useSubmit();

  function open(s?: StaffRow) {
    setErrors({});
    setEditing({ id: s?.id ?? null, values: s ? { ...s, password: "" } : { email: "", name: "", role: "SALES", active: true, password: "" } });
  }
  const set = <K extends keyof Values>(k: K, v: Values[K]) => setEditing((p) => p && { ...p, values: { ...p.values, [k]: v } });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    run(async () => {
      if (editing.id) await api.put(`/staff/${editing.id}`, editing.values);
      else await api.post("/staff", editing.values);
      showToast(editing.id ? "Đã lưu nhân viên." : "Đã thêm nhân viên.", { desc: editing.id ? undefined : "Gửi email và mật khẩu cho nhân viên để đăng nhập CMS." });
      setEditing(null);
      reload();
    }, "Chưa lưu được nhân viên");
  }

  const v = editing?.values;
  return (
    <>
      <PageHeader title="Nhân viên" desc="Mỗi người một tài khoản để biết ai đang trả lời khách. Nghỉ việc thì khoá tài khoản, lịch sử chat vẫn giữ." actions={<Button onClick={() => open()}><PlusIcon size={18} /> Thêm nhân viên</Button>} />
      {state.status === "loading" && <div className={slow ? "" : "invisible"}><TableSkeleton rows={3} /></div>}
      {state.status === "error" && <ErrorState title="Chưa tải được nhân viên" desc={state.error} onRetry={reload} />}
      {state.status === "ready" && (
        <DataTable head={<tr><th className={th}>Nhân viên</th><th className={th}>Quyền</th><th className={th}>Trạng thái</th></tr>}>
          {state.data.map((s) => (
            <tr key={s.id}>
              <td className={td}><button type="button" onClick={() => open(s)} className="min-h-11 text-left font-medium hover:text-wood">{s.name}<span className="block text-[13px] font-normal text-ink-3">{s.email}</span></button></td>
              <td className={td}>{s.role === "OWNER" ? "Chủ shop" : "Bán hàng"}</td>
              <td className={td}>{s.active ? <Tag tone="ok">Đang làm</Tag> : <Tag>Đã khoá</Tag>}</td>
            </tr>
          ))}
        </DataTable>
      )}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        locked={submitting}
        title={editing?.id ? "Sửa nhân viên" : "Thêm nhân viên"}
        footer={<><Button variant="secondary" onClick={() => setEditing(null)} disabled={submitting}>Huỷ</Button><Button type="submit" form="staff-form" loading={submitting}>Lưu</Button></>}
      >
        {v && (
          <form id="staff-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Field label="Tên hiển thị" hint="Khách thấy tên này trong khung chat." error={errors.name}><Input value={v.name} onChange={(e) => set("name", e.target.value)} disabled={submitting} /></Field>
            <Field label="Email đăng nhập" error={errors.email}><Input type="email" value={v.email} onChange={(e) => set("email", e.target.value)} disabled={submitting} /></Field>
            <Field label={editing?.id ? "Mật khẩu mới" : "Mật khẩu"} optional={Boolean(editing?.id)} hint={editing?.id ? "Để trống nếu không đổi." : "Ít nhất 8 ký tự."} error={errors.password}>
              <Input type="password" autoComplete="new-password" value={v.password} onChange={(e) => set("password", e.target.value)} disabled={submitting} />
            </Field>
            <Field label="Quyền"><Select value={v.role} options={(Object.keys(roles) as Role[]).map((r) => ({ value: r, label: roles[r] }))} onChange={(r) => set("role", r as Role)} disabled={submitting} /></Field>
            <Switch checked={v.active} onChange={(x) => set("active", x)} label="Cho phép đăng nhập" disabled={submitting} />
          </form>
        )}
      </Modal>
    </>
  );
}
