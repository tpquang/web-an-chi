const sizes = {
  sm: "size-4 border-2",
  md: "size-5 border-2",
  lg: "size-8 border-3",
};

// Kiểu loading duy nhất cho hành động, theo anchi-ui-ux/references/loading.md
export function Spinner({ size = "sm" }: { size?: keyof typeof sizes }) {
  return (
    <span
      aria-hidden
      className={`inline-block animate-spin rounded-full border-current border-r-transparent [animation-duration:700ms] motion-reduce:[animation-duration:2s] ${sizes[size]}`}
    />
  );
}
