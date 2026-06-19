"use client";

import { useMemo, useTransition } from "react";
import { bulkDeleteContactsAction } from "@/app/admin/contacts/actions";
import { ModuleListingBulkActions } from "@/components/admin/ModuleBulkActionButtons";
import { ConnectionsModuleHeader } from "@/components/admin/connections/ConnectionsModuleHeader";
import { useConnectionsListSelection } from "@/components/admin/connections/ConnectionsListSelectionContext";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import type { Contact } from "@/lib/types/entities";

export function ConnectionsContactsListHeader({
  rows: _rows,
  onNewContact,
}: {
  rows: Contact[];
  onNewContact: () => void;
}) {
  const theme = moduleAccentClasses("connections");
  const { someSelected, selectedCount, selected } = useConnectionsListSelection();
  const [isPending, startTransition] = useTransition();

  const selectedIds = useMemo(() => [...selected], [selected]);

  function onBulkDelete() {
    if (!someSelected) return;
    if (!window.confirm(`Delete ${selectedCount} selected contacts? This cannot be undone.`)) return;
    const formData = new FormData();
    formData.set("contact_ids", selectedIds.join(","));
    startTransition(() => {
      void bulkDeleteContactsAction(formData);
    });
  }

  return (
    <ConnectionsModuleHeader
      actions={
        <>
          <ModuleListingBulkActions
            module="connections"
            importObjectType="contacts"
            selectedCount={selectedCount}
            someSelected={someSelected}
            selectedIds={selectedIds}
            isPending={isPending}
            onDelete={onBulkDelete}
          />
          <button type="button" onClick={onNewContact} className={theme.primaryButton}>
            + New Contact
          </button>
        </>
      }
    />
  );
}
