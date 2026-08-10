"use client";

import Link from "next/link";
import { useTransition } from "react";
import { bulkDeleteCompaniesAction } from "@/app/admin/companies/actions";
import { ModuleListingBulkActions } from "@/components/admin/ModuleBulkActionButtons";
import { ConnectionsModuleHeader } from "@/components/admin/connections/ConnectionsModuleHeader";
import { useConnectionsListSelection } from "@/components/admin/connections/ConnectionsListSelectionContext";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";

export function ConnectionsCompaniesListHeaderDesktop({
  exportSelectedIds,
  filteredIds,
  showCreate = true,
}: {
  exportSelectedIds: string[];
  filteredIds?: string[];
  showCreate?: boolean;
}) {
  const theme = moduleAccentClasses("connections");
  const { someSelected, selectedCount, selected } = useConnectionsListSelection();
  const [isPending, startTransition] = useTransition();

  const selectedIds = exportSelectedIds;

  function onBulkDelete() {
    if (!someSelected) return;
    if (!window.confirm(`Delete ${selectedCount} selected companies? This cannot be undone.`)) return;
    const formData = new FormData();
    formData.set("company_ids", [...selected].join(","));
    startTransition(() => {
      void bulkDeleteCompaniesAction(formData);
    });
  }

  return (
    <ConnectionsModuleHeader
      actions={
        <>
          <ModuleListingBulkActions
            module="connections"
            importObjectType="companies"
            selectedCount={selectedCount}
            someSelected={someSelected}
            selectedIds={selectedIds}
            filteredIds={filteredIds}
            isPending={isPending}
            onDelete={onBulkDelete}
          />
          {showCreate ? (
            <Link href="/admin/companies/new" className={theme.primaryButton}>
              + Company
            </Link>
          ) : null}
        </>
      }
    />
  );
}
