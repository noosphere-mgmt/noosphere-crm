"use client";

import { useMemo, useTransition } from "react";
import { bulkDeleteOpportunitiesAction } from "@/app/admin/opportunities/actions";
import { ModuleListingBulkActions } from "@/components/admin/ModuleBulkActionButtons";
import { OpportunitiesModuleHeader } from "@/components/admin/opportunities/OpportunitiesModuleHeader";
import { useOpportunitiesListSelection } from "@/components/admin/opportunities/OpportunitiesListSelectionContext";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";

export function OpportunitiesListHeaderDesktop({ onNewOpportunity }: { onNewOpportunity: () => void }) {
  const theme = moduleAccentClasses("opportunities");
  const { someSelected, selectedCount, selected } = useOpportunitiesListSelection();
  const [isPending, startTransition] = useTransition();

  const selectedIds = useMemo(() => [...selected], [selected]);

  function onBulkDelete() {
    if (!someSelected) return;
    if (!window.confirm(`Delete ${selectedCount} selected opportunities? This cannot be undone.`)) return;
    const formData = new FormData();
    formData.set("opportunity_ids", selectedIds.join(","));
    startTransition(() => {
      void bulkDeleteOpportunitiesAction(formData);
    });
  }

  return (
    <OpportunitiesModuleHeader
      actions={
        <>
          <ModuleListingBulkActions
            module="opportunities"
            importObjectType="opportunities"
            selectedCount={selectedCount}
            someSelected={someSelected}
            selectedIds={selectedIds}
            isPending={isPending}
            onDelete={onBulkDelete}
          />
          <button type="button" onClick={onNewOpportunity} className={theme.primaryButton}>
            New
          </button>
        </>
      }
    />
  );
}
