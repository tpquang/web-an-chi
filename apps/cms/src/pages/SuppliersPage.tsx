import { useState, type FormEvent } from "react";
import { PlusIcon } from "../components/icons";
import { RowActions } from "../components/RowActions";
import { Button } from "../components/ui/Button";
import { Field, Input, Switch, Textarea } from "../components/ui/Field";
import { confirmDialog, Modal } from "../components/ui/Modal";
import { DataTable, PageHeader, td, th } from "../components/ui/Page";
import { EmptyState, ErrorState, TableSkeleton, Tag } from "../components/ui/States";
import { showToast } from "../components/ui/Toast";
import { api, errorMessage } from "../lib/api";
import { formatCode, loadSuppliers, supplierPortalUrl, type Supplier } from "../lib/suppliers";
import { useLoad } from "../lib/use-load";
import { useSubmit } from "../lib/use-submit";

type Values = { name: string; phone: string; code: string; active: boolean; note: string };

// Mã tạo ở trình duyệt để chủ shop thấy trước khi lưu. API kiểm trùng và độ dài
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const randomCode = () => Array.from(crypto.getRandomValues(new Uint32Array(10)), (n) => ALPHABET[n % ALPHABET.length]).join("");

async function copyInvite(s: { name: string; code: string }) {
  const text = `Chào ${s.name}, An Chi gửi bạn trang xem đơn đặt hàng: ${supplierPortalUrl}\nMã giới thiệu: ${formatCode(s.code)}`;
  try {
    await navigator.clipboard.writeText(text);
    showToast("Đã chép lời mời.", { desc: "Dán vào Zalo hoặc tin nhắn gửi nhà cung cấp." });
  } catch {
    showToast("Trình duyệt không cho chép", { type: "error", desc: text });
  }
}

