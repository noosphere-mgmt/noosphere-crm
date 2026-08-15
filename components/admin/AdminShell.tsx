import { Suspense } from "react";
import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
import { AdminChromeProviders } from "@/components/admin/AdminChromeProviders";
import { AdminTopNav } from "@/components/admin/AdminTopNav";
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
  const maxWidth = wide ? "max-w-[1800px]" : "max-w-7xl";
  const shellBg = moduleAccentClasses(module).shellBg ?? "bg-[#f4f6f8]";

  return (
    <AdminChromeProviders>
      <div className={`min-h-screen max-w-full overflow-x-clip ${shellBg} pt-[env(safe-area-inset-top)]`}>
        <Suspense fallback={<div className="h-14 border-b border-slate-200 bg-white" />}>
          <AdminTopNav />
        </Suspense>

        <div
          className={`mx-auto min-w-0 ${maxWidth} px-3 py-3 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-4 md:py-6 lg:px-6 lg:pb-6`}
        >
          {hideHeader ? null : (
            <ModulePageHeader title={title} module={module} actions={actions} />
          )}
          {children}
        </div>
        <AdminBottomNav />
      </div>
    </AdminChromeProviders>
  );
}
