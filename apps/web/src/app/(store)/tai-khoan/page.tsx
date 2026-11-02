import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/account/logout-button";
import { ProfileForm } from "@/components/account/profile-form";
import { Button } from "@/components/ui/button";
import { PageFrame, PageHeader } from "@/components/ui/layout";
import { EmptyState } from "@/components/ui/states";
import { Tag } from "@/components/ui/tag";
import { getAccount } from "@/lib/api";
import { accountHref, loginHref, orderHref, productsHref } from "@/lib/links";
import { orderStatusLabel, paymentStatusLabel } from "@/lib/order";
import { privateMeta } from "@/lib/seo";
import { sessionToken } from "@/lib/session";
import { formatDate, formatVnd } from "@/lib/site";

export const metadata: Metadata = { title: "Tài khoản", ...privateMeta };

export default async function AccountPage() {
  const account = await getAccount(await sessionToken());
  if (!account) redirect(`${loginHref}?tiep=${encodeURIComponent(accountHref)}`);

  return (
    <PageFrame>
      <PageHeader title={`Chào ${account.name}`} desc={`Số điện thoại đăng nhập: ${account.phone}`} actions={<LogoutButton />} />
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-6">
        <section aria-labelledby="don-cua-ban" className="lg:col-span-7">
          <h2 id="don-cua-ban" className="mb-4 font-serif text-2xl leading-tight font-semibold">
            Đơn hàng của bạn
          </h2>
          {account.orders.length === 0 ? (
            <EmptyState title="Bạn chưa có đơn hàng nào." desc="Xem các sản phẩm trầm hương để bắt đầu." action={<Button href={productsHref}>Xem sản phẩm</Button>} />
          ) : (
            <ul className="flex flex-col gap-3">
              {account.orders.map((order) => (
                <li key={order.code}>
                  <Link href={orderHref(order.code)} className="block rounded-lg border border-line bg-surface p-4 hover:border-wood">
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{order.code}</span>
                      <Tag tone={order.status === "COMPLETED" ? "ok" : order.status === "CANCELLED" ? "neutral" : "info"}>
                        {orderStatusLabel[order.status]}
                      </Tag>
                    </span>
                    <span className="mt-1 block text-sm text-ink-2">
                      {order.items.map((item) => `${item.productName} × ${item.quantity}`).join(", ")}
                    </span>
                    <span className="mt-2 flex flex-wrap justify-between gap-2 text-sm text-ink-3">
                      <span>
                        {formatDate(order.createdAt)} · {paymentStatusLabel[order.paymentStatus]}
                      </span>
                      <span className="font-medium text-ink tabular-nums">{formatVnd(order.totalVnd)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <div className="lg:col-span-5">
          <ProfileForm account={account} />
        </div>
      </div>
    </PageFrame>
  );
}
