"use client";

import Link from "next/link";
import { DrawerOverviewCard } from "@/components/admin/connections/DrawerOverviewCard";
import { OPPORTUNITY_LEAD_TYPE_LABELS, OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import { opportunityDetailHref } from "@/lib/opportunityDetailNav";
import { opportunityStatusChip } from "@/lib/opportunityStatusTheme";
import type { OpportunityDrawerData } from "@/lib/repos/opportunitiesDrawer";

export function OpportunityQuickViewBody({ data }: { data: OpportunityDrawerData }) {
  const { opportunity, proposedCount } = data;

  return (
    <div className="space-y-4">
      <DrawerOverviewCard title="Summary">
        <dl className="grid gap-2 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-xs uppercase text-slate-500">Lead type</dt>
            <dd>{OPPORTUNITY_LEAD_TYPE_LABELS[opportunity.lead_type]}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Status</dt>
            <dd>
              <span {...opportunityStatusChip(opportunity.status)}>
                {OPPORTUNITY_STATUS_LABELS[opportunity.status]}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Company</dt>
            <dd>{opportunity.linked_company_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Contact</dt>
            <dd>{opportunity.primary_contact_name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">District</dt>
            <dd>{opportunity.district_preference ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Proposed premises</dt>
            <dd>{proposedCount}</dd>
          </div>
        </dl>
      </DrawerOverviewCard>
      {opportunity.requirement_summary ? (
        <DrawerOverviewCard title="Requirement">
          <p className="whitespace-pre-wrap text-sm text-slate-800">{opportunity.requirement_summary}</p>
        </DrawerOverviewCard>
      ) : null}
      <Link
        href={opportunityDetailHref(opportunity.id)}
        className="inline-flex rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800"
      >
        Open full detail page
      </Link>
    </div>
  );
}
