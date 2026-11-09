import { BraceletDesigner } from "@/components/bracelet/bracelet-designer";
import { PageFrame, PageHeader } from "@/components/ui/layout";
import { getBracelet } from "@/lib/api";
import { braceletHref } from "@/lib/links";
import { staticPageMeta } from "@/lib/page-seo";

// Tiêu đề, mô tả sửa ở CMS > Cài đặt SEO
export function generateMetadata() {
  return staticPageMeta("bracelet", braceletHref);
}

export default async function BraceletPage() {
  const { rules, beads } = await getBracelet();

  return (
    <PageFrame>
      <PageHeader
        title="Tự thiết kế vòng tay trầm hương"
        desc="Chọn hạt, xếp vòng theo ý bạn và xem giá ngay. Shop xâu vòng theo đúng thứ tự hạt bạn đặt."
        crumbs={[
          { name: "Trang chủ", href: "/" },
          { name: "Tự thiết kế vòng tay", href: braceletHref },
        ]}
      />
      <BraceletDesigner rules={rules} beads={beads} />
    </PageFrame>
  );
}
