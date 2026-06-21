"use client";

import { useMemo, useTransition } from "react";
import { bulkDeleteContactsAction } from "@/app/admin/contacts/actions";
import { ModuleListingBulkActions } from "@/components/admin/ModuleBulkActionButtons";
import { ConnectionsModuleToolbar } from "@/components/admin/connections/ConnectionsModuleToolbar";
import { useConnectionsListSelection } from "@/components/admin/connections/ConnectionsListSelectionContext";

export function ConnectionsContactsListHeaderMobile({ onNewContact }: { onNewContact: () => void }) {
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
    <div className="mb-2 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ConnectionsModuleToolbar onCreate={onNewContact} createLabel="New contact" />
        <ModuleListingBulkActions
          module="connections"
          importObjectType="contacts"
          selectedCount={selectedCount}
          someSelected={someSelected}
          selectedIds={selectedIds}
          isPending={isPending}
          onDelete={onBulkDelete}
        />
      </div>
    </div>
  );
}
