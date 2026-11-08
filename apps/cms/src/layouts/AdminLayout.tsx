import type { ComponentType } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { BrandLogo } from "../components/BrandMark";
import {
  BagIcon,
  BeadsIcon,
  BookIcon,
  BoxIcon,
  ChartIcon,
  ChatIcon,
  ClipboardIcon,
  DocIcon,
  FolderIcon,
  HomeIcon,
  ImageIcon,
  LayersIcon,
  LogoutIcon,
  PackageIcon,
  ShieldIcon,
  TagIcon,
  TruckIcon,
  UsersIcon,
  WalletIcon,
} from "../components/icons";
import { ThemeToggle } from "../components/ThemeToggle";
import { useAuth, type PermissionKey } from "../lib/auth";
import { useInboxUnread } from "../lib/use-inbox-unread";

type NavItem = { to: string; label: string; Icon: ComponentType<{ size?: number }>; perm: PermissionKey | "owner" };
type NavGroup = { label: string; links: NavItem[] };

// Mỗi mục gắn quyền cần để xem; không có quyền thì ẩn khỏi menu. API vẫn chặn riêng
const groups: NavGroup[] = [
  {
    label: "",
    links: [
      { to: "/", label: "Tổng quan", Icon: HomeIcon, perm: "dashboard" },
      { to: "/inbox", label: "Hộp thư", Icon: ChatIcon, perm: "inbox" },
    ],
  },
  {
    label: "Bán hàng",
    links: [
      { to: "/orders", label: "Đơn hàng", Icon: BagIcon, perm: "orders" },
      { to: "/customers", label: "Khách hàng", Icon: UsersIcon, perm: "orders" },
    ],
  },
  {
    label: "Kho",
    links: [
      { to: "/business", label: "Đợt nhập hàng", Icon: TruckIcon, perm: "batches" },
      { to: "/materials", label: "Nguyên liệu", Icon: LayersIcon, perm: "inventory" },
      { to: "/packing", label: "Đóng gói", Icon: PackageIcon, perm: "inventory" },
      { to: "/stocktake", label: "Kiểm kho", Icon: ClipboardIcon, perm: "inventory" },
      { to: "/stock", label: "Sổ kho", Icon: BookIcon, perm: "inventory" },
    ],
  },
  {
    label: "Tài chính",
    links: [
      { to: "/reports", label: "Lợi nhuận", Icon: ChartIcon, perm: "finance" },
      { to: "/expenses", label: "Chi phí phát sinh", Icon: WalletIcon, perm: "finance" },
    ],
  },
  {
    label: "Hàng hoá",
    links: [
      { to: "/products", label: "Sản phẩm", Icon: BoxIcon, perm: "products" },
      { to: "/categories", label: "Danh mục sản phẩm", Icon: TagIcon, perm: "products" },
      { to: "/bead-textures", label: "Vân vật liệu hạt", Icon: BeadsIcon, perm: "products" },
    ],
  },
  {
    label: "Nội dung",
    links: [
      { to: "/home", label: "Trang chủ", Icon: ImageIcon, perm: "home" },
      { to: "/posts", label: "Bài viết", Icon: DocIcon, perm: "posts" },
      { to: "/post-categories", label: "Chủ đề bài viết", Icon: FolderIcon, perm: "posts" },
    ],
  },
  {
    label: "Cửa hàng",
    links: [
      { to: "/store", label: "Thông tin cửa hàng", Icon: BagIcon, perm: "owner" },
      { to: "/staff", label: "Tài khoản, phân quyền", Icon: ShieldIcon, perm: "owner" },
    ],
  },
];

export function AdminLayout() {
  const { logout, staff, isOwner, can } = useAuth();
  const unread = useInboxUnread();
  const visible = groups
    .map((g) => ({ ...g, links: g.links.filter((l) => (l.perm === "owner" ? isOwner : can(l.perm))) }))
    .filter((g) => g.links.length > 0);

  return (
    <div className="min-h-dvh bg-paper text-ink md:flex">
      <aside className="border-b border-line bg-paper md:sticky md:top-0 md:flex md:h-dvh md:w-56 md:flex-none md:flex-col md:border-b-0">
        <div className="flex items-center justify-between gap-2 px-4 pt-4 md:px-5">
          <p className="flex items-center gap-2 text-brand">
            <BrandLogo className="text-xl" />
            <span className="text-xs font-semibold">CMS</span>
          </p>
          <ThemeToggle />
        </div>
        <nav aria-label="Menu quản trị" className="flex gap-1 overflow-x-auto px-4 py-3 md:flex-1 md:flex-col md:gap-3 md:overflow-y-auto">
          {visible.map((group) => (
            <div key={group.label || "root"} className="flex gap-1 md:flex-col md:gap-0.5">
              {group.label && <p className="hidden px-3 pb-1 text-xs font-semibold text-ink-3 md:block">{group.label}</p>}
              {group.links.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  className={({ isActive }) =>
                    `inline-flex min-h-10 items-center gap-2.5 rounded-sm px-3 text-sm whitespace-nowrap transition-colors duration-(--d-fast) ${isActive ? "bg-wood-soft font-medium text-wood" : "text-ink-2 hover:bg-paper-2 hover:text-ink"}`
                  }
                >
                  <Icon size={18} />
                  {label}
                  {to === "/inbox" && unread > 0 && (
                    <span aria-label={`${unread} tin chưa đọc`} className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-err px-1.5 text-[11px] leading-5 font-semibold text-surface">{unread}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="hidden border-t border-line px-4 py-3 md:block">
          <button type="button" onClick={logout} className="inline-flex min-h-10 w-full items-center gap-2.5 rounded-sm px-3 text-left text-sm text-ink-2 hover:bg-paper-2 hover:text-wood">
            <LogoutIcon size={18} />
            <span className="truncate">Đăng xuất{staff ? ` (${staff.name})` : ""}</span>
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:py-6 md:pr-6 md:pl-4">
        <Outlet />
        <button type="button" onClick={logout} className="mt-10 min-h-11 text-sm text-ink-2 hover:text-wood md:hidden">
          Đăng xuất
        </button>
      </main>
    </div>
  );
}
