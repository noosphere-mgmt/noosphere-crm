"use client";

import Link from "next/link";
import { IconCopy, IconEye, IconPen, IconTrash } from "@/components/admin/ModuleActionIcons";
import { moduleActionButtonClass } from "@/components/admin/ModuleActionBar";
import { moduleAccentClasses, type AdminModuleKey } from "@/components/admin/moduleTheme";

const viewBtnClass = "inline-flex rounded p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700";

export function ModuleRowActions({
  module,
  viewHref,
  onView,
  editHref,
  onEdit,
  onDuplicate,
  onDelete,
  viewLabel = "View",
  editLabel = "Edit",
  duplicateLabel = "Duplicate",
  deleteLabel = "Delete",
}: {
  module: AdminModuleKey;
  viewHref?: string;
  onView?: () => void;
  editHref?: string;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  viewLabel?: string;
  editLabel?: string;
  duplicateLabel?: string;
  deleteLabel?: string;
}) {
  const theme = moduleAccentClasses(module);
  const editBtnClass = `inline-flex rounded p-1 transition ${theme.rowIconEdit}`;
  const duplicateBtnClass = `inline-flex rounded p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700`;

  return (
    <div className="flex items-center justify-end gap-0.5">
      {viewHref ? (
        <Link href={viewHref} className={viewBtnClass} aria-label={viewLabel} title={viewLabel}>
          <IconEye />
        </Link>
      ) : onView ? (
        <button type="button" onClick={onView} className={viewBtnClass} aria-label={viewLabel} title={viewLabel}>
          <IconEye />
        </button>
      ) : null}
      {editHref ? (
        <Link href={editHref} className={editBtnClass} aria-label={editLabel} title={editLabel}>
          <IconPen />
        </Link>
      ) : onEdit ? (
        <button type="button" onClick={onEdit} className={editBtnClass} aria-label={editLabel} title={editLabel}>
          <IconPen />
        </button>
      ) : null}
      {onDuplicate ? (
        <button
          type="button"
          onClick={onDuplicate}
          className={duplicateBtnClass}
          aria-label={duplicateLabel}
          title={duplicateLabel}
        >
          <IconCopy />
        </button>
      ) : null}
      {onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className={`${moduleActionButtonClass.delete} !inline-flex !rounded !p-1`}
          aria-label={deleteLabel}
          title={deleteLabel}
        >
          <IconTrash />
        </button>
      ) : null}
    </div>
  );
}
