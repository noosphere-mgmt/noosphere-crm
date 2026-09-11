"use client";

import Link from "next/link";
import { useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { bulkDeletePropertiesV1Action } from "@/app/admin/properties/actions";
import { ModuleListingBulkActions } from "@/components/admin/ModuleBulkActionButtons";
import { PropertiesModuleHeader } from "@/components/admin/properties-v1/PropertiesModuleHeader";
import { usePropertiesListSelection } from "@/components/admin/properties-v1/PropertiesListSelectionContext";
import type { PropertyListRow } from "@/components/admin/properties-v1/PropertiesFlatListClient";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";

function buildReturnTo(searchParams: URLSearchParams): string {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("property");
  params.delete("mode");
  const qs = params.toString();
  return qs ? `/admin/properties/buildings?${qs}` : "/admin/properties/buildings";
}

export function PropertiesBuildingsListHeader({
  rows,
}: {
  rows: PropertyListRow[];
}) {
  const theme = moduleAccentClasses("properties");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { someSelected, selectedCount, selected } = usePropertiesListSelection();
  const [isPending, startTransition] = useTransition();

  const selectedIds = useMemo(() => [...selected], [selected]);
  const filteredIds = useMemo(() => rows.map((r) => r.property_id), [rows]);
  const canMerge = selectedCount >= 2;

  function onMerge() {
    const selectedRows = rows.filter((row) => selected.has(row.property_id));
    if (selectedRows.length < 2) return;
    const ids = selectedRows.map((row) => row.business_id?.trim() || row.property_id);
    router.push(`/admin/properties/buildings/merge?ids=${ids.map(encodeURIComponent).join(",")}`);
  }

  function onBulkDelete() {
    if (!someSelected) return;
    if (!window.confirm(`Delete ${selectedCount} selected buildings? Related premises will also be removed.`)) return;
    const formData = new FormData();
    formData.set("property_ids", selectedIds.join(","));
    formData.set("return_to", buildReturnTo(searchParams));
    startTransition(() => {
      void bulkDeletePropertiesV1Action(formData);
    });
  }

  return (
    <PropertiesModuleHeader
      actions={
        <>
          <ModuleListingBulkActions
            module="properties"
            importObjectType="buildings"
            selectedCount={selectedCount}
            someSelected={someSelected}
            selectedIds={selectedIds}
            filteredIds={filteredIds}
            isPending={isPending}
            onDelete={onBulkDelete}
          />
          <button
            type="button"
            disabled={!canMerge || isPending}
            onClick={onMerge}
            className={theme.secondaryButton}
            title={canMerge ? "Merge selected buildings" : "Select two or more buildings to merge"}
          >
            Merge
          </button>
          <Link href="/admin/properties/buildings/new" className={theme.primaryButton}>
            New
          </Link>
        </>
      }
    />
  );
}
