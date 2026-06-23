"use client";

import { useTransition } from "react";
import { bulkDeleteContactsAction } from "@/app/admin/contacts/actions";
import { ModuleListingBulkActions } from "@/components/admin/ModuleBulkActionButtons";
import { ConnectionsModuleHeader } from "@/components/admin/connections/ConnectionsModuleHeader";
import { useConnectionsListSelection } from "@/components/admin/connections/ConnectionsListSelectionContext";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";

export function ConnectionsContactsListHeaderDesktop({
  onNewContact,
  exportSelectedIds,
}: {
  onNewContact: () => void;
  exportSelectedIds: string[];
}) {
  const theme = moduleAccentClasses("connections");
  const { someSelected, selectedCount, selected } = useConnectionsListSelection();
  const [isPending, startTransition] = useTransition();

  const selectedIds = exportSelectedIds;

  function onBulkDelete() {
    if (!someSelected) return;
    if (!window.confirm(`Delete ${selectedCount} selected contacts? This cannot be undone.`)) return;
    const formData = new FormData();
    formData.set("contact_ids", [...selected].join(","));
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
            New
          </button>
        </>
      }
    />
  );
}
