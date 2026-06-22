"use client";

import Link from "next/link";
import { IconPen, IconX } from "@/components/admin/ModuleActionIcons";
import { moduleEditButtonClass } from "@/components/admin/ModuleActionBar";
import { InlineSaveStatus } from "@/components/admin/inline/InlineRecordChrome";
import { useInlineEdit } from "@/components/admin/inline/InlineEditProvider";
import { OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import { opportunityDetailHref } from "@/lib/opportunityDetailNav";
import { opportunityStatusChip } from "@/lib/opportunityStatusTheme";
import type { Opportunity } from "@/lib/types/entities";

export function OpportunityDrawerHeader({
  opportunity,
  onClose,
}: {
  opportunity: Opportunity;
  onClose: () => void;
}) {
  const { editHighlight, setEditHighlight } = useInlineEdit();

  return (
    <div className="sticky top-0 z-10 shrink-0 border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500">
            {editHighlight ? "Click a field to edit" : "Opportunity"}
          </p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-900">
            {opportunity.client_name}
          </h2>
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
          <button
            type="button"
            className={`${moduleEditButtonClass("opportunities")} ${
              editHighlight ? "ring-2 ring-emerald-200" : ""
            }`}
            onClick={() => setEditHighlight(!editHighlight)}
            aria-label={editHighlight ? "Hide editable fields" : "Inline edit"}
            title={editHighlight ? "Hide editable fields" : "Inline edit"}
          >
            <IconPen />
          </button>
          <Link
            href={opportunityDetailHref(opportunity.id)}
            className="hidden rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:inline-flex"
          >
            Full page
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
