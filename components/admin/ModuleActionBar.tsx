"use client";

import { createContext, useContext } from "react";
import { IconCheck, IconPen, IconTrash, IconX } from "@/components/admin/ModuleActionIcons";
import { moduleAccentClasses, type AdminModuleKey } from "@/components/admin/moduleTheme";

export const FormEditingContext = createContext(true);

export function useFormEditing(): boolean {
  return useContext(FormEditingContext);
}

const btnBase = "inline-flex items-center justify-center rounded-lg p-2 transition";

export const moduleActionButtonClass = {
  edit: `${btnBase} bg-blue-600 text-white hover:bg-blue-700`,
  save: `${btnBase} bg-slate-900 text-white hover:bg-slate-800`,
  cancel: `${btnBase} bg-slate-100 text-slate-800 hover:bg-slate-200`,
  delete: `${btnBase} border border-red-200 bg-red-50 text-red-700 hover:bg-red-100`,
} as const;

export function moduleEditButtonClass(module?: AdminModuleKey): string {
  if (!module) return moduleActionButtonClass.edit;
  const theme = moduleAccentClasses(module);
  return `${btnBase} border border-current/20 bg-white ${theme.rowIconEdit}`;
}

export function ModuleActionBar({
  mode,
  onEdit,
  onCancel,
  formId,
  deleteAction,
  module,
}: {
  mode: "view" | "edit";
  onEdit?: () => void;
  onCancel?: () => void;
  formId?: string;
  deleteAction?: () => Promise<void>;
  module?: AdminModuleKey;
}) {
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

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        className={moduleActionButtonClass.cancel}
        onClick={onCancel}
        aria-label="Cancel"
        title="Cancel"
      >
        <IconX />
      </button>
      <button
        type="submit"
        form={formId}
        className={moduleActionButtonClass.save}
        aria-label="Save"
        title="Save"
      >
        <IconCheck />
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
