import { Suspense } from "react";
import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import { AdminNav } from "@/components/admin/AdminNav";
import { ModulePageHeader } from "@/components/admin/ModulePageHeader";
import type { AdminModuleKey } from "@/components/admin/moduleTheme";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";

export function AdminShell({
  title,
  children,
  actions,
  wide,
  module,
  hideHeader,
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  wide?: boolean;
  module?: AdminModuleKey;
  hideHeader?: boolean;
}) {
  const maxWidth = wide ? "max-w-[1600px]" : "max-w-6xl";
  const theme = moduleAccentClasses(module);
  const shellBg = theme.shellBg ?? "bg-slate-50";
  const brandBarClass = `mb-5 rounded-xl px-4 py-3 shadow-sm ${theme.brandBar}`;

  return (
    <div className={`min-h-screen ${shellBg} pt-[env(safe-area-inset-top)]`}>
      <div
      className={`mx-auto ${maxWidth} px-3 py-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:px-4 md:py-4 lg:px-4 lg:py-6 lg:pb-6`}
      >
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:sticky lg:block lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className={brandBarClass}>
                <p className="text-xs font-semibold uppercase tracking-wider/relaxed opacity-90">Noosphere CRM</p>
                <p className="mt-1 text-base font-semibold leading-tight">Brokerage workspace</p>
              </div>
              <Suspense fallback={<div className="h-24 animate-pulse rounded-lg bg-slate-100" />}>
                <AdminNav />
              </Suspense>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="mb-2 md:mb-4 lg:hidden">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Noosphere CRM</p>
            </div>
            {hideHeader ? null : (
              <ModulePageHeader title={title} module={module} actions={actions} />
            )}
            {children}
          </div>
        </div>
      </div>
      <AdminBottomNav />
    </div>
  );
}
