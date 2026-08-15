"use client";

import Link from "next/link";
import { IconX } from "@/components/admin/ModuleActionIcons";
import { moduleEditButtonClass } from "@/components/admin/ModuleActionBar";
import { InlineSaveStatus } from "@/components/admin/inline/InlineRecordChrome";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { buildingFullPageHref } from "@/lib/crmDetailNav";

export function PropertyDrawerHeader({
  title,
  subtitle,
  businessId,
  onClose,
}: {
  title: string;
  subtitle?: string | null;
  businessId?: string | null;
  onClose: () => void;
  onFullEdit?: () => void;
}) {
  const theme = moduleAccentClasses("properties");
  const fullPage = buildingFullPageHref(businessId);
  const fullEdit = buildingFullPageHref(businessId, { mode: "edit" });

  return (
    <div className="sticky top-0 z-10 shrink-0 border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
          <RecordBusinessId id={businessId} className="mt-0.5 block" />
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <InlineSaveStatus />
          {fullEdit ? (
            <Link
              href={fullEdit}
              className={moduleEditButtonClass("properties")}
              aria-label="Edit on full page"
              title="Edit on full page"
            >Edit</Link>
          ) : null}
          {fullPage ? (
            <Link
              href={fullPage}
              className={`hidden rounded-lg px-2.5 py-1.5 text-xs font-semibold sm:inline-flex ${theme.secondaryButton}`}
            >
              Full page
            </Link>
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
