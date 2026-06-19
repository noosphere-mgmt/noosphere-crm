"use client";

import type { ReactNode } from "react";
import { ModulePageHeader } from "@/components/admin/ModulePageHeader";
import { ConnectionsModuleNav } from "@/components/admin/connections/ConnectionsModuleNav";

export function ConnectionsModuleHeader({ actions }: { actions?: ReactNode }) {
  return (
    <ModulePageHeader
      title="Connections"
      module="connections"
      tabs={<ConnectionsModuleNav embedded />}
      actions={actions}
    />
  );
}
