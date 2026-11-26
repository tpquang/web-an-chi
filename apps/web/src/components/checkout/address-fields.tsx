"use client";

import type { Province } from "@/lib/address";
import type { CheckoutErrors, CheckoutValues } from "@/lib/checkout";
import { Field, Input } from "../ui/field";
import { Select } from "../ui/select";

type Props = {
  values: Pick<CheckoutValues, "provinceCode" | "wardCode" | "street">;
  provinces: Province[] | null;
  failed: boolean;
  onRetry: () => void;
  errors: CheckoutErrors;
  disabled?: boolean;
  onChange: (patch: Partial<CheckoutValues>) => void;
  refs: { province: (el: HTMLButtonElement | null) => void; ward: (el: HTMLButtonElement | null) => void; street: (el: HTMLInputElement | null) => void };
};

// Địa chỉ theo địa giới từ 07/2025: tỉnh, thành → phường, xã → số nhà, tên đường. Không còn cấp quận, huyện
export function AddressFields({ values, provinces, failed, onRetry, errors, disabled, onChange, refs }: Props) {
  const province = provinces?.find((p) => p.code === values.provinceCode);
  const loading = !provinces;

  return (
    <div role="group" aria-labelledby="dia-chi" className="flex flex-col gap-4">
      {/* Mỗi ô đã có nhãn riêng; tên nhóm chỉ cho trình đọc màn hình để form gọn */}
      <p id="dia-chi" className="sr-only">
        Địa chỉ nhận hàng
      </p>
      {failed && (
        <p role="alert" className="text-sm text-err">
          Chưa tải được danh sách tỉnh, phường.{" "}
          <button type="button" onClick={onRetry} className="min-h-11 font-medium text-wood underline-offset-4 hover:underline">
            Thử lại
          </button>
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Tỉnh, thành phố" required error={errors.province}>
          <Select
            ref={refs.province}
            searchable
            value={values.provinceCode}
            onChange={(code) => onChange({ provinceCode: code, wardCode: null })}
            options={(provinces ?? []).map((p) => ({ value: p.code, label: p.name }))}
            placeholder="Chọn tỉnh, thành"
            disabled={disabled || loading}
          />
        </Field>
        <Field label="Phường, xã" required error={errors.ward}>
          <Select
            ref={refs.ward}
            searchable
            value={values.wardCode}
            onChange={(code) => onChange({ wardCode: code })}
            options={(province?.wards ?? []).map((w) => ({ value: w.code, label: w.name }))}
            placeholder={province ? "Chọn phường, xã" : "Chọn tỉnh trước"}
            disabled={disabled || !province}
          />
        </Field>
      </div>
      <Field label="Số nhà, tên đường" required error={errors.street}>
        <Input
          ref={refs.street}
          value={values.street}
          onChange={(e) => onChange({ street: e.target.value })}
          autoComplete="address-line1"
          placeholder="VD: 12 Lê Lợi hoặc Thôn 1"
          disabled={disabled}
        />
      </Field>
    </div>
  );
}
