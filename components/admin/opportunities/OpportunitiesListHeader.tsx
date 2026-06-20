"use client";

import { AdminViewportSwitch } from "@/components/admin/layout/AdminViewportSwitch";
import { OpportunitiesListHeaderDesktop } from "@/components/admin/opportunities/OpportunitiesListHeaderDesktop";
import { OpportunitiesModuleToolbar } from "@/components/admin/opportunities/OpportunitiesModuleToolbar";
import type { Opportunity } from "@/lib/types/entities";

export function OpportunitiesListHeader({
  rows: _rows,
  onNewOpportunity,
}: {
  rows: Opportunity[];
  onNewOpportunity: () => void;
}) {
  return (
    <AdminViewportSwitch
      desktop={<OpportunitiesListHeaderDesktop onNewOpportunity={onNewOpportunity} />}
      mobile={<OpportunitiesModuleToolbar onCreate={onNewOpportunity} createLabel="New opportunity" />}
    />
  );
}
