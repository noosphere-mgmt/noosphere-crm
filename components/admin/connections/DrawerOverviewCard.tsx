"use client";

import { CompanyOverviewSection } from "@/components/admin/connections/CompanyOverviewSection";

function gridColClass(columns: 1 | 2 | 3, mobileColumns?: 1 | 2 | 3): string {
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
}

function overviewGridClass(columns: 1 | 2 | 3, dense: boolean, mobileColumns?: 1 | 2 | 3): string {
  return `grid w-full ${gridColClass(columns, mobileColumns)} content-start [&>*]:min-w-0 ${
    dense ? "mt-1.5 gap-x-3 gap-y-1" : "mt-3 gap-x-4 gap-y-3"
  }`;
}

export function DrawerOverviewCard({
  title,
  children,
  className = "",
  dense = true,
  columns = 2,
  mobileColumns,
  matchHeight = false,
  bare = false,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  dense?: boolean;
  columns?: 1 | 2 | 3;
  /** When set, overrides column count below the `md` breakpoint. */
  mobileColumns?: 1 | 2 | 3;
  matchHeight?: boolean;
  bare?: boolean;
}) {
  const shellClass = `w-full rounded-lg bg-white ${
    matchHeight ? "flex h-full flex-col" : "h-fit"
  } ${
    dense
      ? "px-2.5 pt-2 pb-2 [&_dd]:mt-px [&_dd]:leading-tight [&_dt]:leading-none"
      : "p-3.5 [&_dd]:mt-1 [&_dd]:leading-relaxed [&_dt]:leading-normal"
  } ${className}`;

  const headingClass = `text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap ${
    dense ? "pb-1" : "pb-2"
  }`;

  if (bare) {
    return (
      <div className={shellClass}>
        <h3 className={headingClass}>{title}</h3>
        <div className={overviewGridClass(columns, dense, mobileColumns)}>{children}</div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <CompanyOverviewSection
        title={title}
        dense={dense}
        columns={columns}
        mobileColumns={mobileColumns}
        fill={matchHeight}
        className={matchHeight ? "flex min-h-0 flex-1 flex-col" : undefined}
      >
        {children}
      </CompanyOverviewSection>
    </div>
  );
}
