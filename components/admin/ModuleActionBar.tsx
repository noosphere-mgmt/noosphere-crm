"use client";

import { createContext, useContext } from "react";
import { IconTrash } from "@/components/admin/ModuleActionIcons";
import { useRegisterAdminRecordEdit } from "@/components/admin/AdminRecordEditContext";
import type { AdminModuleKey } from "@/components/admin/moduleTheme";

export const FormEditingContext = createContext(true);

export function useFormEditing(): boolean {
  return useContext(FormEditingContext);
}

const btnIcon = "inline-flex items-center justify-center rounded-lg p-2 transition";
const btnLabeledBase =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition";

export const moduleActionButtonClass = {
  edit: `${btnLabeledBase} border-slate-200 bg-white text-slate-800 hover:bg-slate-50`,
  // Keep text color on the same class group as bg so it isn't overridden by shared base styles.
  save: `${btnLabeledBase} border-slate-900 bg-slate-900 text-white hover:border-slate-800 hover:bg-slate-800`,
  cancel: `${btnLabeledBase} border-slate-200 bg-white text-slate-800 hover:bg-slate-50`,
  /** Icon-only close (X) — not the labeled Cancel control. */
  close: `${btnIcon} border border-slate-200 bg-white text-slate-800 hover:bg-slate-50`,
  delete: `${btnIcon} border border-red-200 bg-red-50 text-red-700 hover:bg-red-100`,
} as const;

/** Labeled Edit control — prefer text “Edit” over pencil icon. */
export function moduleEditButtonClass(_module?: AdminModuleKey): string {
  return moduleActionButtonClass.edit;
}

type ModuleActionBarProps = {
  mode: "view" | "edit";
  onEdit?: () => void;
  onCancel?: () => void;
  formId?: string;
  onSave?: () => void;
  /** Primary submit label (default Save). Use e.g. "Create premise" on new-record pages. */
  saveLabel?: string;
  deleteAction?: () => Promise<void>;
  module?: AdminModuleKey;
};

function triggerSave({ formId, onSave }: Pick<ModuleActionBarProps, "formId" | "onSave">) {
  if (onSave) {
    onSave();
    return;
  }
  if (formId) {
    (document.getElementById(formId) as HTMLFormElement | null)?.requestSubmit();
  }
}

export function ModuleEditActions({
  onCancel,
  formId,
  onSave,
  saveLabel = "Save",
  deleteAction,
}: Omit<ModuleActionBarProps, "mode" | "onEdit" | "module">) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        className={moduleActionButtonClass.save}
        onClick={() => triggerSave({ formId, onSave })}
        aria-label={saveLabel}
        title={saveLabel}
      >
        {saveLabel}
      </button>
      <button
        type="button"
        className={moduleActionButtonClass.cancel}
        onClick={onCancel}
        aria-label="Cancel"
        title="Cancel"
      >
        Cancel
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

function EditDockShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-auto rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
      {children}
    </div>
  );
}

/** Top-right floating Save/Cancel, plus in-flow Save/Cancel at the end of the page (left). */
export function ModuleStickyEditBar({
  onCancel,
  formId,
  onSave,
  saveLabel,
  deleteAction,
}: Omit<ModuleActionBarProps, "mode" | "onEdit" | "module">) {
  useRegisterAdminRecordEdit(true);
  const actions = (
    <ModuleEditActions
      onCancel={onCancel}
      formId={formId}
      onSave={onSave}
      saveLabel={saveLabel}
      deleteAction={deleteAction}
    />
  );

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-[calc(3.5rem+env(safe-area-inset-top))] z-[70] flex justify-end p-3 lg:top-16">
        <EditDockShell>{actions}</EditDockShell>
      </div>
      <div className="mt-6 flex justify-start border-t border-slate-200 pt-4">
        {actions}
      </div>
    </>
  );
}

export function ModuleActionBar({
  mode,
  onEdit,
  onCancel,
  formId,
  onSave,
  saveLabel,
  deleteAction,
  module,
}: ModuleActionBarProps) {
  if (mode === "view") {
    return (
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          className={moduleEditButtonClass(module)}
          onClick={onEdit}
          aria-label="Edit"
          title="Edit"
        >
          Edit
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

  return (
    <ModuleEditActions
      onCancel={onCancel}
      formId={formId}
      onSave={onSave}
      saveLabel={saveLabel}
      deleteAction={deleteAction}
    />
  );
}
