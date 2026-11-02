"use client";

import Image from "next/image";
import Link from "next/link";
import { cart } from "@/lib/cart";
import type { QuoteLine } from "@/lib/client-api";
import { productHref } from "@/lib/links";
import { formatVnd } from "@/lib/site";
import { BrandMark } from "../brand-mark";
import { TrashIcon } from "../icons";
import { IconButton } from "../ui/button";
import { QuantityInput } from "../ui/quantity-input";

function problemText(line: QuoteLine) {
  if (line.problem === "UNAVAILABLE") return "Sản phẩm này không còn bán. Bạn xoá khỏi giỏ để đặt hàng.";
  if (line.problem === "OUT_OF_STOCK") return "Sản phẩm đã hết hàng. Bạn xoá khỏi giỏ để đặt hàng.";
  if (line.problem === "NOT_ENOUGH") return `Shop chỉ còn ${line.product?.stock} sản phẩm. Bạn giảm số lượng để đặt hàng.`;
  return null;
}

export function CartLine({ line, disabled }: { line: QuoteLine; disabled?: boolean }) {
  const { product } = line;
  const name = product?.name ?? "Sản phẩm không còn bán";
  const problem = problemText(line);

  return (
    <li className="flex gap-4 py-5">
      <div className="relative size-18 flex-none overflow-hidden rounded-md bg-paper-2">
        {product?.image ? (
          <Image src={product.image.url} alt={product.image.alt ?? name} fill sizes="72px" className="object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-line-strong">
            <BrandMark className="size-8" />
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {product ? (
              <Link href={productHref(line.slug)} className="font-medium hover:text-wood">
                {name}
              </Link>
            ) : (
              <p className="font-medium text-ink-2">{name}</p>
            )}
            {product && <p className="text-sm text-ink-3">{formatVnd(product.unitPriceVnd)} / sản phẩm</p>}
          </div>
          <p className="font-medium whitespace-nowrap tabular-nums">{formatVnd(line.lineTotalVnd)}</p>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          {product && product.stock > 0 ? (
            <QuantityInput
              value={line.quantity}
              max={product.stock}
              onChange={(value) => cart.set(line.slug, value)}
              label={`Số lượng ${name}`}
              disabled={disabled}
            />
          ) : (
            <span />
          )}
          <IconButton label={`Xoá ${name} khỏi giỏ`} onClick={() => cart.remove(line.slug)} disabled={disabled}>
            <TrashIcon />
          </IconButton>
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
