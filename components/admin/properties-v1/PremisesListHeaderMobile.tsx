"use client";

import { useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { bulkDeletePremisesV1Action, bulkDuplicatePremisesV1Action } from "@/app/admin/properties/actions";
import { ModuleListingBulkActions } from "@/components/admin/ModuleBulkActionButtons";
import { PropertiesModuleToolbar } from "@/components/admin/properties-v1/PropertiesModuleToolbar";
import { usePremisesListSelection } from "@/components/admin/properties-v1/PremisesListSelectionContext";

function buildReturnTo(searchParams: URLSearchParams): string {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("premises");
  params.delete("mode");
  const qs = params.toString();
  return qs ? `/admin/properties?${qs}` : "/admin/properties";
}

export function PremisesListHeaderMobile() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { someSelected, selectedCount, selected, clearSelection } = usePremisesListSelection();
  const [isPending, startTransition] = useTransition();
  const selectedIds = useMemo(() => [...selected], [selected]);

  function onBulkDelete() {
    if (!someSelected) return;
    if (!window.confirm(`Delete ${selectedCount} selected premises? This cannot be undone.`)) return;
    const formData = new FormData();
    formData.set("premises_ids", selectedIds.join(","));
    formData.set("return_to", buildReturnTo(searchParams));
    startTransition(() => {
      void bulkDeletePremisesV1Action(formData);
    });
  }

  function onBulkCopy() {
    if (!someSelected) return;
    const formData = new FormData();
    formData.set("premises_ids", selectedIds.join(","));
    startTransition(async () => {
      const result = await bulkDuplicatePremisesV1Action(formData);
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      clearSelection();
      router.refresh();
    });
  }

  return (
    <PropertiesModuleToolbar
      trailing={
        <div className="flex flex-nowrap items-center">
          <ModuleListingBulkActions
          module="properties"
          importObjectType="premises"
          selectedCount={selectedCount}
          someSelected={someSelected}
          selectedIds={selectedIds}
          isPending={isPending}
          onDelete={onBulkDelete}
          onCopy={onBulkCopy}
            copyTitle="Copy selected"
          />
        </div>
      }
    />
  );
}
