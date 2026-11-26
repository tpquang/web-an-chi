import { useEffect, useState, type FormEvent } from "react";
import { Button } from "../components/ui/Button";
import { Checkbox, Field, Input, MoneyInput, NumberInput, Switch, Textarea } from "../components/ui/Field";
import { Select } from "../components/ui/Select";
import { PageHeader, Panel } from "../components/ui/Page";
import { ErrorState, Skeleton } from "../components/ui/States";
import { showToast } from "../components/ui/Toast";
import { api } from "../lib/api";
import { dayToIso } from "../lib/format";
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
  preorderEnabled?: boolean;
  launchAt?: string | null;
  countdownRedirect?: boolean;
  deposit?: { enabled: boolean; percent: number; forCustom: boolean; forPreorder: boolean; forMarked: boolean; minOrderVnd: number | null };
  paymentHoldHours?: number;
};

const DEPOSIT_MIN = 30;
const DEPOSIT_MAX = 50;
const HOLD_DEFAULT = 24;
const hours = Array.from({ length: 24 }, (_, h) => ({ value: h, label: `${String(h).padStart(2, "0")}:00` }));

// Giờ mở bán lưu ISO có múi giờ +07:00. Ô nhập là ngày/tháng/năm và giờ chẵn theo giờ Việt Nam
const VN_OFFSET = 7 * 3600_000;
function splitLaunch(iso: string | null | undefined) {
  const time = iso ? Date.parse(iso) : Number.NaN;
  if (Number.isNaN(time)) return { day: "", hour: 0 };
  const vn = new Date(time + VN_OFFSET).toISOString();
  return { day: vn.slice(0, 10).split("-").reverse().join("/"), hour: Number(vn.slice(11, 13)) };
}

type TextKey = "name" | "phone" | "email" | "address" | "openingHours" | "facebookUrl" | "zaloUrl" | "youtubeUrl" | "tiktokUrl" | "shopeeUrl" | "returnPolicy";
type Values = Record<TextKey, string> & {
  flatFeeVnd: number | null;
  freeFromVnd: number | null;
  eta: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  preorderEnabled: boolean;
  launchOn: boolean;
  launchDay: string;
  launchHour: number;
  countdownRedirect: boolean;
  depositEnabled: boolean;
  depositPercent: number | null;
  depositForCustom: boolean;
  depositForPreorder: boolean;
  depositForMarked: boolean;
  depositMinOn: boolean;
  depositMinVnd: number | null;
  holdHours: number | null;
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
    preorderEnabled: s.preorderEnabled !== false,
    launchOn: Boolean(s.launchAt),
    launchDay: splitLaunch(s.launchAt).day,
    launchHour: splitLaunch(s.launchAt).hour,
    countdownRedirect: s.countdownRedirect === true,
    depositEnabled: s.deposit?.enabled === true,
    depositPercent: s.deposit?.percent ?? DEPOSIT_MIN,
    depositForCustom: s.deposit?.forCustom ?? true,
    depositForPreorder: s.deposit?.forPreorder ?? true,
    depositForMarked: s.deposit?.forMarked ?? true,
    depositMinOn: (s.deposit?.minOrderVnd ?? null) !== null,
    depositMinVnd: s.deposit?.minOrderVnd ?? 2_000_000,
    holdHours: s.paymentHoldHours ?? HOLD_DEFAULT,
  };
}

