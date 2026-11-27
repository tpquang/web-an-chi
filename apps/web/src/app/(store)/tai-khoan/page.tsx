import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleButton } from "@/components/account/google-button";
import { LogoutButton } from "@/components/account/logout-button";
import { PasswordForm } from "@/components/account/password-form";
import { ProfileForm } from "@/components/account/profile-form";
import { Button } from "@/components/ui/button";
import { PageFrame, PageHeader } from "@/components/ui/layout";
import { EmptyState } from "@/components/ui/states";
import { Tag } from "@/components/ui/tag";
import { getAccount, getGoogleClientId } from "@/lib/api";
import { accountHref, loginHref, orderHref, productsHref } from "@/lib/links";
import { orderStatusLabel, paymentStatusLabel } from "@/lib/order";
import { privateMeta } from "@/lib/seo";
import { sessionToken } from "@/lib/session";
import { formatDate, formatVnd } from "@/lib/site";

export const metadata: Metadata = { title: "Tài khoản", ...privateMeta };

type Props = { searchParams: Promise<{ loi?: string }> };

export default async function AccountPage({ searchParams }: Props) {
  const [account, googleClientId, { loi }] = await Promise.all([getAccount(await sessionToken()), getGoogleClientId(), searchParams]);
  if (!account) redirect(`${loginHref}?tiep=${encodeURIComponent(accountHref)}`);
  const login = [account.phone && `số điện thoại ${account.phone}`, account.google && "Google"].filter(Boolean).join(" hoặc ");

  return (
    <PageFrame>
      <PageHeader title={`Chào ${account.name}`} desc={`Đăng nhập bằng ${login}.`} actions={<LogoutButton />} />
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-6">
        <section aria-labelledby="don-cua-ban" className="lg:col-span-7">
          <h2 id="don-cua-ban" className="mb-4 font-serif text-2xl leading-tight">
            Đơn hàng của bạn
          </h2>
          {account.orders.length === 0 ? (
            <EmptyState title="Bạn chưa có đơn hàng nào." desc="Xem các sản phẩm trầm hương để bắt đầu." action={<Button href={productsHref}>Xem sản phẩm</Button>} />
          ) : (
            <ul className="flex flex-col gap-3">
              {account.orders.map((order) => (
                <li key={order.code}>
                  <Link href={orderHref(order.code)} className="block rounded-2xl border border-edge bg-surface p-4 hover:border-wood">
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
        <div className="flex flex-col gap-6 lg:col-span-5">
          <ProfileForm account={account} />
          <PasswordForm hasPassword={account.hasPassword} hasPhone={Boolean(account.phone)} />
          {(loi === "google-da-gan" || (googleClientId && !account.google)) && (
            <section aria-labelledby="lien-ket-google" className="flex flex-col gap-3 rounded-3xl border border-edge bg-surface p-5 md:p-6">
              <h2 id="lien-ket-google" className="font-serif text-2xl leading-tight">
                Đăng nhập bằng Google
              </h2>
              {loi === "google-da-gan" && (
                <p role="alert" className="text-sm text-err">
                  Tài khoản Google bạn chọn đã gắn với một tài khoản khác ở shop. Bạn chọn tài khoản Google khác, hoặc nhắn shop để gộp.
                </p>
              )}
              {googleClientId && !account.google && (
                <>
                  <p className="text-sm text-ink-2">Liên kết để lần sau đăng nhập bằng một lần bấm, không cần nhập mật khẩu.</p>
                  <GoogleButton next={accountHref} label="Liên kết tài khoản Google" />
                </>
              )}
            </section>
          )}
        </div>
      </div>
    </PageFrame>
  );
}
