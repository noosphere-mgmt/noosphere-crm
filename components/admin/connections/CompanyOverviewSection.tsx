"use client";

export function CompanyOverviewSection({
  title,
  children,
  className = "",
  dense = false,
  columns = 2,
  fill = false,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  dense?: boolean;
  columns?: 1 | 2 | 3;
  fill?: boolean;
}) {
  const colClass =
    columns === 1 ? "grid-cols-1" : columns === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <section className={`w-full ${className}`}>
      <h3
        className={`border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500 ${dense ? "pb-1" : "pb-2"}`}
      >
        {title}
      </h3>
      <dl
        className={`grid w-full ${colClass} content-start ${
          dense ? "mt-1.5 gap-x-3 gap-y-0.5" : "mt-3 gap-x-4 gap-y-2.5"
        } ${fill ? "flex-1" : ""}`}
      >
        {children}
      </dl>
    </section>
  );
}
