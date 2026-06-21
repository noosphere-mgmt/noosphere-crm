"use client";

import { useMemo, useTransition } from "react";
import { bulkDeleteCompaniesAction } from "@/app/admin/companies/actions";
import { ModuleListingBulkActions } from "@/components/admin/ModuleBulkActionButtons";
import { ConnectionsModuleToolbar } from "@/components/admin/connections/ConnectionsModuleToolbar";
import { useConnectionsListSelection } from "@/components/admin/connections/ConnectionsListSelectionContext";

export function ConnectionsCompaniesListHeaderMobile() {
  const { someSelected, selectedCount, selected } = useConnectionsListSelection();
  const [isPending, startTransition] = useTransition();
  const selectedIds = useMemo(() => [...selected], [selected]);

  function onBulkDelete() {
    if (!someSelected) return;
    if (!window.confirm(`Delete ${selectedCount} selected companies? This cannot be undone.`)) return;
    const formData = new FormData();
    formData.set("company_ids", selectedIds.join(","));
    startTransition(() => {
      void bulkDeleteCompaniesAction(formData);
    });
  }

  return (
    <div className="mb-2 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ConnectionsModuleToolbar createHref="/admin/companies/new" createLabel="New company" />
        <ModuleListingBulkActions
          module="connections"
          importObjectType="companies"
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
