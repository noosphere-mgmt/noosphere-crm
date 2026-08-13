"use client";

import { ConnectionsSearchToolbarDesktop } from "@/components/admin/connections/ConnectionsSearchToolbarDesktop";
import { ConnectionsCompaniesListDesktop } from "@/components/admin/connections/ConnectionsCompaniesListDesktop";
import { ConnectionsCompaniesListHeaderDesktop } from "@/components/admin/connections/ConnectionsCompaniesListHeaderDesktop";
import { ConnectionsRelationshipTypeFilters } from "@/components/admin/connections/ConnectionsRelationshipTypeFilters";
import { ListingRecordCount } from "@/components/admin/ListingRecordCount";
import type { ConnectionsCompaniesListState } from "@/components/admin/connections/useConnectionsCompaniesList";

/** Flat companies maintenance table (aligned with Buildings). */
export function ConnectionsCompaniesFlatDesktop({
  state,
}: {
  state: ConnectionsCompaniesListState;
}) {
  return (
    <>
      <ConnectionsCompaniesListHeaderDesktop
        exportSelectedIds={state.exportSelectedIds}
        filteredIds={state.displayedIds}
      />
      <ConnectionsSearchToolbarDesktop
        variant="companies"
        searchQuery={state.searchQuery}
        onSearchChange={state.setSearchQuery}
        quickFilters={state.quickFilters}
        onQuickFiltersChange={state.setQuickFilters}
        countries={state.countries}
        cities={state.cities}
        relationshipTypeSlot={<ConnectionsRelationshipTypeFilters />}
      />
      <ListingRecordCount
        filteredCount={state.displayedRows.length}
        totalCount={state.rows.length}
        label="Companies"
        selectedCount={state.selectedCount}
      />
      <ConnectionsCompaniesListDesktop state={state} />
    </>
  );
}
