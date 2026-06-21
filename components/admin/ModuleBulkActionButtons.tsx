"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { IconCopy, IconExport, IconTrash } from "@/components/admin/ModuleActionIcons";
import { moduleActionButtonClass } from "@/components/admin/ModuleActionBar";
import { useOptionalModuleListingExport } from "@/components/admin/ModuleListingExportContext";
import { moduleAccentClasses, type AdminModuleKey } from "@/components/admin/moduleTheme";
import type { ImportObjectType } from "@/lib/import/types";
import { downloadModuleExport } from "@/lib/moduleExport";

export function ModuleListingBulkActions({
  module,
  importObjectType,
  selectedCount,
  someSelected,
  selectedIds,
  filteredIds: filteredIdsProp,
  isPending,
  onDelete,
  onCopy,
  copyTitle = "Copy selected",
  variant = "full",
  compact = false,
}: {
  module: AdminModuleKey;
  importObjectType: ImportObjectType;
  selectedCount: number;
  someSelected: boolean;
  selectedIds: string[];
  /** When provided, overrides context filtered IDs (e.g. server-filtered building list). */
  filteredIds?: string[];
  isPending?: boolean;
  onDelete?: () => void;
  onCopy?: () => void;
  copyTitle?: string;
  /** export-only: no delete/copy/selected export — for mobile listing toolbars */
  variant?: "full" | "export-only";
  /** Icon-only buttons for compact mobile toolbars */
  compact?: boolean;
}) {
  const theme = moduleAccentClasses(module);
  const exportCtx = useOptionalModuleListingExport();
  const filteredIds = filteredIdsProp ?? exportCtx?.filteredIds ?? [];
  const [exportPending, startExport] = useTransition();
  const [exportError, setExportError] = useState<string | null>(null);
  const exportOnly = variant === "export-only";
  const iconButtonClass = `${theme.secondaryButton} p-2 disabled:cursor-not-allowed disabled:opacity-40`;
  const textButtonClass = `${theme.secondaryButton} inline-flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-40`;

  function runExport(ids: string[], scope: "selected" | "filtered") {
    setExportError(null);
    startExport(async () => {
      try {
        await downloadModuleExport(importObjectType, ids, scope);
      } catch (err) {
        setExportError(err instanceof Error ? err.message : "Export failed");
      }
    });
  }

  const busy = isPending || exportPending;

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      {exportError ? (
        <span className="max-w-[12rem] truncate text-xs text-red-700" title={exportError}>
          {exportError}
        </span>
      ) : null}
      {!exportOnly && onDelete ? (
        <button
          type="button"
          disabled={!someSelected || busy}
          onClick={onDelete}
          className={`${moduleActionButtonClass.delete} disabled:cursor-not-allowed disabled:opacity-40`}
          aria-label="Delete selected"
          title="Delete selected"
        >
          <IconTrash />
        </button>
      ) : null}
      {!exportOnly && onCopy ? (
        <button
          type="button"
          disabled={!someSelected || busy}
          onClick={onCopy}
          className={`${theme.secondaryButton} p-2 disabled:cursor-not-allowed disabled:opacity-40`}
          aria-label={copyTitle}
          title={copyTitle}
        >
          <IconCopy />
        </button>
      ) : null}
      {!exportOnly ? (
        <button
          type="button"
          disabled={!someSelected || busy}
          onClick={() => runExport(selectedIds, "selected")}
          className={compact ? iconButtonClass : textButtonClass}
          title="Export selected"
          aria-label="Export selected"
        >
          <IconExport className={compact ? undefined : "h-3.5 w-3.5"} />
          {compact ? null : "Export selected"}
        </button>
      ) : null}
      <button
        type="button"
        disabled={filteredIds.length === 0 || busy}
        onClick={() => runExport(filteredIds, "filtered")}
        className={compact ? iconButtonClass : textButtonClass}
        title="Export filtered"
        aria-label="Export filtered"
      >
        <IconExport className={compact ? undefined : "h-3.5 w-3.5"} />
        {compact ? null : "Export filtered"}
      </button>
      <Link
        href={`/admin/import?objectType=${importObjectType}`}
        className={
          compact
            ? `${theme.secondaryButton} p-2 text-xs font-medium`
            : `${theme.secondaryButton} text-sm font-medium`
        }
        title="Import CSV"
      >
        {compact ? "↑" : "Import"}
      </Link>
      {!exportOnly && someSelected ? (
        <span className="hidden text-sm text-slate-600 tabular-nums sm:inline">{selectedCount} selected</span>
      ) : null}
    </div>
  );
}

/** @deprecated use ModuleListingBulkActions */
export function ModuleBulkActionButtons({
  selectedCount,
  someSelected,
  isPending,
  onDelete,
  onExport,
}: {
  selectedCount: number;
  someSelected: boolean;
  isPending?: boolean;
  onDelete: () => void;
  onExport: () => void;
}) {
  const secondary = moduleAccentClasses("dashboard").secondaryButton;

  return (
    <div className="hidden items-center gap-2 lg:flex">
      {someSelected ? (
        <span className="text-sm text-slate-600">{selectedCount} selected</span>
      ) : null}
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
        disabled={!someSelected}
        onClick={onExport}
        className={secondary}
      >
        Export selected
      </button>
    </div>
  );
}
