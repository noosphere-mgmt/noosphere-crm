"use client";

import Link from "next/link";
import { useMemo, useTransition } from "react";
import { bulkDeleteCompaniesAction } from "@/app/admin/companies/actions";
import { ModuleListingBulkActions } from "@/components/admin/ModuleBulkActionButtons";
import { ConnectionsModuleHeader } from "@/components/admin/connections/ConnectionsModuleHeader";
import { useConnectionsListSelection } from "@/components/admin/connections/ConnectionsListSelectionContext";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import type { ConnectionCompanyListRow } from "@/lib/connectionsDisplay";

export function ConnectionsCompaniesListHeader({ rows }: { rows: ConnectionCompanyListRow[] }) {
  const theme = moduleAccentClasses("connections");
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
    <ConnectionsModuleHeader
      actions={
        <>
          <ModuleListingBulkActions
            module="connections"
            importObjectType="companies"
            selectedCount={selectedCount}
            someSelected={someSelected}
            selectedIds={selectedIds}
            isPending={isPending}
            onDelete={onBulkDelete}
          />
          <Link href="/admin/companies/new" className={theme.primaryButton}>
            + New Company
          </Link>
        </>
      }
    />
  );
}
