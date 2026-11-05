import { NavLink, Outlet } from "react-router-dom";
import { BrandLogo } from "../components/BrandMark";
import { ThemeToggle } from "../components/ThemeToggle";
import { useAuth } from "../lib/auth";
import { useInboxUnread } from "../lib/use-inbox-unread";

type NavGroup = { label: string; ownerOnly?: boolean; links: { to: string; label: string }[] };

const groups: NavGroup[] = [
  {
    label: "",
    links: [
      { to: "/", label: "Tổng quan" },
      { to: "/inbox", label: "Hộp thư" },
    ],
  },
  {
    label: "Bán hàng",
    links: [
      { to: "/orders", label: "Đơn hàng" },
      { to: "/customers", label: "Khách hàng" },
    ],
  },
  {
    label: "Kinh doanh",
    ownerOnly: true,
    links: [
      { to: "/business", label: "Đợt nhập hàng" },
      { to: "/materials", label: "Nguyên liệu thô" },
      { to: "/packing", label: "Đóng gói" },
      { to: "/stock", label: "Sổ kho" },
    ],
  },
  {
    label: "Hàng hoá",
    links: [
      { to: "/products", label: "Sản phẩm" },
      { to: "/categories", label: "Danh mục sản phẩm" },
      { to: "/bead-textures", label: "Vân vật liệu hạt" },
    ],
  },
  {
    label: "Nội dung",
    links: [
      { to: "/home", label: "Trang chủ" },
      { to: "/posts", label: "Bài viết" },
      { to: "/post-categories", label: "Chủ đề bài viết" },
    ],
  },
  { label: "Cửa hàng", ownerOnly: true, links: [{ to: "/staff", label: "Nhân viên" }] },
];

export function AdminLayout() {
  const { logout, staff, isOwner } = useAuth();
  const unread = useInboxUnread();
  return (
    <div className="min-h-dvh bg-paper text-ink md:flex">
      <aside className="border-b border-line bg-paper md:sticky md:top-0 md:flex md:h-dvh md:w-60 md:flex-none md:flex-col md:border-b-0">
        <div className="flex items-center justify-between gap-2 px-4 pt-4 md:block">
          <p className="flex items-center gap-2 text-brand md:mb-4 md:px-3 md:pt-2">
            <BrandLogo className="text-2xl" />
            <span className="text-sm font-semibold">CMS</span>
          </p>
          <div className="md:hidden">
            <ThemeToggle compact />
          </div>
        </div>
        <nav aria-label="Menu quản trị" className="flex gap-1 overflow-x-auto px-4 pb-3 md:flex-1 md:flex-col md:gap-4 md:overflow-y-auto md:pb-4">
          {groups.filter((g) => !g.ownerOnly || isOwner).map((group) => (
            <div key={group.label || "root"} className="flex gap-1 md:flex-col">
              {group.label && <p className="hidden px-3 pb-1 text-xs font-semibold text-ink-3 md:block">{group.label}</p>}
              {group.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  className={({ isActive }) =>
                    `inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm whitespace-nowrap ${isActive ? "bg-wood text-on-wood" : "hover:bg-paper-2"}`
                  }
                >
                  {link.label}
                  {link.to === "/inbox" && unread > 0 && (
                    <span aria-label={`${unread} tin chưa đọc`} className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-err px-1.5 text-[11px] leading-5 font-semibold text-surface">{unread}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="mx-4 mb-4 hidden flex-col gap-2 rounded-3xl border border-edge bg-surface p-3 md:flex">
          <div className="flex items-center justify-between gap-2 whitespace-nowrap">
            <span className="text-sm text-ink-3">Giao diện</span>
            <ThemeToggle compact />
          </div>
          <button type="button" onClick={logout} className="min-h-11 px-3 text-left text-sm text-ink-2 hover:text-wood">
            Đăng xuất{staff ? ` (${staff.name})` : ""}
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:py-8 md:pr-8 md:pl-4">
        <Outlet />
        <button type="button" onClick={logout} className="mt-10 min-h-11 text-sm text-ink-2 hover:text-wood md:hidden">
          Đăng xuất
        </button>
      </main>
    </div>
  );
}
