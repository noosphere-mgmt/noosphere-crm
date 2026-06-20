"use client";

import { ListingRecordCount } from "@/components/admin/ListingRecordCount";
import { OpportunitiesListMobile } from "@/components/admin/opportunities/OpportunitiesListMobile";
import { OpportunitiesModuleToolbar } from "@/components/admin/opportunities/OpportunitiesModuleToolbar";
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
      <OpportunitiesModuleToolbar onCreate={onNewOpportunity} createLabel="New opportunity" />
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
