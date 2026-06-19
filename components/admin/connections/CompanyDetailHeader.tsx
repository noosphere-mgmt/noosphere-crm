"use client";

import type { ReactNode } from "react";
import { ModulePageHeader } from "@/components/admin/ModulePageHeader";
import { CompanyDetailTabs } from "@/components/admin/CompanyDetailTabs";

export function CompanyDetailHeader({
  title,
  companyId,
  actions,
}: {
  title: string;
  companyId: number;
  actions?: ReactNode;
}) {
  return (
    <ModulePageHeader
      title={title}
      module="connections"
      tabs={<CompanyDetailTabs embedded companyId={companyId} />}
      actions={actions}
    />
  );
}
