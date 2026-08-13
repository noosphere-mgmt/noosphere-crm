"use client";

import Link from "next/link";
import { IconX } from "@/components/admin/ModuleActionIcons";
import { moduleEditButtonClass } from "@/components/admin/ModuleActionBar";
import { InlineSaveStatus } from "@/components/admin/inline/InlineRecordChrome";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { companyWorkspaceHref } from "@/lib/companyWorkspaceNav";

export function CompanyDrawerHeader({
  companyId,
  title,
  subtitle,
  businessId,
  onClose,
}: {
  companyId: number;
  title: string;
  subtitle?: string | null;
  businessId?: string | null;
  fullEdit?: boolean;
  onClose: () => void;
}) {
  const companyRef = { id: companyId, business_id: businessId };
  const fullPage = companyWorkspaceHref(companyRef, "profile", undefined, "/admin/companies");
  const fullEdit = companyWorkspaceHref(companyRef, "profile", "edit", "/admin/companies");

  return (
    <div className="sticky top-0 z-10 shrink-0 border-b border-slate-200 bg-white px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">Review — double-click a field to edit · saves automatically</p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
          <RecordBusinessId id={businessId} className="mt-0.5 block" />
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <InlineSaveStatus />
          {fullEdit ? (
            <Link
              href={fullEdit}
              className={moduleEditButtonClass("connections")}
              aria-label="Edit on full page"
              title="Edit on full page"
            >Edit</Link>
          ) : null}
          {fullPage ? (
            <Link
              href={fullPage}
              className="hidden rounded-lg border border-[#DDD6FE] bg-[#F5F3FF] px-2.5 py-1.5 text-sm font-medium text-[#5B21B6] hover:bg-[#EDE9FE] sm:inline-flex"
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
