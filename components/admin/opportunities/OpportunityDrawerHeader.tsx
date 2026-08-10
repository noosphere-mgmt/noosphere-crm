"use client";

import Link from "next/link";
import { IconPen, IconX } from "@/components/admin/ModuleActionIcons";
import { moduleEditButtonClass } from "@/components/admin/ModuleActionBar";
import { InlineSaveStatus } from "@/components/admin/inline/InlineRecordChrome";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import { opportunityStatusChip } from "@/lib/opportunityStatusTheme";
import { opportunityFullPageHref } from "@/lib/crmDetailNav";
import type { Opportunity } from "@/lib/types/entities";

export function OpportunityDrawerHeader({
  opportunity,
  onClose,
}: {
  opportunity: Opportunity;
  onClose: () => void;
}) {
  const fullPage = opportunityFullPageHref(opportunity.business_id);
  const fullEdit = opportunityFullPageHref(opportunity.business_id, { mode: "edit" });

  return (
    <div className="sticky top-0 z-10 shrink-0 border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">Review — click a field to edit</p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-900">
            {opportunity.client_name}
          </h2>
          <RecordBusinessId id={opportunity.business_id} className="mt-0.5 block" />
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span {...opportunityStatusChip(opportunity.status)}>
              {OPPORTUNITY_STATUS_LABELS[opportunity.status]}
            </span>
            {opportunity.linked_company_name ? (
              <span className="text-sm text-slate-600">{opportunity.linked_company_name}</span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <InlineSaveStatus />
          {fullEdit ? (
            <Link
              href={fullEdit}
              className={moduleEditButtonClass("opportunities")}
              aria-label="Edit on full page"
              title="Edit on full page"
            >
              <IconPen />
            </Link>
          ) : null}
          {fullPage ? (
            <Link
              href={fullPage}
              className="hidden rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:inline-flex"
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
