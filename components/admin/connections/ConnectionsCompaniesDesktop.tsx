"use client";

import { ConnectionsRelationshipTypeFilters } from "@/components/admin/connections/ConnectionsRelationshipTypeFilters";
import { ConnectionsSearchToolbarDesktop } from "@/components/admin/connections/ConnectionsSearchToolbarDesktop";
import { ConnectionsCompaniesListDesktop } from "@/components/admin/connections/ConnectionsCompaniesListDesktop";
import { ConnectionsCompaniesListHeaderDesktop } from "@/components/admin/connections/ConnectionsCompaniesListHeaderDesktop";
import { ListingRecordCount } from "@/components/admin/ListingRecordCount";
import type { ConnectionsCompaniesListState } from "@/components/admin/connections/useConnectionsCompaniesList";

export function ConnectionsCompaniesDesktop({ state }: { state: ConnectionsCompaniesListState }) {
  return (
    <>
      <ConnectionsCompaniesListHeaderDesktop exportSelectedIds={state.exportSelectedIds} />
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
