"use client";

import { useMemo, useTransition } from "react";
import { bulkDeleteOpportunitiesAction } from "@/app/admin/opportunities/actions";
import { ModuleListingBulkActions } from "@/components/admin/ModuleBulkActionButtons";
import { OpportunitiesModuleToolbar } from "@/components/admin/opportunities/OpportunitiesModuleToolbar";
import { useOpportunitiesListSelection } from "@/components/admin/opportunities/OpportunitiesListSelectionContext";

export function OpportunitiesListHeaderMobile({ onNewOpportunity }: { onNewOpportunity: () => void }) {
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
    <div className="mb-2 space-y-2">
      <OpportunitiesModuleToolbar onCreate={onNewOpportunity} createLabel="New opportunity" />
      <ModuleListingBulkActions
        module="opportunities"
        importObjectType="opportunities"
        selectedCount={selectedCount}
        someSelected={someSelected}
        selectedIds={selectedIds}
        isPending={isPending}
        onDelete={onBulkDelete}
      />
    </div>
  );
}