function toInput(v: Values, launchIso: string | null): Store {
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
    preorderEnabled: v.preorderEnabled,
    launchAt: v.launchOn ? launchIso : null,
    countdownRedirect: v.countdownRedirect,
    // Percent trống khi tắt cọc vẫn gửi số hợp lệ để không báo lỗi ô đang ẩn
    // Percent trống khi tắt cọc vẫn gửi số hợp lệ để không báo lỗi ô đang ẩn
    deposit: {
      enabled: v.depositEnabled,
      percent: v.depositPercent ?? DEPOSIT_MIN,
      forCustom: v.depositForCustom,
      forPreorder: v.depositForPreorder,
      forMarked: v.depositForMarked,
      minOrderVnd: v.depositMinOn ? (v.depositMinVnd ?? 0) : null,
    },
    paymentHoldHours: v.holdHours ?? HOLD_DEFAULT,
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
  const { submitting, errors, setErrors, run } = useSubmit();

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
    const v = values!;
    const day = v.launchOn ? dayToIso(v.launchDay) : null;
    if (v.launchOn && !day) return setErrors({ launchAt: "Nhập ngày mở bán dạng ngày/tháng/năm." });
    const launchIso = day ? `${day}T${String(v.launchHour).padStart(2, "0")}:00:00+07:00` : null;
    run(async () => {
      const saved = await api.put<Store>("/store", toInput(v, launchIso));
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

        <Panel title="Mở bán và đặt chờ">
          <div className="flex flex-col gap-4">
            <p className="-mt-2 text-sm text-ink-2">
              Trước giờ mở bán, trang chủ, trang sản phẩm, thiết kế vòng hiện đồng hồ đếm ngược, trang chủ ẩn sản phẩm nổi bật. Tới giờ là web tự mở bán, không cần deploy. Web cập nhật sau khoảng một phút.
            </p>
            <Switch checked={values.launchOn} onChange={(v) => set("launchOn", v)} label={values.launchOn ? "Đang đếm ngược tới ngày mở bán" : "Đã mở bán, không đếm ngược"} disabled={submitting} />
            {values.launchOn && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div data-field="launchAt">
                  <Field label="Ngày mở bán" hint="Dạng ngày/tháng/năm, giờ Việt Nam." error={errors.launchAt}>
                    <Input value={values.launchDay} onChange={(e) => set("launchDay", e.target.value)} placeholder="VD: 12/12/2026" inputMode="numeric" disabled={submitting} />
                  </Field>
                </div>
                <Field label="Giờ mở bán">
                  <Select value={values.launchHour} onChange={(v) => set("launchHour", v)} options={hours} disabled={submitting} ariaLabel="Giờ mở bán" />
                </Field>
              </div>
            )}
            <div className="border-t border-line pt-4">
              <Switch checked={values.preorderEnabled} onChange={(v) => set("preorderEnabled", v)} label={values.preorderEnabled ? "Nhận đặt chờ trước ngày mở bán" : "Không nhận đơn trước ngày mở bán"} disabled={submitting} />
              <p className="mt-1 text-sm text-ink-2">
                Bật: khách vẫn thêm vào giỏ và đặt hàng như thường, đơn vào danh sách với trạng thái “Chờ chuẩn bị”, chưa trừ kho; chuyển sang “Chờ xác nhận” thì kho mới bị trừ. Tắt: trước ngày mở bán không thêm vào giỏ được, đơn đã có vẫn giữ nguyên.
              </p>
            </div>
            <div className="border-t border-line pt-4">
              <Switch checked={values.countdownRedirect} onChange={(v) => set("countdownRedirect", v)} label="Chuyển trang sản phẩm về trang đếm ngược" disabled={submitting} />
              <p className="mt-1 text-sm text-ink-2">
                Trước ngày mở bán, mọi trang sản phẩm và danh mục chuyển tạm về /countdown. Chỉ bật khi site chưa lên Google: Google thấy sản phẩm chuyển về trang không index sẽ bỏ dần các trang này.
              </p>
            </div>
          </div>
        </Panel>

        <Panel title="Đặt cọc và hạn chuyển khoản">
          <div className="flex flex-col gap-4">
            <p className="-mt-2 text-sm text-ink-2">
              Đơn chuyển khoản và đơn cần cọc có hạn chuyển tiền; quá hạn chưa nhận đủ thì hệ thống tự huỷ đơn và trả kho. Bạn ghi nhận tiền ở chi tiết đơn.
            </p>
            <div data-field="paymentHoldHours" className="sm:w-1/2">
              <Field label="Hạn chuyển khoản" hint="Từ 2 đến 72 giờ, tính từ lúc đặt." error={errors.paymentHoldHours}>
                <NumberInput value={values.holdHours} onChange={(v) => set("holdHours", v)} suffix="giờ" disabled={submitting} />
              </Field>
            </div>
            <div className="border-t border-line pt-4">
              <Switch checked={values.depositEnabled} onChange={(v) => set("depositEnabled", v)} label={values.depositEnabled ? "Đang yêu cầu đặt cọc" : "Không yêu cầu đặt cọc"} disabled={submitting} />
              <p className="mt-1 text-sm text-ink-2">
                Khách chọn trả khi nhận hàng thì chuyển khoản trước một phần tiền hàng (không tính phí giao), làm tròn lên nghìn đồng. Chuyển khoản cả đơn thì không cần cọc. Huỷ đơn có hàng làm riêng sau khi shop xác nhận thì giữ tiền cọc.
              </p>
            </div>
            {values.depositEnabled && (
              <>
                <div data-field="deposit.percent" className="sm:w-1/2">
                  <Field label="Phần trăm cọc" hint={`Từ ${DEPOSIT_MIN}% đến ${DEPOSIT_MAX}% tiền hàng.`} error={errors["deposit.percent"]}>
                    <NumberInput value={values.depositPercent} onChange={(v) => set("depositPercent", v)} suffix="%" disabled={submitting} />
                  </Field>
                </div>
                <div role="group" aria-labelledby="coc-khi" className="flex flex-col">
                  <p id="coc-khi" className="text-sm font-medium">Đơn cần cọc khi có</p>
                  <Checkbox label="Vòng tự thiết kế" checked={values.depositForCustom} onChange={(e) => set("depositForCustom", e.target.checked)} disabled={submitting} />
                  <Checkbox label="Đặt chờ trước ngày mở bán" checked={values.depositForPreorder} onChange={(e) => set("depositForPreorder", e.target.checked)} disabled={submitting} />
                  <Checkbox label="Sản phẩm bật “Cần đặt cọc” (sửa ở từng sản phẩm)" checked={values.depositForMarked} onChange={(e) => set("depositForMarked", e.target.checked)} disabled={submitting} />
                  <Checkbox label="Tạm tính từ một mức" checked={values.depositMinOn} onChange={(e) => set("depositMinOn", e.target.checked)} disabled={submitting} />
                  {values.depositMinOn && (
                    <div data-field="deposit.minOrderVnd" className="pl-6 sm:w-1/2">
                      <Field label="Tạm tính từ" hint="Để 0 là mọi đơn trả khi nhận hàng." error={errors["deposit.minOrderVnd"]}>
                        <MoneyInput value={values.depositMinVnd} onChange={(v) => set("depositMinVnd", v)} disabled={submitting} />
                      </Field>
                    </div>
                  )}
                </div>
              </>
            )}
            {values.depositEnabled && ![values.bankName, values.accountNumber, values.accountName].every((x) => x.trim()) && (
              <p role="alert" className="rounded-lg bg-warn-soft px-3 py-2 text-sm">Chưa có tài khoản nhận chuyển khoản nên web chưa yêu cầu cọc. Bạn điền đủ ba ô ở mục bên dưới.</p>
            )}
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
