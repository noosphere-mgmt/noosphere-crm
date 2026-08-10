"use client";

import { AdminViewportSwitch } from "@/components/admin/layout/AdminViewportSwitch";
import { OpportunitiesListHeaderDesktop } from "@/components/admin/opportunities/OpportunitiesListHeaderDesktop";
import { OpportunitiesListHeaderMobile } from "@/components/admin/opportunities/OpportunitiesListHeaderMobile";
import type { Opportunity } from "@/lib/types/entities";

export function OpportunitiesListHeader({
  onNewOpportunity,
}: {
  rows: Opportunity[];
  onNewOpportunity: () => void;
}) {
  return (
    <AdminViewportSwitch
      desktop={<OpportunitiesListHeaderDesktop onNewOpportunity={onNewOpportunity} onCaptureRequirement={onNewOpportunity} />}
      mobile={<OpportunitiesListHeaderMobile onNewOpportunity={onNewOpportunity} />}
    />
  );
}
