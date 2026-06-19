"use client";

import type { ReactNode } from "react";
import { ModulePageHeader } from "@/components/admin/ModulePageHeader";
import { PropertiesModuleNav } from "@/components/admin/properties-v1/PropertiesModuleNav";

export function PropertiesModuleHeader({ actions }: { actions?: ReactNode }) {
  return (
    <ModulePageHeader
      title="Properties"
      module="properties"
      tabs={<PropertiesModuleNav embedded />}
      actions={actions}
    />
  );
}
