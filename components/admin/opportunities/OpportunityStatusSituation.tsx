"use client";

import {
  OPPORTUNITY_STATUS_LABELS,
  defaultWaitingFor,
  formatOpportunityActionDate,
} from "@/lib/lookups";
import type { Opportunity } from "@/lib/types/entities";

function SituationRow({
  label,
  value,
  prominent = false,
}: {
  label: string;
  value: string;
  prominent?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd
        className={`mt-1 ${prominent ? "text-base font-semibold text-slate-900" : "text-sm text-slate-700"}`}
      >
        {value}
      </dd>
    </div>
  );
}

export function OpportunityStatusSituation({ opportunity }: { opportunity: Opportunity }) {
  const waitingFor =
    opportunity.waiting_for?.trim() || defaultWaitingFor(opportunity.status) || "—";
  const nextAction = opportunity.next_action?.trim() || "—";
  const expectedDate = formatOpportunityActionDate(
    opportunity.next_action_date ?? opportunity.expected_close_date,
  );

  return (
    <div className="mt-3 grid gap-4 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-4">
      <SituationRow
        label="Status"
        value={OPPORTUNITY_STATUS_LABELS[opportunity.status]}
        prominent
      />
      <SituationRow label="Waiting for" value={waitingFor} />
      <SituationRow label="Next action" value={nextAction} />
      <SituationRow label="Expected date" value={expectedDate} />
    </div>
  );
}
