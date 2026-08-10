"use client";

import { AdminViewportSwitch } from "@/components/admin/layout/AdminViewportSwitch";
import { OpportunitiesDesktop } from "@/components/admin/opportunities/OpportunitiesDesktop";
import { OpportunitiesMobile } from "@/components/admin/opportunities/OpportunitiesMobile";
import { useOpportunitiesList } from "@/components/admin/opportunities/useOpportunitiesList";
import type {
  OpportunitiesDashboardStage,
  OpportunitiesListStatusFilter,
} from "@/lib/opportunitiesList";
import type { Opportunity, OpportunityStatus } from "@/lib/types/entities";

export function OpportunitiesListClient({
  rows,
  onOpenWorkspace,
  onNewOpportunity,
  onCaptureRequirement,
  initialListStatusFilter,
  initialLegacyStatuses,
  initialDashboardStage,
}: {
  rows: Opportunity[];
  onOpenWorkspace: (row: Opportunity) => void;
  onNewOpportunity: () => void;
  onCaptureRequirement: () => void;
  initialListStatusFilter?: OpportunitiesListStatusFilter;
  initialLegacyStatuses?: OpportunityStatus[];
  initialDashboardStage?: OpportunitiesDashboardStage;
}) {
  const state = useOpportunitiesList(
    rows,
    initialListStatusFilter,
    initialLegacyStatuses,
    initialDashboardStage,
  );

  return (
    <AdminViewportSwitch
      mobile={
        <OpportunitiesMobile state={state} onOpenWorkspace={onOpenWorkspace} onNewOpportunity={onNewOpportunity} />
      }
      desktop={
        <OpportunitiesDesktop state={state} onOpenWorkspace={onOpenWorkspace} onNewOpportunity={onNewOpportunity} onCaptureRequirement={onCaptureRequirement} />
      }
    />
  );
}
