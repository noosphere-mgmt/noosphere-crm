"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { bulkDeleteContactsAction, bulkDuplicateContactsAction } from "@/app/admin/contacts/actions";
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
  const router = useRouter();
  const theme = moduleAccentClasses("connections");
  const { someSelected, selectedCount, selected, clearSelection } = useConnectionsListSelection();
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

  function onBulkCopy() {
    if (!someSelected) return;
    const formData = new FormData();
    formData.set("contact_ids", [...selected].join(","));
    startTransition(async () => {
      const result = await bulkDuplicateContactsAction(formData);
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      clearSelection();
      router.refresh();
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
            onCopy={onBulkCopy}
            copyTitle="Copy selected"
          />
          <button type="button" onClick={onNewContact} className={theme.primaryButton}>
            New
          </button>
        </>
      }
    />
  );
}
