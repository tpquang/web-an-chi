"use client";

import Image from "next/image";
import Link from "next/link";
import { cart } from "@/lib/cart";
import type { QuoteLine } from "@/lib/client-api";
import { braceletEditHref, productHref } from "@/lib/links";
import { formatVnd } from "@/lib/site";
import { TrashIcon } from "../icons";
import { IconButton } from "../ui/button";
import { QuantityInput } from "../ui/quantity-input";

function problemText(line: QuoteLine) {
  if (line.problem === "UNAVAILABLE") return "Sản phẩm này không còn bán. Bạn xoá khỏi giỏ để đặt hàng.";
  if (line.problem === "OUT_OF_STOCK") return "Sản phẩm đã hết hàng. Bạn xoá khỏi giỏ để đặt hàng.";
  if (line.problem === "NOT_ENOUGH") return `Shop chỉ còn ${line.product?.stock} sản phẩm. Bạn giảm số lượng để đặt hàng.`;
  return null;
}

// Đơn đặt chờ không giới hạn theo tồn kho (API cho qua hết hàng, thiếu hàng), chỉ chặn ở 99 mỗi dòng
const PREORDER_MAX = 99;

export function CartLine({ line, disabled, preorder }: { line: QuoteLine; disabled?: boolean; preorder?: boolean }) {
  const { product } = line;
  const max = product ? (preorder ? PREORDER_MAX : product.stock) : 0;
  const name = product?.name ?? "Sản phẩm không còn bán";
  const problem = problemText(line);

  return (
    <li className="flex gap-4 py-5">
      <div className="relative size-18 flex-none overflow-hidden rounded-xl bg-paper-2">
        {product?.image ? (
          <Image src={product.image.url} alt={product.image.alt ?? name} fill sizes="72px" className="object-cover" />
        ) : (
          <Image src="/brand/default-thumb.svg" alt="" fill sizes="72px" unoptimized className="object-cover" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {line.design ? (
              <p className="font-medium">{name}</p>
            ) : product ? (
              <Link href={productHref(line.slug)} className="font-medium hover:text-wood">
                {name}
              </Link>
            ) : (
              <p className="font-medium text-ink-2">{name}</p>
            )}
            {product && <p className="text-sm text-ink-3">{formatVnd(product.unitPriceVnd)} / {line.design ? "vòng" : "sản phẩm"}</p>}
            {line.design && <BraceletSummary design={line.design} />}
          </div>
          <p className="font-medium whitespace-nowrap tabular-nums">{formatVnd(line.lineTotalVnd)}</p>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          {product && max > 0 ? (
            <QuantityInput
              value={line.quantity}
              max={max}
              onChange={(value) => cart.set(line.slug, value)}
              label={`Số lượng ${name}`}
              disabled={disabled}
            />
          ) : (
            <span />
          )}
          <span className="ml-auto flex items-center gap-1">
          {line.design && (
            <Link href={braceletEditHref(line.slug)} className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-wood underline-offset-4 hover:underline">
              Sửa vòng
            </Link>
          )}
          <IconButton label={`Xoá ${name} khỏi giỏ`} onClick={() => cart.remove(line.slug)} disabled={disabled}>
            <TrashIcon />
          </IconButton>
          </span>
        </div>
        {problem && (
          <div role="alert" className="flex flex-wrap items-center gap-x-3 text-sm">
            <p className="text-err">{problem}</p>
            {line.problem === "NOT_ENOUGH" && product && (
              <button
                type="button"
                onClick={() => cart.set(line.slug, product.stock)}
                className="min-h-11 font-medium text-wood underline-offset-4 hover:underline"
              >
                Đổi thành {product.stock}
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

function BraceletSummary({ design }: { design: NonNullable<QuoteLine["design"]> }) {
  return (
    <p className="mt-1 text-sm text-ink-2">
      {design.wraps ? `Quấn ${design.wraps} vòng · ` : ""}{design.accent ? "Có hạt chủ và tua · " : ""}Dài {(design.lengthMm / 10).toLocaleString("vi-VN")} cm · Cổ tay {design.wristCm.toLocaleString("vi-VN")} cm · {design.fitName} ·{" "}
      {design.cordName}
      {giftText(design.gift) && <span className="block">{giftText(design.gift)}</span>}
      {design.gift?.card && <span className="block">Lời nhắn trên thiệp: “{design.gift.card}”</span>}
      {design.note && <span className="block">Ghi chú: {design.note}</span>}
    </p>
  );
}

function giftText(gift?: { box?: boolean; wrap?: boolean; card?: string }) {
  return [gift?.box && "Hộp quà", gift?.wrap && "Bọc quà", gift?.card && "Kèm thiệp"].filter(Boolean).join(" · ");
}
