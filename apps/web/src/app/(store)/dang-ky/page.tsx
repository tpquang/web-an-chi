import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/account/register-form";
import { PageFrame, PageHeader } from "@/components/ui/layout";
import { accountHref } from "@/lib/links";
import { privateMeta } from "@/lib/seo";
import { sessionToken } from "@/lib/session";

export const metadata: Metadata = { title: "Tạo tài khoản", ...privateMeta };

export default async function RegisterPage() {
  if (await sessionToken()) redirect(accountHref);
  return (
    <PageFrame>
      <PageHeader title="Tạo tài khoản" desc="Chỉ cần họ tên, số điện thoại và mật khẩu." />
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-6">
          <RegisterForm />
        </div>
        <aside className="text-ink-2 lg:col-span-5 lg:col-start-8">
          <p className="font-medium text-ink">Đã từng đặt hàng bằng số này?</p>
          <p className="mt-2">
            Shop sẽ hỏi mã một đơn cũ để xác nhận bạn là chủ số điện thoại. Sau đó các đơn cũ hiện trong tài khoản của bạn.
          </p>
        </aside>
      </div>
    </PageFrame>
  );
}
