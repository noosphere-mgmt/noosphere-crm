import type { ReactNode } from "react";
import type { AdminModuleKey } from "@/components/admin/moduleTheme";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";

export function ModulePageHeader({
  title,
  module,
  tabs,
  actions,
  compact,
}: {
  title: string;
  module?: AdminModuleKey;
  tabs?: ReactNode;
  actions?: ReactNode;
  /** Tighter padding; title and tabs sit on one row. */
  compact?: boolean;
}) {
  const theme = moduleAccentClasses(module);
  const hasTabs = Boolean(tabs);
  const skipMinHeight = hasTabs || compact;

  return (
    <header
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${theme.headerBar} ${
        compact ? "mb-2" : "mb-3"
      } ${skipMinHeight ? "" : "min-h-[72px]"}`}
    >
      <div
        className={`flex flex-col lg:flex-row lg:items-center lg:justify-between ${
          compact ? "gap-1.5 px-3 py-1.5 sm:px-4" : "gap-2 px-4 py-3 sm:px-5 sm:py-3"
        } ${skipMinHeight ? "" : "min-h-[72px]"}`}
      >
        <div
          className={
            compact && hasTabs
              ? "flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1"
              : `flex min-w-0 flex-col ${hasTabs ? "gap-1.5" : "justify-center"}`
          }
        >
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
          {tabs}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
