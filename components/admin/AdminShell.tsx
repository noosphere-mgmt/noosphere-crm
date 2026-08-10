import { Suspense } from "react";
import { AdminBottomNav } from "@/components/admin/AdminBottomNav";
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
    <div className={`min-h-screen ${shellBg} pt-[env(safe-area-inset-top)]`}>
      <Suspense fallback={<div className="h-14 border-b border-slate-200 bg-white" />}>
        <AdminTopNav />
      </Suspense>

      <div
        className={`mx-auto ${maxWidth} px-4 py-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:py-6 lg:px-6 lg:pb-6`}
      >
        {hideHeader ? null : (
          <ModulePageHeader title={title} module={module} actions={actions} />
        )}
        {children}
      </div>
      <AdminBottomNav />
    </div>
  );
}
