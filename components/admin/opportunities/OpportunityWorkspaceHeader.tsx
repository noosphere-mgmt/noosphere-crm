"use client";

import Link from "next/link";
import { deleteOpportunityFromDetailAction } from "@/app/admin/opportunities/actions";
import { IconTrash, IconX } from "@/components/admin/ModuleActionIcons";
import { moduleActionButtonClass } from "@/components/admin/ModuleActionBar";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { OpportunityCommercialHeader } from "@/components/admin/opportunities/OpportunityCommercialHeader";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { AdminEntityLink } from "@/components/admin/AdminEntityLink";
import { adminReturnToLabel } from "@/lib/adminReturnTo";
import { companyFullPageHref, contactFullPageHref } from "@/lib/crmDetailNav";
import { opportunityWorkspaceHref } from "@/lib/opportunityWorkspaceNav";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";
import type { OpportunityWorkspaceTabId } from "@/lib/opportunityDetailTab";

export function OpportunityWorkspaceHeader({
  data,
  activeTab,
  editMode,
  returnTo = "/admin/opportunities",
}: {
  data: OpportunityDetailData;
  activeTab: OpportunityWorkspaceTabId;
  editMode: boolean;
  returnTo?: string;
}) {
  const theme = moduleAccentClasses("opportunities");
  const { opportunity } = data;
  const remove = deleteOpportunityFromDetailAction.bind(null, opportunity.id);
  const backLabel = adminReturnToLabel(returnTo, "Opportunities");

  return (
    <header className="border-b border-slate-200 bg-white px-1 pb-2 pt-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={returnTo} className={`text-xs font-medium ${theme.link}`}>
          ← {backLabel}
        </Link>
        <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto sm:justify-end">
          {activeTab === "overview" && !editMode ? (
            <Link
              href={opportunityWorkspaceHref(opportunity, "overview", "edit", returnTo)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-800 hover:bg-blue-100"
              aria-label="Edit overview"
              title="Edit overview"
            >
              Edit
            </Link>
          ) : null}
          <form action={remove}>
            <button
              type="submit"
              className={moduleActionButtonClass.delete}
              aria-label="Delete"
              title="Delete"
            >
              <IconTrash />
            </button>
          </form>
          <Link
            href={returnTo}
            className={moduleActionButtonClass.close}
            aria-label="Close"
            title="Close"
          >
            <IconX />
          </Link>
        </div>
      </div>

      <div className="mt-1.5 flex min-w-0 flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h1
              className="truncate text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl"
              title={opportunity.client_name}
            >
              {opportunity.client_name}
            </h1>
            <RecordBusinessId id={opportunity.business_id} className="shrink-0" />
          </div>
          <p className="mt-0.5 truncate text-sm text-slate-600">
            <AdminEntityLink
              href={companyFullPageHref(
                opportunity.linked_company_business_id ?? opportunity.company_id,
              )}
              className="font-medium text-slate-800 underline-offset-2 hover:underline"
              fallback={<span className="font-medium text-slate-800">No company</span>}
            >
              {opportunity.linked_company_name?.trim()}
            </AdminEntityLink>
            <span className="px-1.5 text-slate-300">·</span>
            <AdminEntityLink
              href={contactFullPageHref(
                opportunity.primary_contact_business_id ?? opportunity.primary_contact_id,
              )}
              className="underline-offset-2 hover:underline"
              fallback="No contact"
            >
              {opportunity.primary_contact_name?.trim()}
            </AdminEntityLink>
          </p>
          {!editMode && activeTab === "overview" ? (
            <p className="mt-1 text-xs text-slate-500">
              Double-click Overview to open full edit · drawer fields save automatically
            </p>
          ) : null}
        </div>
        <OpportunityCommercialHeader opportunity={opportunity} />
      </div>
    </header>
  );
}
