"use client";

import { ListingRecordCount } from "@/components/admin/ListingRecordCount";
import { OpportunitiesKpiStrip } from "@/components/admin/opportunities/OpportunitiesKpiStrip";
import { OpportunitiesListDesktop } from "@/components/admin/opportunities/OpportunitiesListDesktop";
import { OpportunitiesListHeaderDesktop } from "@/components/admin/opportunities/OpportunitiesListHeaderDesktop";
import { OpportunitiesSearchToolbarDesktop } from "@/components/admin/opportunities/OpportunitiesSearchToolbarDesktop";
import type { OpportunitiesListState } from "@/components/admin/opportunities/useOpportunitiesList";

export function OpportunitiesDesktop({
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
      <OpportunitiesListHeaderDesktop onNewOpportunity={onNewOpportunity} />
      <OpportunitiesKpiStrip rows={state.rows} />
      <OpportunitiesSearchToolbarDesktop
        searchQuery={state.searchQuery}
        onSearchChange={state.setSearchQuery}
        quickFilters={state.quickFilters}
        onQuickFiltersChange={state.setQuickFilters}
      />
      <ListingRecordCount
        filteredCount={state.displayedRows.length}
        totalCount={state.rows.length}
        label="Opportunities"
        selectedCount={state.selectedCount}
      />
      <OpportunitiesListDesktop state={state} onQuickView={onQuickView} />
    </>
  );
}
