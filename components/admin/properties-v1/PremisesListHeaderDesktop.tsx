"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  bulkDeletePremisesV1Action,
  bulkDuplicatePremisesV1Action,
  bulkUpdatePremisesCentreStatusAction,
} from "@/app/admin/properties/actions";
import { ModuleListingBulkActions } from "@/components/admin/ModuleBulkActionButtons";
import { PropertiesModuleHeader } from "@/components/admin/properties-v1/PropertiesModuleHeader";
import { usePremisesListSelection } from "@/components/admin/properties-v1/PremisesListSelectionContext";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { PREMISES_CENTRE_STATUSES } from "@/lib/v1ListValues";

function buildReturnTo(searchParams: URLSearchParams): string {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("premises");
  params.delete("mode");
  const qs = params.toString();
  return qs ? `/admin/properties?${qs}` : "/admin/properties";
}

export function PremisesListHeaderDesktop({ showCreate = true }: { showCreate?: boolean } = {}) {
  const router = useRouter();
  const theme = moduleAccentClasses("properties");
  const searchParams = useSearchParams();
  const { someSelected, selectedCount, selected, clearSelection } = usePremisesListSelection();
  const [isPending, startTransition] = useTransition();
  const [bulkCentreStatus, setBulkCentreStatus] = useState<(typeof PREMISES_CENTRE_STATUSES)[number]>("Full");

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

  function onBulkCentreStatus() {
    if (!someSelected) return;
    if (
      !window.confirm(
        `Set centre status to “${bulkCentreStatus}” for ${selectedCount} selected premises?`,
      )
    ) {
      return;
    }
    const formData = new FormData();
    formData.set("premises_ids", selectedIds.join(","));
    formData.set("centre_status", bulkCentreStatus);
    startTransition(async () => {
      const result = await bulkUpdatePremisesCentreStatusAction(formData);
      if (!result.ok) {
        window.alert(result.error);
        return;
      }
      clearSelection();
      router.refresh();
    });
  }

  return (
    <PropertiesModuleHeader
      actions={
        <>
          {someSelected ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <select
                aria-label="Bulk centre status"
                value={bulkCentreStatus}
                onChange={(e) =>
                  setBulkCentreStatus(e.target.value as (typeof PREMISES_CENTRE_STATUSES)[number])
                }
                disabled={isPending}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800"
              >
                {PREMISES_CENTRE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={isPending}
                onClick={onBulkCentreStatus}
                className={`${theme.secondaryButton} disabled:cursor-not-allowed disabled:opacity-40`}
              >
                Update status
              </button>
            </div>
          ) : null}
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
          {showCreate ? (
            <Link href="/admin/properties/premises/new" className={theme.primaryButton}>
              New
            </Link>
          ) : null}
        </>
      }
    />
  );
}
