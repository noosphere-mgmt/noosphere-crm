"use client";

import { ConnectionsSearchToolbarMobile } from "@/components/admin/connections/ConnectionsSearchToolbarMobile";
import { ConnectionsCompaniesListMobile } from "@/components/admin/connections/ConnectionsCompaniesListMobile";
import { ConnectionsCompaniesListHeaderMobile } from "@/components/admin/connections/ConnectionsCompaniesListHeaderMobile";
import { ListingRecordCount } from "@/components/admin/ListingRecordCount";
import type { ConnectionsCompaniesListState } from "@/components/admin/connections/useConnectionsCompaniesList";

export function ConnectionsCompaniesMobile({ state }: { state: ConnectionsCompaniesListState }) {
  return (
    <>
      <ConnectionsCompaniesListHeaderMobile />
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
      />
      <ConnectionsCompaniesListMobile state={state} />
    </>
  );
}
