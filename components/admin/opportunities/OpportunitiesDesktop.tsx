"use client";

import { ListingRecordCount } from "@/components/admin/ListingRecordCount";
import { OpportunitiesKpiStrip } from "@/components/admin/opportunities/OpportunitiesKpiStrip";
import { OpportunitiesListDesktop } from "@/components/admin/opportunities/OpportunitiesListDesktop";
import { OpportunitiesListHeaderDesktop } from "@/components/admin/opportunities/OpportunitiesListHeaderDesktop";
import { OpportunitiesSearchToolbarDesktop } from "@/components/admin/opportunities/OpportunitiesSearchToolbarDesktop";
import { OpportunitiesSalesCopilot } from "@/components/admin/opportunities/OpportunitiesSalesCopilot";
import type { OpportunitiesListState } from "@/components/admin/opportunities/useOpportunitiesList";

export function OpportunitiesDesktop({
  state,
  onOpenWorkspace,
  onNewOpportunity,
  onCaptureRequirement,
}: {
  state: OpportunitiesListState;
  onOpenWorkspace: (row: import("@/lib/types/entities").Opportunity) => void;
  onNewOpportunity: () => void;
  onCaptureRequirement: () => void;
}) {
  return (
    <>
      <OpportunitiesListHeaderDesktop onNewOpportunity={onNewOpportunity} onCaptureRequirement={onCaptureRequirement} />
      <OpportunitiesKpiStrip rows={state.rows} />
      <OpportunitiesSalesCopilot rows={state.rows} />
      <OpportunitiesSearchToolbarDesktop
        searchQuery={state.searchQuery}
        onSearchChange={state.setSearchQuery}
        listStatusFilter={state.listStatusFilter}
        onListStatusFilterChange={state.setListStatusFilter}
        statusFilterCounts={state.statusFilterCounts}
        usingLegacyStatusFilter={state.usingLegacyStatusFilter}
        dashboardStage={state.dashboardStage}
      />
      <ListingRecordCount
        filteredCount={state.displayedRows.length}
        totalCount={state.rows.length}
        label="Opportunities"
        selectedCount={state.selectedCount}
      />
      <OpportunitiesListDesktop state={state} onOpenWorkspace={onOpenWorkspace} />
    </>
  );
}