export function SuppliersPage() {
  const { state, slow, reload } = useLoad(loadSuppliers, []);
  const [editing, setEditing] = useState<{ id: string | null; values: Values } | null>(null);
  const { submitting, errors, setErrors, run } = useSubmit();

  function open(s?: Supplier) {
    setErrors({});
    setEditing({
      id: s?.id ?? null,
      values: s ? { name: s.name, phone: s.phone ?? "", code: s.code, active: s.active, note: s.note ?? "" } : { name: "", phone: "", code: randomCode(), active: true, note: "" },
    });
  }
  const set = <K extends keyof Values>(key: K, value: Values[K]) => setEditing((prev) => prev && { ...prev, values: { ...prev.values, [key]: value } });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    run(async () => {
      const body = { ...editing.values, phone: editing.values.phone || null, note: editing.values.note || null };
      if (editing.id) await api.put(`/suppliers/${editing.id}`, body);
      else await api.post("/suppliers", body);
      showToast(editing.id ? "Đã lưu nhà cung cấp." : "Đã thêm nhà cung cấp.");
      setEditing(null);
      reload();
    }, "Chưa lưu được nhà cung cấp");
  }

  async function handleDelete(s: Supplier) {
    const desc = s._count.batches ? `${s._count.batches} đợt nhập vẫn giữ nguyên, chỉ bỏ tên nhà cung cấp. Mã giới thiệu hết dùng được.` : "Mã giới thiệu hết dùng được.";
    if (!(await confirmDialog({ title: `Xoá ${s.name}?`, desc, confirmLabel: "Xoá nhà cung cấp", danger: true }))) return;
    try {
      await api.delete(`/suppliers/${s.id}`);
      showToast("Đã xoá nhà cung cấp.");
      reload();
    } catch (err) {
      showToast("Chưa xoá được", { type: "error", desc: errorMessage(err) });
    }
  }

  const v = editing?.values;
  return (
    <>
      <PageHeader
        title="Nhà cung cấp"
        desc={
          <>
            Mỗi nhà cung cấp có một mã giới thiệu. Họ mở <b>{supplierPortalUrl}</b>, nhập mã để xem các đợt nhập shop đã đặt với họ, không cần tài khoản. Đợt còn ở
            trạng thái Dự kiến thì chưa hiện.
          </>
        }
        actions={
          <Button onClick={() => open()}>
            <PlusIcon size={18} /> Thêm nhà cung cấp
          </Button>
        }
      />
      {state.status === "loading" && (
        <div className={slow ? "" : "invisible"}>
          <TableSkeleton rows={3} />
        </div>
      )}
      {state.status === "error" && <ErrorState title="Chưa tải được nhà cung cấp" desc={state.error} onRetry={reload} />}
      {state.status === "ready" && state.data.length === 0 && (
        <EmptyState title="Chưa có nhà cung cấp nào." desc="Thêm nhà cung cấp rồi chọn họ khi tạo đợt nhập hàng." action={<Button onClick={() => open()}>Thêm nhà cung cấp</Button>} />
      )}
      {state.status === "ready" && state.data.length > 0 && (
        <DataTable
          head={
            <tr>
              <th className={th}>Nhà cung cấp</th>
              <th className={th}>Mã giới thiệu</th>
              <th className={`${th} text-right`}>Đợt nhập</th>
              <th className={th}>
                <span className="sr-only">Thao tác</span>
              </th>
            </tr>
          }
        >
          {state.data.map((s) => (
            <tr key={s.id}>
              <td className={td}>
                <span className="flex items-center gap-2 font-medium">
                  {s.name} {!s.active && <Tag>Ngừng dùng</Tag>}
                </span>
                {s.phone && <span className="block text-[13px] text-ink-3">{s.phone}</span>}
              </td>
              <td className={td}>
                <span className="font-mono tracking-wider">{formatCode(s.code)}</span>
                <Button variant="text" size="sm" className="ml-3" onClick={() => copyInvite(s)} disabled={!s.active}>
                  Chép lời mời
                </Button>
              </td>
              <td className={`${td} text-right tabular-nums`}>{s._count.batches}</td>
              <td className={td}>
                <RowActions name={s.name} onEdit={() => open(s)} onDelete={() => handleDelete(s)} />
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        locked={submitting}
        title={editing?.id ? "Sửa nhà cung cấp" : "Thêm nhà cung cấp"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={submitting}>
              Huỷ
            </Button>
            <Button type="submit" form="supplier-form" loading={submitting}>
              Lưu
            </Button>
          </>
        }
      >
        {v && (
          <form id="supplier-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <Field label="Tên nhà cung cấp" error={errors.name}>
              <Input value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="VD: Xưởng trầm Khánh Hòa" disabled={submitting} />
            </Field>
            <Field label="Số điện thoại" optional>
              <Input value={v.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" disabled={submitting} />
            </Field>
            {/* Input là con trực tiếp của Field để nhãn gắn đúng ô; nút tạo mã nằm cạnh, ngoài Field */}
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <Field label="Mã giới thiệu" hint="Nhà cung cấp dùng mã này thay mật khẩu. Đổi mã thì mã cũ hết dùng được ngay." error={errors.code}>
                  <Input
                    value={v.code}
                    onChange={(e) => set("code", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                    className="font-mono tracking-wider"
                    maxLength={32}
                    autoComplete="off"
                    spellCheck={false}
                    disabled={submitting}
                  />
                </Field>
              </div>
              <Button variant="secondary" className="mt-7" onClick={() => set("code", randomCode())} disabled={submitting}>
                Tạo mã mới
              </Button>
            </div>
            <Switch checked={v.active} onChange={(x) => set("active", x)} label="Cho xem đơn bằng mã này" disabled={submitting} />
            <Field label="Ghi chú" optional>
              <Textarea value={v.note} onChange={(e) => set("note", e.target.value)} disabled={submitting} />
            </Field>
          </form>
        )}
      </Modal>
    </>
  );
}
