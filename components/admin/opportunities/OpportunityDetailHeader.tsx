"use client";

import Link from "next/link";
import { deleteOpportunityFromDetailAction } from "@/app/admin/opportunities/actions";
import { IconCheck, IconPen, IconTrash, IconX } from "@/components/admin/ModuleActionIcons";
import { moduleActionButtonClass, moduleEditButtonClass } from "@/components/admin/ModuleActionBar";
import { moduleAccentClasses } from "@/components/admin/moduleTheme";
import { OPPORTUNITY_LEAD_TYPE_LABELS, OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import { opportunityStatusChip } from "@/lib/opportunityStatusTheme";
import type { Opportunity } from "@/lib/types/entities";

export function OpportunityDetailHeader({
  opportunity,
  lastActivityDate,
  activeTab,
  editMode,
}: {
  opportunity: Opportunity;
  lastActivityDate?: string | null;
  activeTab: string;
  editMode: boolean;
}) {
  const theme = moduleAccentClasses("opportunities");
  const remove = deleteOpportunityFromDetailAction.bind(null, opportunity.id);
  const formId = `opportunity-detail-${opportunity.id}`;

  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <Link href="/admin/opportunities" className={`text-xs ${theme.link}`}>
          ← Opportunities
        </Link>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            {opportunity.client_name}
          </h1>
          <span {...opportunityStatusChip(opportunity.status)} className="inline-flex text-xs">
            {OPPORTUNITY_STATUS_LABELS[opportunity.status]}
          </span>
          <span className="text-sm text-slate-600">
            {OPPORTUNITY_LEAD_TYPE_LABELS[opportunity.lead_type]}
          </span>
          {lastActivityDate ? (
            <span className="text-sm text-slate-500">
              Last activity {lastActivityDate.slice(0, 10)}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <div className="hidden items-center gap-2 lg:flex">
          {activeTab === "overview" && editMode ? (
            <button
              type="submit"
              form={formId}
              className={moduleActionButtonClass.save}
              aria-label="Save"
              title="Save"
            >
              <IconCheck />
            </button>
          ) : activeTab === "overview" && !editMode ? (
            <Link
              href={`/admin/opportunities/${opportunity.id}?mode=edit`}
              className={moduleEditButtonClass("opportunities")}
              aria-label="Edit"
              title="Edit"
            >
              <IconPen />
            </Link>
          ) : null}
          <form action={remove}>
            <button type="submit" className={moduleActionButtonClass.delete} aria-label="Delete" title="Delete">
              <IconTrash />
            </button>
          </form>
        </div>
        <Link
          href="/admin/opportunities"
          className={moduleActionButtonClass.cancel}
          aria-label="Close"
          title="Close"
        >
          <IconX />
        </Link>
      </div>
    </div>
  );
}
