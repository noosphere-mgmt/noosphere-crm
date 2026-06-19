"use client";

import { IconCopy, IconTrash } from "@/components/admin/ModuleActionIcons";
import { moduleActionButtonClass } from "@/components/admin/ModuleActionBar";

export function PremisesBulkActionButtons({
  selectedCount,
  someSelected,
  isPending,
  onDelete,
  onCopy,
}: {
  selectedCount: number;
  someSelected: boolean;
  isPending?: boolean;
  onDelete: () => void;
  onCopy: () => void;
}) {
  return (
    <div className="hidden items-center gap-2 lg:flex">
      {someSelected ? <span className="text-sm text-slate-600">{selectedCount} selected</span> : null}
      <button
        type="button"
        disabled={!someSelected || isPending}
        onClick={onDelete}
        className={`${moduleActionButtonClass.delete} disabled:cursor-not-allowed disabled:opacity-40`}
        aria-label="Delete selected"
        title="Delete selected"
      >
        <IconTrash />
      </button>
      <button
        type="button"
        disabled={!someSelected || isPending}
        onClick={onCopy}
        className="inline-flex rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-900 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Copy selected"
        title="Copy selected"
      >
        <IconCopy />
      </button>
    </div>
  );
}
