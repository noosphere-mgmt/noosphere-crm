"use client";

import { ListingRecordCount } from "@/components/admin/ListingRecordCount";
import { OpportunitiesListHeaderMobile } from "@/components/admin/opportunities/OpportunitiesListHeaderMobile";
import { OpportunitiesListMobile } from "@/components/admin/opportunities/OpportunitiesListMobile";
import { OpportunitiesSearchToolbarMobile } from "@/components/admin/opportunities/OpportunitiesSearchToolbarMobile";
import type { OpportunitiesListState } from "@/components/admin/opportunities/useOpportunitiesList";

export function OpportunitiesMobile({
  state,
  onQuickView,
  onNewOpportunity,
}: {
  state: OpportunitiesListState;
  onQuickView: (id: number) => void;
  onNewOpportunity: () => void;
}) {
  return (
    <>
      <OpportunitiesListHeaderMobile onNewOpportunity={onNewOpportunity} />
      <OpportunitiesSearchToolbarMobile
        searchQuery={state.searchQuery}
        onSearchChange={state.setSearchQuery}
      />
      <ListingRecordCount
        filteredCount={state.displayedRows.length}
        totalCount={state.rows.length}
        label="Opportunities"
        selectedCount={state.selectedCount}
      />
      <OpportunitiesListMobile state={state} onQuickView={onQuickView} />
    </>
  );
}
