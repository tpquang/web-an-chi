export function PlaceholderPage({ title }: { title: string }) {
  return (
    <>
      <h1 className="mb-2 text-2xl font-semibold">{title}</h1>
      <p className="text-ink-2">Màn hình này chưa được xây dựng.</p>
    </>
  );
}
