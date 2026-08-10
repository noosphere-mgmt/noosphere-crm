"use client";

import { IconPen, IconTrash } from "@/components/admin/ModuleActionIcons";
import { moduleActionButtonClass } from "@/components/admin/ModuleActionBar";
import { useOptionalInlineEdit } from "@/components/admin/inline/InlineEditProvider";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";

export function InlineSaveStatus() {
  const ctx = useOptionalInlineEdit();
  if (!ctx) return null;
  const { saveStatus, saveError, retryLastSave } = ctx;

  if (saveStatus === "idle") return null;

  if (saveStatus === "saving") {
    return <span className="text-xs text-slate-500">Saving…</span>;
  }
  if (saveStatus === "saved") {
    return <span className="text-xs font-medium text-emerald-700">Saved</span>;
  }
  return (
    <button
      type="button"
      onClick={retryLastSave}
      className="text-xs font-medium text-red-700 hover:underline"
      title={saveError ?? undefined}
    >
      Error — retry
    </button>
  );
}

export function InlineRecordToolbar({
  deleteAction,
  fullEditHref,
}: {
  deleteAction?: () => Promise<void>;
  /** Pen opens full-page edit — never toggles inline highlight. */
  fullEditHref?: string | null;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <InlineSaveStatus />
      {fullEditHref ? (
        <a
          href={fullEditHref}
          className={moduleActionButtonClass.edit}
          aria-label="Edit on full page"
          title="Edit on full page"
        >
          <IconPen />
        </a>
      ) : null}
      {deleteAction ? (
        <form action={deleteAction}>
          <button
            type="submit"
            className={moduleActionButtonClass.delete}
            aria-label="Delete"
            title="Delete"
          >
            <IconTrash />
          </button>
        </form>
      ) : null}
    </div>
  );
}

/** View mode: subtle field boundary keeps blank values readable without placeholders. */
export function inlineViewFieldClass(): string {
  return "group min-h-[2.75rem] rounded-lg border border-slate-200/80 bg-slate-50/40 px-2.5 py-2 transition-colors";
}

export function inlineFieldShellClass(_editHighlight: boolean, editing: boolean): string {
  if (editing) return `${inlineViewFieldClass()} cursor-text`;
  return `${inlineViewFieldClass()} cursor-pointer hover:border-slate-300 hover:bg-white`;
}

export const inlineInputClass = `mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 shadow-sm ${connectionsGlassClasses.inputFocus}`;
export const inlineSelectClass = inlineInputClass;

export function inlineReadOnlyClass(): string {
  return "min-h-[2.75rem] rounded-lg border border-slate-200/80 bg-slate-50/40 px-2.5 py-2";
}

export function displayOrDash(value: string | null | undefined): string {
  const s = value?.trim();
  return s || "";
}
