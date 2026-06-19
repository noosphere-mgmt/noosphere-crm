"use client";

import { CompanyOverviewSection } from "@/components/admin/connections/CompanyOverviewSection";

export function DrawerOverviewCard({
  title,
  children,
  className = "",
  dense = true,
  columns = 2,
  matchHeight = false,
  bare = false,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  dense?: boolean;
  columns?: 1 | 2 | 3;
  matchHeight?: boolean;
  bare?: boolean;
}) {
  const shellClass = `w-full rounded-lg border border-slate-200 bg-white shadow-sm ${
    matchHeight ? "flex h-full flex-col" : "h-fit"
  } ${
    dense
      ? "px-2.5 pt-2 pb-2 [&_dd]:mt-px [&_dd]:leading-tight [&_dt]:leading-none"
      : "p-3.5 [&_dd]:mt-0.5 [&_dd]:leading-snug [&_dt]:leading-normal"
  } ${className}`;

  const headingClass = `border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
    dense ? "pb-1" : "pb-2"
  }`;

  if (bare) {
    return (
      <div className={shellClass}>
        <h3 className={headingClass}>{title}</h3>
        <div className={dense ? "mt-1.5" : "mt-3"}>{children}</div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <CompanyOverviewSection
        title={title}
        dense={dense}
        columns={columns}
        fill={matchHeight}
        className={matchHeight ? "flex min-h-0 flex-1 flex-col" : undefined}
      >
        {children}
      </CompanyOverviewSection>
    </div>
  );
}
