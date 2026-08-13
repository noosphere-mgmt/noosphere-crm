"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { bulkDeleteCompaniesAction, getCompanyReferenceSummaryAction } from "@/app/admin/companies/actions";
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
  const router = useRouter();
  const theme = moduleAccentClasses("connections");
  const { someSelected, selectedCount, selected, clearSelection } = useConnectionsListSelection();
  const [isPending, startTransition] = useTransition();

  const selectedIds = exportSelectedIds;

  function onBulkDelete() {
    if (!someSelected) return;
    if (!window.confirm(`Delete ${selectedCount} selected companies? This cannot be undone.`)) return;
    const ids = [...selected]
      .map((id) => Number.parseInt(id, 10))
      .filter((n) => Number.isFinite(n) && n > 0);
    startTransition(async () => {
      for (const id of ids) {
        const summary = await getCompanyReferenceSummaryAction(id);
        if (summary && summary.total > 0) {
          window.alert(
            `Cannot delete "${summary.companyName}": referenced by ${summary.total} record${summary.total === 1 ? "" : "s"}.`,
          );
          return;
        }
      }
      const formData = new FormData();
      formData.set("company_ids", ids.join(","));
      try {
        await bulkDeleteCompaniesAction(formData);
      } catch {
        // redirect() from the server action throws; treat as success navigation
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
