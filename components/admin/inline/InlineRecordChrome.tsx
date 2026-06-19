"use client";

import { IconPen, IconTrash } from "@/components/admin/ModuleActionIcons";
import { moduleActionButtonClass } from "@/components/admin/ModuleActionBar";
import { useInlineEdit } from "@/components/admin/inline/InlineEditProvider";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";

export function InlineSaveStatus() {
  const { saveStatus, saveError, retryLastSave } = useInlineEdit();

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
}: {
  deleteAction?: () => Promise<void>;
}) {
  const { editHighlight, setEditHighlight } = useInlineEdit();

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <InlineSaveStatus />
      <button
        type="button"
        className={`${moduleActionButtonClass.edit} ${
          editHighlight
            ? "border border-[rgba(139,92,246,0.35)] bg-[rgba(139,92,246,0.18)] text-violet-950"
            : ""
        }`}
        onClick={() => setEditHighlight(!editHighlight)}
        aria-label={editHighlight ? "Hide editable fields" : "Show editable fields"}
        title={editHighlight ? "Hide editable fields" : "Show editable fields"}
      >
        <IconPen />
      </button>
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

/** View mode: clean label/value, no borders on the field group. */
export function inlineViewFieldClass(): string {
  return "group py-0 transition-colors rounded-sm -mx-1 px-1";
}

export function inlineFieldShellClass(editHighlight: boolean, editing: boolean): string {
  if (editing) return `${inlineViewFieldClass()} cursor-text`;
  if (editHighlight) {
    return `${inlineViewFieldClass()} cursor-pointer bg-violet-50/40 ring-1 ring-violet-200/70 hover:bg-violet-50/70`;
  }
  return inlineViewFieldClass();
}

export const inlineInputClass = `mt-0.5 w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 shadow-sm ${connectionsGlassClasses.inputFocus}`;
export const inlineSelectClass = inlineInputClass;

export function inlineReadOnlyClass(): string {
  return "py-0";
}

export function displayOrDash(value: string | null | undefined): string {
  const s = value?.trim();
  return s ? s : "—";
}
