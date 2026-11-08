import { useEffect, useState, type FormEvent } from "react";
import { Button } from "../components/ui/Button";
import { Field, Input, MoneyInput, Textarea } from "../components/ui/Field";
import { PageHeader, Panel } from "../components/ui/Page";
import { ErrorState, Skeleton } from "../components/ui/States";
import { showToast } from "../components/ui/Toast";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useLoad } from "../lib/use-load";
import { useSubmit } from "../lib/use-submit";

type Store = {
  name: string;
  phone: string;
  email: string;
  address: string;
  openingHours?: string;
  shopeeUrl?: string;
  tiktokUrl?: string;
  facebookUrl?: string;
  zaloUrl?: string;
  youtubeUrl?: string;
  shipping: { flatFeeVnd: number; freeFromVnd: number | null; eta: string };
  returnPolicy: string;
  bank?: { bankName: string; accountNumber: string; accountName: string };
};

type TextKey = "name" | "phone" | "email" | "address" | "openingHours" | "facebookUrl" | "zaloUrl" | "youtubeUrl" | "tiktokUrl" | "shopeeUrl" | "returnPolicy";
type Values = Record<TextKey, string> & {
  flatFeeVnd: number | null;
  freeFromVnd: number | null;
  eta: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
};

function toValues(s: Store): Values {
  return {
    name: s.name,
    phone: s.phone,
    email: s.email,
    address: s.address,
    openingHours: s.openingHours ?? "",
    facebookUrl: s.facebookUrl ?? "",
    zaloUrl: s.zaloUrl ?? "",
    youtubeUrl: s.youtubeUrl ?? "",
    tiktokUrl: s.tiktokUrl ?? "",
    shopeeUrl: s.shopeeUrl ?? "",
    returnPolicy: s.returnPolicy,
    flatFeeVnd: s.shipping.flatFeeVnd,
    freeFromVnd: s.shipping.freeFromVnd,
    eta: s.shipping.eta,
    bankName: s.bank?.bankName ?? "",
    accountNumber: s.bank?.accountNumber ?? "",
    accountName: s.bank?.accountName ?? "",
  };
}

function toInput(v: Values): Store {
  const hasBank = [v.bankName, v.accountNumber, v.accountName].some((x) => x.trim());
  return {
    name: v.name,
    phone: v.phone,
    email: v.email,
    address: v.address,
    openingHours: v.openingHours,
    facebookUrl: v.facebookUrl,
    zaloUrl: v.zaloUrl,
    youtubeUrl: v.youtubeUrl,
    tiktokUrl: v.tiktokUrl,
    shopeeUrl: v.shopeeUrl,
    returnPolicy: v.returnPolicy,
    shipping: { flatFeeVnd: v.flatFeeVnd ?? 0, freeFromVnd: v.freeFromVnd, eta: v.eta },
    bank: hasBank ? { bankName: v.bankName, accountNumber: v.accountNumber, accountName: v.accountName } : undefined,
  };
}

const links: { key: TextKey; label: string; placeholder: string }[] = [
  { key: "facebookUrl", label: "Facebook", placeholder: "https://www.facebook.com/tramhuonganchi" },
  { key: "zaloUrl", label: "Zalo OA", placeholder: "https://zalo.me/..." },
  { key: "youtubeUrl", label: "YouTube", placeholder: "https://www.youtube.com/@..." },
  { key: "tiktokUrl", label: "TikTok", placeholder: "https://www.tiktok.com/@tramhuonganchi" },
  { key: "shopeeUrl", label: "Gian hàng Shopee", placeholder: "https://shopee.vn/..." },
];

