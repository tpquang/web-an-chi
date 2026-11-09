import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BankTransferBox, OrderDetails } from "@/components/order-details";
import { Button } from "@/components/ui/button";
import { PageFrame, PageHeader } from "@/components/ui/layout";
import { getOrder, getStore } from "@/lib/api";
import { orderLookupHref, postsHref } from "@/lib/links";
import { privateMeta } from "@/lib/seo";

export const metadata: Metadata = { title: "Đơn hàng", ...privateMeta };

type Props = { params: Promise<{ code: string }> };

export default async function OrderPage({ params }: Props) {
  const { code } = await params;
  const [order, store] = await Promise.all([getOrder(code), getStore()]);
  if (!order) notFound();
  const isNew = order.status === "PENDING";

  return (
    <PageFrame>
      <PageHeader
        title={isNew ? "Shop đã nhận đơn của bạn" : `Đơn hàng ${order.code}`}
        desc={
          isNew ? (
            <>
              Mã đơn của bạn là <strong className="font-semibold text-ink">{order.code}</strong>. Bạn lưu lại mã này để tra cứu đơn.
            </>
          ) : undefined
        }
      />
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-6">
        <div className="flex flex-col gap-6 lg:col-span-7">
          {order.payment && <BankTransferBox payment={order.payment} totalVnd={order.totalVnd} />}
          <section aria-labelledby="tiep-theo">
            <h2 id="tiep-theo" className="font-serif text-2xl leading-tight">
              Việc tiếp theo
            </h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 leading-[1.75]">
              <li>Shop gọi số điện thoại bạn để lại để xác nhận đơn, thường trong giờ làm việc cùng ngày.</li>
              {order.paymentMethod === "BANK_TRANSFER" ? (
                <li>Bạn chuyển khoản theo thông tin bên trên. Shop báo lại khi đã nhận tiền.</li>
              ) : (
                <li>Bạn trả tiền mặt khi nhận hàng, được xem hàng trước khi trả.</li>
              )}
              <li>Hàng được giao trong {store.shipping.eta}.</li>
            </ol>
          </section>
          <section aria-labelledby="lien-he">
            <h2 id="lien-he" className="font-serif text-2xl leading-tight">
              Cần đổi thông tin đơn?
            </h2>
            <p className="mt-3 leading-[1.75]">
              Bạn gọi {store.phone || "shop"}
              {store.openingHours ? ` (${store.openingHours})` : ""} và đọc mã đơn {order.code}.
            </p>
          </section>
          <div className="flex flex-wrap gap-2">
            <Button href={postsHref} variant="outline">
              Đọc cách dùng và bảo quản trầm
            </Button>
            <Button href={orderLookupHref} variant="text">
              Tra cứu đơn hàng
            </Button>
          </div>
        </div>
        <div className="lg:col-span-5">
          <OrderDetails order={order} />
        </div>
      </div>
    </PageFrame>
  );
}
