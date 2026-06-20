"use client";

import { ConnectionsSearchToolbarDesktop } from "@/components/admin/connections/ConnectionsSearchToolbarDesktop";
import { ConnectionsContactsListDesktop } from "@/components/admin/connections/ConnectionsContactsListDesktop";
import { ConnectionsContactsListHeaderDesktop } from "@/components/admin/connections/ConnectionsContactsListHeaderDesktop";
import { ListingRecordCount } from "@/components/admin/ListingRecordCount";
import type { ConnectionsContactsListState } from "@/components/admin/connections/useConnectionsContactsList";

export function ConnectionsContactsDesktop({
  state,
  onOpenContact,
  onOpenCompany,
  onNewContact,
}: {
  state: ConnectionsContactsListState;
  onOpenContact: (id: number) => void;
  onOpenCompany: (id: number) => void;
  onNewContact: () => void;
}) {
  return (
    <>
      <ConnectionsContactsListHeaderDesktop onNewContact={onNewContact} />
      <ConnectionsSearchToolbarDesktop
        variant="contacts"
        searchQuery={state.searchQuery}
        onSearchChange={state.setSearchQuery}
        quickFilters={state.quickFilters}
        onQuickFiltersChange={state.setQuickFilters}
        countries={state.countries}
        cities={state.cities}
      />
      <ListingRecordCount
        filteredCount={state.displayedRows.length}
        totalCount={state.rows.length}
        label="Contacts"
        selectedCount={state.selectedCount}
      />
      <ConnectionsContactsListDesktop
        state={state}
        onOpenContact={onOpenContact}
        onOpenCompany={onOpenCompany}
      />
    </>
  );
}
