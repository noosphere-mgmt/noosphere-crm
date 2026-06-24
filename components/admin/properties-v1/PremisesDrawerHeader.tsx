"use client";

import Link from "next/link";
import { IconPen, IconX } from "@/components/admin/ModuleActionIcons";
import { moduleEditButtonClass } from "@/components/admin/ModuleActionBar";
import { InlineSaveStatus } from "@/components/admin/inline/InlineRecordChrome";
import { useInlineEdit } from "@/components/admin/inline/InlineEditProvider";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";

export function PremisesDrawerHeader({
  title,
  subtitle,
  businessId,
  onClose,
  onEdit,
  fullPageHref,
  showEdit,
}: {
  title: string;
  subtitle?: string | null;
  businessId?: string | null;
  onClose: () => void;
  onEdit: () => void;
  fullPageHref?: string | null;
  showEdit?: boolean;
}) {
  const theme = moduleAccentClasses("properties");
  const { editHighlight, setEditHighlight } = useInlineEdit();

  return (
    <div className="sticky top-0 z-10 shrink-0 border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{editHighlight ? "Click a field to edit" : "Review"}</p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
          <RecordBusinessId id={businessId} className="mt-0.5 block" />
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
          {fullPageHref ? (
            <Link
              href={fullPageHref}
              className={`hidden rounded-lg px-2.5 py-1.5 text-xs font-semibold sm:inline-flex ${theme.secondaryButton}`}
            >
              Full page
            </Link>
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
