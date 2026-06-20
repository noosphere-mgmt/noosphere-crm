"use client";

import { ConnectionsModuleToolbar } from "@/components/admin/connections/ConnectionsModuleToolbar";
import { ConnectionsSearchToolbarMobile } from "@/components/admin/connections/ConnectionsSearchToolbarMobile";
import { ConnectionsContactsListMobile } from "@/components/admin/connections/ConnectionsContactsListMobile";
import { ListingRecordCount } from "@/components/admin/ListingRecordCount";
import type { ConnectionsContactsListState } from "@/components/admin/connections/useConnectionsContactsList";

export function ConnectionsContactsMobile({
  state,
  onOpenContact,
  onNewContact,
}: {
  state: ConnectionsContactsListState;
  onOpenContact: (id: number) => void;
  onNewContact: () => void;
}) {
  return (
    <>
      <ConnectionsModuleToolbar onCreate={onNewContact} createLabel="New contact" />
      <ConnectionsSearchToolbarMobile
        variant="contacts"
        searchQuery={state.searchQuery}
        onSearchChange={state.setSearchQuery}
        quickFilters={state.quickFilters}
        onQuickFiltersChange={state.setQuickFilters}
      />
      <ListingRecordCount
        filteredCount={state.displayedRows.length}
        totalCount={state.rows.length}
        label="Contacts"
        selectedCount={state.selectedCount}
      />
      <ConnectionsContactsListMobile state={state} onOpenContact={onOpenContact} />
    </>
  );
}