export function StorePage() {
  const { isOwner } = useAuth();
  const store = useLoad(() => api.get<Store>("/store"), []);
  const [values, setValues] = useState<Values | null>(null);
  const { submitting, errors, run } = useSubmit();

  useEffect(() => {
    if (store.state.status === "ready") setValues(toValues(store.state.data));
  }, [store.state]);

  if (!isOwner) return <ErrorState title="Chỉ chủ shop xem được mục này" desc="Bạn nhờ chủ shop sửa thông tin cửa hàng." />;
  if (store.state.status === "error") return <ErrorState title="Chưa tải được thông tin cửa hàng" desc={store.state.error} onRetry={store.reload} />;
  if (!values) return <Skeleton className={`h-96 ${store.slow ? "" : "invisible"}`} />;

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues({ ...values, [key]: value });
  const text = (key: TextKey | "eta" | "bankName" | "accountNumber" | "accountName") => ({
    value: values[key],
    onChange: (e: { target: { value: string } }) => set(key, e.target.value),
    disabled: submitting,
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      const saved = await api.put<Store>("/store", toInput(values!));
      setValues(toValues(saved));
      showToast("Đã lưu thông tin cửa hàng.", { desc: "Website cập nhật trong khoảng một phút." });
    }, "Chưa lưu được thông tin cửa hàng");
  }

  return (
    <form onSubmit={submit}>
      <PageHeader
        title="Thông tin cửa hàng"
        desc="Hiện ở chân trang, trang giới thiệu và dữ liệu gửi Google. Ghi đúng như trên Facebook, sàn và Google Business Profile."
        actions={<Button type="submit" loading={submitting}>Lưu thông tin</Button>}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Liên hệ">
          <div className="flex flex-col gap-4">
            <div data-field="name"><Field label="Tên cửa hàng" error={errors.name}><Input {...text("name")} maxLength={80} /></Field></div>
            <div data-field="phone"><Field label="Số điện thoại" hint="Số khách gọi được, ví dụ 0912 345 678." error={errors.phone}><Input {...text("phone")} inputMode="tel" maxLength={20} /></Field></div>
            <div data-field="email"><Field label="Email" error={errors.email}><Input {...text("email")} type="email" maxLength={120} /></Field></div>
            <div data-field="address"><Field label="Địa chỉ" hint="Ghi đủ thôn, xã, tỉnh." error={errors.address}><Textarea {...text("address")} maxLength={240} /></Field></div>
            <Field label="Giờ làm việc" optional><Input {...text("openingHours")} maxLength={80} placeholder="8:00–20:00 mỗi ngày" /></Field>
          </div>
        </Panel>

        <Panel title="Mạng xã hội và sàn">
          <p className="-mt-2 mb-4 text-sm text-ink-2">Google và các trợ lý AI dùng các link này để nhận ra cùng một thương hiệu. Link phải bắt đầu bằng https://</p>
          <div className="flex flex-col gap-4">
            {links.map(({ key, label, placeholder }) => (
              <div key={key} data-field={key}>
                <Field label={label} optional error={errors[key]}><Input {...text(key)} inputMode="url" placeholder={placeholder} maxLength={300} /></Field>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Giao hàng và đổi trả">
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div data-field="shipping.flatFeeVnd"><Field label="Phí giao" error={errors["shipping.flatFeeVnd"]}><MoneyInput value={values.flatFeeVnd} onChange={(v) => set("flatFeeVnd", v)} disabled={submitting} /></Field></div>
              <Field label="Miễn phí giao cho đơn từ" optional hint="Để trống nếu không miễn phí."><MoneyInput value={values.freeFromVnd} onChange={(v) => set("freeFromVnd", v)} disabled={submitting} /></Field>
            </div>
            <div data-field="shipping.eta"><Field label="Thời gian giao" error={errors["shipping.eta"]}><Input {...text("eta")} maxLength={60} placeholder="2–4 ngày làm việc" /></Field></div>
            <div data-field="returnPolicy"><Field label="Chính sách đổi trả" hint="Ghi số ngày và điều kiện đổi." error={errors.returnPolicy}><Textarea {...text("returnPolicy")} maxLength={600} /></Field></div>
          </div>
        </Panel>

        <Panel title="Tài khoản nhận chuyển khoản">
          <p className="-mt-2 mb-4 text-sm text-ink-2">Hiện cho khách chọn chuyển khoản khi đặt hàng. Để trống cả ba ô nếu chỉ nhận tiền khi giao.</p>
          <div className="flex flex-col gap-4">
            <Field label="Ngân hàng" optional><Input {...text("bankName")} maxLength={80} /></Field>
            <Field label="Số tài khoản" optional><Input {...text("accountNumber")} inputMode="numeric" maxLength={40} /></Field>
            <Field label="Chủ tài khoản" optional><Input {...text("accountName")} maxLength={80} /></Field>
          </div>
        </Panel>
      </div>
    </form>
  );
}
