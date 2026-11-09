import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

// Khung 24, nét 1.5, đầu tròn, currentColor
function Icon({ children, size = 20, ...props }: P) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const ChevronDownIcon = (p: P) => (
  <Icon {...p}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);
export const CheckIcon = (p: P) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
);
export const CloseIcon = (p: P) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);
export const AlertIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.5v.01" />
  </Icon>
);
export const PlusIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const TrashIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Icon>
);
export const ArrowUpIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Icon>
);
export const ArrowDownIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </Icon>
);
export const SearchIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.5-4.5" />
  </Icon>
);
export const SunIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
  </Icon>
);
export const MoonIcon = (p: P) => (
  <Icon {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
  </Icon>
);
export const MonitorIcon = (p: P) => (
  <Icon {...p}>
    <rect x="3" y="4.5" width="18" height="12" rx="1.5" />
    <path d="M9 20h6M12 16.5V20" />
  </Icon>
);

// ---- Icon menu: nét mềm, góc bo tròn, cùng khung 24 nét 1.5
export const HomeIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 10.5 12 4l8 6.5V18a2 2 0 0 1-2 2h-3.5v-5.5h-5V20H6a2 2 0 0 1-2-2z" />
  </Icon>
);
export const ChatIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8.5A1.5 1.5 0 0 1 19 17h-8l-4.5 3v-3H5a1.5 1.5 0 0 1-1.5-1.5V7A1.5 1.5 0 0 1 5 5.5z" />
  </Icon>
);
export const BagIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5.5 8h13l-1 10.5a2 2 0 0 1-2 1.5h-7a2 2 0 0 1-2-1.5z" />
    <path d="M9 10V7a3 3 0 0 1 6 0v3" />
  </Icon>
);
export const PlusCircleIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 8.5v7M8.5 12h7" />
  </Icon>
);
export const UsersIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="9.5" cy="8.5" r="3.5" />
    <path d="M3.5 19c.6-3 3-4.5 6-4.5s5.4 1.5 6 4.5" />
    <path d="M16 5.5a3 3 0 0 1 0 6M17.5 14.5c1.7.5 2.8 1.9 3 4" />
  </Icon>
);
export const BoxIcon = (p: P) => (
  <Icon {...p}>
    <path d="m12 3.5 7.5 4v9L12 20.5l-7.5-4v-9z" />
    <path d="m4.5 7.5 7.5 4 7.5-4M12 11.5v9" />
  </Icon>
);
export const TagIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h5.4a1.5 1.5 0 0 1 1 .4l7.7 7.7a1.5 1.5 0 0 1 0 2.1l-5.4 5.4a1.5 1.5 0 0 1-2.1 0l-7.7-7.7a1.5 1.5 0 0 1-.4-1z" />
    <circle cx="8.5" cy="8.5" r="1.2" />
  </Icon>
);
export const BeadsIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="5.5" r="2" />
    <circle cx="18" cy="10" r="2" />
    <circle cx="16" cy="17" r="2" />
    <circle cx="8" cy="17" r="2" />
    <circle cx="6" cy="10" r="2" />
  </Icon>
);
export const LayersIcon = (p: P) => (
  <Icon {...p}>
    <path d="m12 4 8 4-8 4-8-4z" />
    <path d="m4 12 8 4 8-4M4 16l8 4 8-4" />
  </Icon>
);
export const TruckIcon = (p: P) => (
  <Icon {...p}>
    <path d="M3.5 7a1.5 1.5 0 0 1 1.5-1.5h8.5A1.5 1.5 0 0 1 15 7v9H3.5z" />
    <path d="M15 9.5h3l2.5 3V16H15" />
    <circle cx="7.5" cy="17.5" r="1.8" />
    <circle cx="17" cy="17.5" r="1.8" />
  </Icon>
);
export const PackageIcon = (p: P) => (
  <Icon {...p}>
    <rect x="4" y="7" width="16" height="13" rx="2" />
    <path d="M3.5 7h17M9.5 11h5M8 4h8l1.5 3h-11z" />
  </Icon>
);
export const ClipboardIcon = (p: P) => (
  <Icon {...p}>
    <rect x="5" y="5" width="14" height="15.5" rx="2" />
    <path d="M9 5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M8.5 11l2 2 4-4M8.5 16.5h7" />
  </Icon>
);
export const BookIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H18v14H6.5A1.5 1.5 0 0 0 5 19.5z" />
    <path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H18v-3" />
  </Icon>
);
export const WalletIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17a1 1 0 0 1 1 1v2" />
    <rect x="4" y="8" width="16.5" height="11.5" rx="2" />
    <path d="M16 13.75h1.5" />
  </Icon>
);
export const ChartIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 4.5v13A2.5 2.5 0 0 0 6.5 20h13" />
    <path d="m7.5 15 3.5-4 3 2.5 4.5-6" />
  </Icon>
);
export const DocIcon = (p: P) => (
  <Icon {...p}>
    <path d="M7 3.5h6.5L18.5 8.5V19a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5z" />
    <path d="M13 3.5V9h5.5M8.5 13h7M8.5 16.5h5" />
  </Icon>
);
export const FolderIcon = (p: P) => (
  <Icon {...p}>
    <path d="M3.5 7A1.5 1.5 0 0 1 5 5.5h4l2 2h8A1.5 1.5 0 0 1 20.5 9v9a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18z" />
  </Icon>
);
export const ImageIcon = (p: P) => (
  <Icon {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m4 17.5 4.5-4.5 3.5 3.5 2.5-2.5 5.5 5" />
  </Icon>
);
export const ShieldIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 3.5 19 6v5.5c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
);
// Kính lúp trên trang: cài đặt SEO
export const SeoIcon = (p: P) => (
  <Icon {...p}>
    <path d="M13 19.5H6A1.5 1.5 0 0 1 4.5 18V6A1.5 1.5 0 0 1 6 4.5h12A1.5 1.5 0 0 1 19.5 6v5" />
    <path d="M8 9h8M8 12.5h4" />
    <circle cx="16.5" cy="16.5" r="2.5" />
    <path d="m18.5 18.5 2 2" />
  </Icon>
);

export const LogoutIcon = (p: P) => (
  <Icon {...p}>
    <path d="M14 4.5H7A1.5 1.5 0 0 0 5.5 6v12A1.5 1.5 0 0 0 7 19.5h7" />
    <path d="M10.5 12h9M16.5 8.5 20 12l-3.5 3.5" />
  </Icon>
);
