import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/account/login-form";
import { PageFrame, PageHeader } from "@/components/ui/layout";
import { accountHref } from "@/lib/links";
import { privateMeta } from "@/lib/seo";
import { sessionToken } from "@/lib/session";

export const metadata: Metadata = { title: "Đăng nhập", ...privateMeta };

type Props = { searchParams: Promise<{ tiep?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { tiep } = await searchParams;
  const next = tiep && tiep.startsWith("/") && !tiep.startsWith("//") ? tiep : accountHref;
  if (await sessionToken()) redirect(next);

  return (
    <PageFrame>
      <PageHeader title="Đăng nhập" desc="Đăng nhập để xem lại đơn đã đặt và điền sẵn địa chỉ khi đặt hàng." />
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-6">
          <LoginForm next={next} />
        </div>
        <aside className="text-ink-2 lg:col-span-5 lg:col-start-8">
          <p className="font-medium text-ink">Không bắt buộc có tài khoản</p>
          <p className="mt-2">Bạn vẫn đặt hàng được khi chưa đăng nhập. Đơn đã đặt tra cứu được bằng mã đơn và số điện thoại.</p>
        </aside>
      </div>
    </PageFrame>
  );
}
