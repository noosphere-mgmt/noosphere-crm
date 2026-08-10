"use client";

import { ListingRecordCount } from "@/components/admin/ListingRecordCount";
import { OpportunitiesListHeaderMobile } from "@/components/admin/opportunities/OpportunitiesListHeaderMobile";
import { OpportunitiesListMobile } from "@/components/admin/opportunities/OpportunitiesListMobile";
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
      <OpportunitiesSearchToolbarMobile
        searchQuery={state.searchQuery}
        onSearchChange={state.setSearchQuery}
        listStatusFilter={state.listStatusFilter}
        onListStatusFilterChange={state.setListStatusFilter}
        statusFilterCounts={state.statusFilterCounts}
        usingLegacyStatusFilter={state.usingLegacyStatusFilter}
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
