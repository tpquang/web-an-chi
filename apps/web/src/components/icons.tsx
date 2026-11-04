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
