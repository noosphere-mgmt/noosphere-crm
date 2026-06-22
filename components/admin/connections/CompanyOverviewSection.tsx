"use client";

export function CompanyOverviewSection({
  title,
  children,
  className = "",
  dense = false,
  columns = 2,
  mobileColumns,
  fill = false,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  dense?: boolean;
  columns?: 1 | 2 | 3;
  mobileColumns?: 1 | 2 | 3;
  fill?: boolean;
}) {
  const colClass = (() => {
    if (!mobileColumns || mobileColumns === columns) {
      if (columns === 1) return "grid-cols-1";
      if (columns === 3) return "grid-cols-3";
      return "grid-cols-2";
    }
    const mobile =
      mobileColumns === 1 ? "grid-cols-1" : mobileColumns === 3 ? "grid-cols-3" : "grid-cols-2";
    const desktop =
      columns === 1 ? "md:grid-cols-1" : columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2";
    return `${mobile} ${desktop}`;
  })();

  return (
    <section className={`w-full ${className}`}>
      <h3
        className={`text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap ${dense ? "pb-1" : "pb-2"}`}
      >
        {title}
      </h3>
      <dl
        className={`grid w-full ${colClass} content-start ${
          dense ? "mt-1.5 gap-x-3 gap-y-0.5" : "mt-3 gap-x-4 gap-y-3"
        } ${fill ? "flex-1" : ""}`}
      >
        {children}
      </dl>
    </section>
  );
}
