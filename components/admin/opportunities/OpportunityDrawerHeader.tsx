"use client";

import Link from "next/link";
import { opportunityDetailHref } from "@/lib/opportunityDetailNav";
import { IconPen, IconX } from "@/components/admin/ModuleActionIcons";
import { moduleEditButtonClass } from "@/components/admin/ModuleActionBar";
import { OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import { opportunityStatusChip } from "@/lib/opportunityStatusTheme";
import type { Opportunity } from "@/lib/types/entities";

export function OpportunityDrawerHeader({
  opportunity,
  onClose,
}: {
  opportunity: Opportunity;
  onClose: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 shrink-0 border-b border-slate-200 bg-white px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">Review</p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-900">
            {opportunity.client_name}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span {...opportunityStatusChip(opportunity.status)}>
              {OPPORTUNITY_STATUS_LABELS[opportunity.status]}
            </span>
            {opportunity.linked_company_name ? (
              <span className="text-sm text-slate-600">{opportunity.linked_company_name}</span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Link
            href={opportunityDetailHref(opportunity.id, "overview", "edit")}
            className={moduleEditButtonClass("opportunities")}
            aria-label="Edit"
            title="Edit"
          >
            <IconPen />
          </Link>
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
