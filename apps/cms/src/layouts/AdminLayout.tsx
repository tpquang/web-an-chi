import { NavLink, Outlet } from "react-router-dom";
import { BrandLogo } from "../components/BrandMark";
import { ThemeToggle } from "../components/ThemeToggle";
import { useAuth } from "../lib/auth";

const groups = [
  { label: "", links: [{ to: "/", label: "Tổng quan" }] },
  {
    label: "Bán hàng",
    links: [
      { to: "/orders", label: "Đơn hàng" },
      { to: "/customers", label: "Khách hàng" },
    ],
  },
  {
    label: "Hàng hoá",
    links: [
      { to: "/products", label: "Sản phẩm" },
      { to: "/categories", label: "Danh mục sản phẩm" },
    ],
  },
  {
    label: "Nội dung",
    links: [
      { to: "/posts", label: "Bài viết" },
      { to: "/post-categories", label: "Chủ đề bài viết" },
    ],
  },
];

export function AdminLayout() {
  const { logout } = useAuth();
  return (
    <div className="min-h-dvh bg-paper text-ink md:flex">
      <aside className="border-b border-line bg-surface md:sticky md:top-0 md:flex md:h-dvh md:w-60 md:flex-none md:flex-col md:border-r md:border-b-0">
        <div className="flex items-center justify-between gap-2 px-4 pt-4 md:block">
          <p className="flex items-center gap-2 text-wood md:mb-4 md:px-3">
            <BrandLogo className="h-8" />
            <span className="text-sm font-semibold">CMS</span>
          </p>
          <div className="md:hidden">
            <ThemeToggle compact />
          </div>
        </div>
        <nav aria-label="Menu quản trị" className="flex gap-1 overflow-x-auto px-4 pb-3 md:flex-1 md:flex-col md:gap-4 md:overflow-y-auto md:pb-4">
          {groups.map((group) => (
            <div key={group.label || "root"} className="flex gap-1 md:flex-col">
              {group.label && <p className="hidden px-3 pb-1 text-xs font-semibold text-ink-3 md:block">{group.label}</p>}
              {group.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  className={({ isActive }) =>
                    `inline-flex min-h-11 items-center rounded-md px-3 text-sm whitespace-nowrap ${isActive ? "bg-wood text-on-wood" : "hover:bg-paper-2"}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="hidden flex-col gap-2 border-t border-line px-4 py-3 md:flex">
          <div className="flex items-center justify-between gap-2 whitespace-nowrap">
            <span className="text-sm text-ink-3">Giao diện</span>
            <ThemeToggle compact />
          </div>
          <button type="button" onClick={logout} className="min-h-11 px-3 text-left text-sm text-ink-2 hover:text-wood">
            Đăng xuất
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">
        <Outlet />
        <button type="button" onClick={logout} className="mt-10 min-h-11 text-sm text-ink-2 hover:text-wood md:hidden">
          Đăng xuất
        </button>
      </main>
    </div>
  );
}
