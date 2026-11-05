import type { SVGProps } from "react";

// Khung 24, nét 1.5, đầu tròn, góc bo mềm, không góc nhọn, theo anchi-ui-ux/references/foundations.md
function Icon({ children, size = 20, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
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

type P = SVGProps<SVGSVGElement> & { size?: number };

export const BagIcon = (p: P) => (
  <Icon {...p}>
    <path d="M6.2 8h11.6a1.5 1.5 0 0 1 1.5 1.6l-.7 8.6a2.5 2.5 0 0 1-2.5 2.3H7.9a2.5 2.5 0 0 1-2.5-2.3l-.7-8.6A1.5 1.5 0 0 1 6.2 8Z" />
    <path d="M9 10.5V7a3 3 0 0 1 6 0v3.5" />
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

export const MinusIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 12h14" />
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

export const CloseIcon = (p: P) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);

export const ExternalIcon = (p: P) => (
  <Icon {...p}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Icon>
);

export const CheckIcon = (p: P) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
);

export const AlertIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.5v.01" />
  </Icon>
);

export const MenuIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4.5 7.5h15M4.5 12h15M4.5 16.5h9" />
  </Icon>
);

export const UserIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="8.5" r="3.75" />
    <path d="M5.5 19.2c.9-2.9 3.5-4.7 6.5-4.7s5.6 1.8 6.5 4.7c.2.7-.3 1.3-1 1.3H6.5c-.7 0-1.2-.6-1-1.3Z" />
  </Icon>
);

export const ChevronDownIcon = (p: P) => (
  <Icon {...p}>
    <path d="m7 10 5 4.5 5-4.5" />
  </Icon>
);

export const ChatIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 5.5h16v10H9l-5 4v-14Z" />
    <path d="M8 9.5h8M8 12.5h5" />
  </Icon>
);

export const SendIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 12 20 4l-6 16-3-7-7-1Z" />
  </Icon>
);

export const UndoIcon = (p: P) => (
  <Icon {...p}>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </Icon>
);

export const ResetIcon = (p: P) => (
  <Icon {...p}>
    <path d="M20 12a8 8 0 1 1-2.3-5.7" />
    <path d="M20 4v4.5h-4.5" />
  </Icon>
);

export const SpinIcon = (p: P) => (
  <Icon {...p}>
    <ellipse cx="12" cy="12" rx="9" ry="4" />
    <path d="m15 6.5 2 1.5-2 1.7" />
    <circle cx="12" cy="12" r="1" />
  </Icon>
);

export const ArrowRightIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5" />
  </Icon>
);

export const ArrowLeftIcon = (p: P) => (
  <Icon {...p}>
    <path d="M19 12H5M10.5 6.5 5 12l5.5 5.5" />
  </Icon>
);

export const TruckIcon = (p: P) => (
  <Icon {...p}>
    <path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h8a1.5 1.5 0 0 1 1.5 1.5V16h-11Z" />
    <path d="M14.5 10h3.2a1.5 1.5 0 0 1 1.2.6l1.3 1.8a1.5 1.5 0 0 1 .3.9V16h-6" />
    <circle cx="7.5" cy="17" r="1.8" />
    <circle cx="17" cy="17" r="1.8" />
  </Icon>
);

export const ShieldIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 3.5 5.5 6v5.2c0 4 2.7 7.4 6.5 8.8 3.8-1.4 6.5-4.8 6.5-8.8V6Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </Icon>
);
