"use client";

import type { ReactNode } from "react";
import { ModulePageHeader } from "@/components/admin/ModulePageHeader";

export function OpportunitiesModuleHeader({ actions }: { actions?: ReactNode }) {
  return (
    <ModulePageHeader
      title="Opportunities"
      module="opportunities"
      tabs={<p className="text-sm text-slate-600">Requirements &amp; proposals</p>}
      actions={actions}
    />
  );
}
