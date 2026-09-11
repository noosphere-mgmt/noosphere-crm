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
  fillViewport,
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  wide?: boolean;
  module?: AdminModuleKey;
  hideHeader?: boolean;
  /** Lock the page to the viewport so nested list panes can fill leftover height. */
  fillViewport?: boolean;
}) {
  const maxWidth = wide ? "max-w-[1800px]" : "max-w-7xl";
  const shellBg = moduleAccentClasses(module).shellBg ?? "bg-[#f4f6f8]";

  return (
    <AdminChromeProviders>
      <div
        className={
          fillViewport
            ? `admin-fill-viewport flex min-h-dvh max-w-full flex-col pt-[env(safe-area-inset-top)] max-md:overflow-x-clip md:h-dvh md:max-h-dvh md:overflow-clip md:[contain:strict] ${shellBg}`
            : `max-w-full overflow-x-clip pt-[env(safe-area-inset-top)] min-h-screen ${shellBg}`
        }
      >
        <Suspense fallback={<div className="h-14 shrink-0 border-b border-slate-200 bg-white" />}>
          <AdminTopNav />
        </Suspense>

        <div
          className={
            fillViewport
              ? `mx-auto flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col ${maxWidth} px-3 py-2 sm:px-4 max-md:pb-[calc(5.25rem+env(safe-area-inset-bottom))] md:overflow-clip md:px-6 md:py-3`
              : `mx-auto w-full min-w-0 max-w-full ${maxWidth} px-3 py-2 pb-[calc(5.25rem+env(safe-area-inset-bottom))] sm:px-4 ${
                  module === "dashboard"
                    ? "md:pt-4 lg:px-6 lg:pb-4"
                    : "md:py-6 lg:px-6 lg:pb-6"
                }`
          }
        >
          {hideHeader ? null : (
            <ModulePageHeader title={title} module={module} actions={actions} />
          )}
          {fillViewport ? (
            <div className="flex min-h-0 flex-1 flex-col md:overflow-clip">{children}</div>
          ) : (
            children
          )}
        </div>
        <AdminBottomNav />
      </div>
    </AdminChromeProviders>
  );
}
