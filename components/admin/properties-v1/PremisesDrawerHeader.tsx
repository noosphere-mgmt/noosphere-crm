"use client";

import { bulkDeletePremisesV1Action } from "@/app/admin/properties/actions";
import { IconPen, IconTrash, IconX } from "@/components/admin/ModuleActionIcons";
import { moduleActionButtonClass, moduleEditButtonClass } from "@/components/admin/ModuleActionBar";
import { InlineSaveStatus } from "@/components/admin/inline/InlineRecordChrome";
import { useInlineEdit } from "@/components/admin/inline/InlineEditProvider";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";

export function PremisesDrawerHeader({
  title,
  subtitle,
  premisesId,
  returnTo,
  onClose,
  onEdit,
  onFullEdit,
  showEdit,
}: {
  title: string;
  subtitle?: string | null;
  premisesId: string;
  returnTo: string;
  onClose: () => void;
  onEdit: () => void;
  onFullEdit?: () => void;
  showEdit?: boolean;
}) {
  const theme = moduleAccentClasses("properties");
  const { editHighlight, setEditHighlight } = useInlineEdit();

  async function deletePremises() {
    const formData = new FormData();
    formData.set("premises_ids", premisesId);
    formData.set("return_to", returnTo);
    await bulkDeletePremisesV1Action(formData);
  }

  return (
    <div className="sticky top-0 z-10 shrink-0 border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">Review</p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <InlineSaveStatus />
          {showEdit !== false ? (
            <button
              type="button"
              className={`${moduleEditButtonClass("properties")} ${
                editHighlight ? "ring-2 ring-[#FDE68A]" : ""
              }`}
              onClick={() => setEditHighlight(!editHighlight)}
              aria-label={editHighlight ? "Hide editable fields" : "Inline edit"}
              title={editHighlight ? "Hide editable fields" : "Inline edit"}
            >
              <IconPen />
            </button>
          ) : null}
          {onFullEdit ? (
            <button
              type="button"
              onClick={onFullEdit}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${theme.secondaryButton}`}
            >
              Full edit
            </button>
          ) : showEdit !== false ? (
            <button
              type="button"
              className={moduleEditButtonClass("properties")}
              onClick={onEdit}
              aria-label="Full edit"
              title="Full edit"
            >
              <IconPen />
            </button>
          ) : null}
          <form action={deletePremises}>
            <button
              type="submit"
              className={moduleActionButtonClass.delete}
              aria-label="Delete"
              title="Delete"
              onClick={(e) => {
                if (!window.confirm("Delete this premises? This cannot be undone.")) e.preventDefault();
              }}
            >
              <IconTrash />
            </button>
          </form>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
            title="Close"
          >
            <IconX />
          </button>
        </div>
      </div>
    </div>
  );
}

export function PremisesDrawerTableLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} className="text-sm font-medium text-blue-700 hover:underline">
      {children}
    </a>
  );
}
