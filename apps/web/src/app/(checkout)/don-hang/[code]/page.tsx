import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderStatusCard } from "@/components/order/order-status";
import { BankTransferBox, OrderDetails } from "@/components/order-details";
import { Button } from "@/components/ui/button";
import { PageFrame, PageHeader } from "@/components/ui/layout";
import { getOrder, getStore } from "@/lib/api";
import { orderLookupHref, policyHref, postsHref } from "@/lib/links";
import { privateMeta } from "@/lib/seo";
import { formatVnd } from "@/lib/site";

export const metadata: Metadata = { title: "Đơn hàng", ...privateMeta };

type Props = { params: Promise<{ code: string }> };

export default async function OrderPage({ params }: Props) {
  const { code } = await params;
  const [order, store] = await Promise.all([getOrder(code), getStore()]);
  if (!order) notFound();
  const waiting = order.status === "PENDING" || order.status === "PREORDER";

  return (
    <PageFrame>
      <PageHeader
        title={waiting ? "Shop đã nhận đơn của bạn" : `Đơn hàng ${order.code}`}
        desc={
          waiting ? (
            <>
              Mã đơn <strong className="font-semibold text-ink">{order.code}</strong>. Bạn lưu lại mã này để tra cứu hoặc huỷ đơn.
            </>
          ) : undefined
        }
      />
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-6">
        <div className="flex flex-col gap-6 lg:col-span-7">
          <OrderStatusCard order={order} />
          {order.payment && <BankTransferBox payment={order.payment} dueAt={order.paymentDueAt} />}
          {waiting && (
            <section aria-labelledby="tiep-theo">
              <h2 id="tiep-theo" className="font-serif text-2xl leading-tight">
                Việc tiếp theo
              </h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 leading-[1.75]">
                {order.payment && <li>Bạn chuyển khoản theo thông tin bên trên. Shop báo lại khi đã nhận tiền.</li>}
                <li>Shop gọi số điện thoại bạn để lại để xác nhận đơn, thường trong giờ làm việc cùng ngày.</li>
                <li>
                  {order.paymentMethod === "BANK_TRANSFER"
                    ? `Hàng được giao trong ${store.shipping.eta}.`
                    : `Hàng được giao trong ${store.shipping.eta}. Bạn trả ${formatVnd(order.totalVnd - order.depositVnd)} khi nhận, được xem hàng trước khi trả.`}
                </li>
              </ol>
            </section>
          )}
          <p className="leading-[1.75] text-ink-2">
            Cần đổi thông tin đơn? Bạn gọi {store.phone || "shop"}
            {store.openingHours ? ` (${store.openingHours})` : ""} và đọc mã đơn {order.code}.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button href={postsHref} variant="outline">
              Đọc cách dùng và bảo quản trầm
            </Button>
            <Button href={orderLookupHref} variant="text">
              Tra cứu đơn khác
            </Button>
            <Button href={`${policyHref}#huy-don`} variant="text">
              Chính sách huỷ đơn
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
