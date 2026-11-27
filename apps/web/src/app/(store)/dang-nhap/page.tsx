import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GoogleSection } from "@/components/account/google-section";
import { LoginForm } from "@/components/account/login-form";
import { PageFrame, PageHeader } from "@/components/ui/layout";
import { getGoogleClientId } from "@/lib/api";
import { accountHref, safeNext } from "@/lib/links";
import { privateMeta } from "@/lib/seo";
import { sessionToken } from "@/lib/session";

export const metadata: Metadata = { title: "Đăng nhập", ...privateMeta };

type Props = { searchParams: Promise<{ tiep?: string; loi?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { tiep, loi } = await searchParams;
  const next = safeNext(tiep, accountHref);
  if (await sessionToken()) redirect(next);
  const googleClientId = await getGoogleClientId();

  return (
    <PageFrame>
      <PageHeader title="Đăng nhập" desc="Đăng nhập để đặt hàng, xem lại đơn đã đặt và điền sẵn địa chỉ." />
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-6">
          <LoginForm next={next} />
          <GoogleSection clientId={googleClientId} next={next} error={loi} />
        </div>
        <aside className="text-ink-2 lg:col-span-5 lg:col-start-8">
          <p className="font-medium text-ink">Cần tài khoản để đặt hàng</p>
          <p className="mt-2">Tạo tài khoản chỉ cần họ tên, số điện thoại và mật khẩu, hoặc bấm Tiếp tục với Google. Đơn đặt trước đây vẫn tra cứu được bằng mã đơn và số điện thoại.</p>
        </aside>
      </div>
    </PageFrame>
  );
}
