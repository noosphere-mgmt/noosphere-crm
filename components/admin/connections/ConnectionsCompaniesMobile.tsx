"use client";

import { ConnectionsModuleToolbar } from "@/components/admin/connections/ConnectionsModuleToolbar";
import { ConnectionsSearchToolbarMobile } from "@/components/admin/connections/ConnectionsSearchToolbarMobile";
import { ConnectionsCompaniesListMobile } from "@/components/admin/connections/ConnectionsCompaniesListMobile";
import { ListingRecordCount } from "@/components/admin/ListingRecordCount";
import type { ConnectionsCompaniesListState } from "@/components/admin/connections/useConnectionsCompaniesList";

export function ConnectionsCompaniesMobile({ state }: { state: ConnectionsCompaniesListState }) {
  return (
    <>
      <ConnectionsModuleToolbar createHref="/admin/companies/new" createLabel="New company" />
      <ConnectionsSearchToolbarMobile
        variant="companies"
        searchQuery={state.searchQuery}
        onSearchChange={state.setSearchQuery}
        quickFilters={state.quickFilters}
        onQuickFiltersChange={state.setQuickFilters}
      />
      <ListingRecordCount
        filteredCount={state.displayedRows.length}
        totalCount={state.rows.length}
        label="Companies"
        selectedCount={state.selectedCount}
      />
      <ConnectionsCompaniesListMobile state={state} />
    </>
  );
}
