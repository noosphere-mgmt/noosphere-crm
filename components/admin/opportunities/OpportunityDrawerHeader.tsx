"use client";

import Link from "next/link";
import { IconX } from "@/components/admin/ModuleActionIcons";
import { moduleEditButtonClass } from "@/components/admin/ModuleActionBar";
import { InlineSaveStatus } from "@/components/admin/inline/InlineRecordChrome";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import { opportunityStatusChip } from "@/lib/opportunityStatusTheme";
import { companyFullPageHref, contactFullPageHref } from "@/lib/crmDetailNav";
import { AdminEntityLink } from "@/components/admin/AdminEntityLink";
import { buildOpportunitiesReturnTo } from "@/lib/opportunitiesDrawerNav";
import { opportunityWorkspaceHref } from "@/lib/opportunityWorkspaceNav";
import type { Opportunity } from "@/lib/types/entities";
import { useSearchParams } from "next/navigation";

export function OpportunityDrawerHeader({
  opportunity,
  onClose,
}: {
  opportunity: Opportunity;
  onClose: () => void;
}) {
  const searchParams = useSearchParams();
  const listReturnTo = buildOpportunitiesReturnTo(searchParams);
  const fullPage = opportunityWorkspaceHref(opportunity, "overview", undefined, listReturnTo);
  const fullEdit = opportunityWorkspaceHref(opportunity, "overview", "edit", listReturnTo);

  return (
    <div className="sticky top-0 z-10 shrink-0 border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            {opportunity.client_name}
          </h2>
          <RecordBusinessId id={opportunity.business_id} className="mt-0.5 block" />
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span {...opportunityStatusChip(opportunity.status)}>
              {OPPORTUNITY_STATUS_LABELS[opportunity.status]}
            </span>
            {opportunity.linked_company_name ? (
              <AdminEntityLink
                href={companyFullPageHref(
                  opportunity.linked_company_business_id ?? opportunity.company_id,
                )}
                className="text-sm text-slate-600 underline-offset-2 hover:underline"
              >
                {opportunity.linked_company_name}
              </AdminEntityLink>
            ) : null}
            {opportunity.primary_contact_name ? (
              <AdminEntityLink
                href={contactFullPageHref(
                  opportunity.primary_contact_business_id ?? opportunity.primary_contact_id,
                )}
                className="text-sm text-slate-600 underline-offset-2 hover:underline"
              >
                {opportunity.primary_contact_name}
              </AdminEntityLink>
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
            >Edit</Link>
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
