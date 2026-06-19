import type { ReactNode } from "react";
import type { AdminModuleKey } from "@/components/admin/moduleTheme";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";

export function ModulePageHeader({
  title,
  module,
  tabs,
  actions,
}: {
  title: string;
  module?: AdminModuleKey;
  tabs?: ReactNode;
  actions?: ReactNode;
}) {
  const theme = moduleAccentClasses(module);
  const hasTabs = Boolean(tabs);

  return (
    <header
      className={`mb-4 rounded-xl border border-slate-200 bg-white shadow-sm ${theme.headerBar} ${
        hasTabs ? "" : "min-h-[88px]"
      }`}
    >
      <div
        className={`flex flex-col gap-3 px-4 py-4 sm:px-6 sm:py-6 lg:flex-row lg:items-center lg:justify-between ${
          hasTabs ? "" : "min-h-[88px]"
        }`}
      >
        <div className={`flex min-w-0 flex-col ${hasTabs ? "gap-2" : "justify-center"}`}>
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
