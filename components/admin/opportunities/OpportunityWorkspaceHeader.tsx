"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteOpportunityFromDetailAction } from "@/app/admin/opportunities/actions";
import { IconCheck, IconPen, IconTrash, IconX } from "@/components/admin/ModuleActionIcons";
import { moduleActionButtonClass } from "@/components/admin/ModuleActionBar";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { OpportunityCommercialHeader } from "@/components/admin/opportunities/OpportunityCommercialHeader";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";
import { opportunityWorkspaceHref } from "@/lib/opportunityWorkspaceNav";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";
import type { OpportunityStatus } from "@/lib/types/entities";
import type { OpportunityWorkspaceTabId } from "@/lib/opportunityDetailTab";

export function OpportunityWorkspaceHeader({
  data,
  activeTab,
  editMode,
}: {
  data: OpportunityDetailData;
  activeTab: OpportunityWorkspaceTabId;
  editMode: boolean;
}) {
  const theme = moduleAccentClasses("opportunities");
  const { opportunity } = data;
  const [status, setStatus] = useState<OpportunityStatus>(opportunity.status);
  const remove = deleteOpportunityFromDetailAction.bind(null, opportunity.id);
  const formId = `opportunity-detail-${opportunity.id}`;

  return (
    <header className="border-b border-slate-200 bg-white px-1 pb-2 pt-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/admin/opportunities" className={`text-xs font-medium ${theme.link}`}>
          ← Opportunities
        </Link>
        <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto sm:justify-end">
          {activeTab === "overview" && editMode ? (
            <>
              <Link href={opportunityWorkspaceHref(opportunity, "overview")} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</Link>
              <button type="submit" form={formId} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800" aria-label="Save overview" title="Save overview"><IconCheck /> Save</button>
            </>
          ) : activeTab === "overview" ? (
            <Link href={opportunityWorkspaceHref(opportunity, "overview", "edit")} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-800 hover:bg-blue-100" aria-label="Edit overview" title="Edit overview"><IconPen /> Edit Overview</Link>
          ) : null}
          <form action={remove}>
            <button type="submit" className={moduleActionButtonClass.delete} aria-label="Delete" title="Delete"><IconTrash /></button>
          </form>
          <Link href="/admin/opportunities" className={moduleActionButtonClass.cancel} aria-label="Close" title="Close"><IconX /></Link>
        </div>
      </div>

      <div className="mt-1.5 flex min-w-0 flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h1 className="truncate text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl" title={opportunity.client_name}>{opportunity.client_name}</h1>
            <RecordBusinessId id={opportunity.business_id} className="shrink-0" />
          </div>
          <p className="mt-0.5 truncate text-sm text-slate-600">
            <span className="font-medium text-slate-800">{opportunity.linked_company_name?.trim() || "No company"}</span>
            <span className="px-1.5 text-slate-300">·</span>
            <span>{opportunity.primary_contact_name?.trim() || "No contact"}</span>
          </p>
        </div>
        <OpportunityCommercialHeader opportunity={{ ...opportunity, status }} editing={editMode && activeTab === "overview"} onStatusChange={setStatus} formId={formId} />
      </div>
    </header>
  );
}
