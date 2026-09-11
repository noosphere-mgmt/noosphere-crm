"use client";

import { ListingRecordCount } from "@/components/admin/ListingRecordCount";
import { OpportunitiesKpiStrip } from "@/components/admin/opportunities/OpportunitiesKpiStrip";
import { OpportunitiesListHeaderMobile } from "@/components/admin/opportunities/OpportunitiesListHeaderMobile";
import { OpportunitiesListMobile } from "@/components/admin/opportunities/OpportunitiesListMobile";
import { OpportunitiesOperationStatusMeter } from "@/components/admin/opportunities/OpportunitiesOperationStatusMeter";
import { OpportunitiesSearchToolbarMobile } from "@/components/admin/opportunities/OpportunitiesSearchToolbarMobile";
import type { OpportunitiesListState } from "@/components/admin/opportunities/useOpportunitiesList";

export function OpportunitiesMobile({
  state,
  onOpenWorkspace,
  onNewOpportunity,
}: {
  state: OpportunitiesListState;
  onOpenWorkspace: (row: import("@/lib/types/entities").Opportunity) => void;
  onNewOpportunity: () => void;
}) {
  return (
    <>
      <OpportunitiesListHeaderMobile onNewOpportunity={onNewOpportunity} />
      <OpportunitiesKpiStrip
        rows={state.rows}
        selectedKpi={state.kpiFilter}
        onKpiFilterChange={state.setKpiFilter}
      />
      <OpportunitiesOperationStatusMeter
        listStatusFilter={state.listStatusFilter}
        onListStatusFilterChange={state.setListStatusFilter}
        counts={state.statusFilterCounts}
        usingLegacyStatusFilter={state.usingLegacyStatusFilter}
      />
      <OpportunitiesSearchToolbarMobile
        searchQuery={state.searchQuery}
        onSearchChange={state.setSearchQuery}
        listStatusFilter={state.listStatusFilter}
        onListStatusFilterChange={state.setListStatusFilter}
        usingLegacyStatusFilter={state.usingLegacyStatusFilter}
        rows={state.rows}
      />
      <ListingRecordCount
        filteredCount={state.displayedRows.length}
        totalCount={state.rows.length}
        label="Opportunities"
      />
      <OpportunitiesListMobile state={state} onOpenWorkspace={onOpenWorkspace} />
    </>
  );
}
