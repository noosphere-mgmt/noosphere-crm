"use client";

import {
  OPPORTUNITY_STATUS_LABELS,
  OPPORTUNITY_STATUS_PROBABILITY,
  formatOpportunityActionDate,
} from "@/lib/lookups";
import { opportunityStatusChip } from "@/lib/opportunityStatusTheme";
import type { Opportunity } from "@/lib/types/entities";

function Metric({ label, children, tone = "border-slate-200 bg-white" }: { label: string; children: React.ReactNode; tone?: string }) {
  return (
    <div className={`min-w-0 rounded-lg border px-2.5 py-1.5 ${tone}`}>
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-slate-900">{children}</dd>
    </div>
  );
}

export function OpportunityCommercialHeader({
  opportunity,
  editing,
  onStatusChange,
  formId,
}: {
  opportunity: Opportunity;
  editing?: boolean;
  onStatusChange?: (status: Opportunity["status"]) => void;
  formId?: string;
}) {
  const chip = opportunityStatusChip(opportunity.status);
  const probability = OPPORTUNITY_STATUS_PROBABILITY[opportunity.status];

  return (
    <section className="min-w-0">
      <dl className="grid grid-cols-3 gap-1.5">
        <Metric label="Status" tone="border-violet-100 bg-violet-50/70">
          {editing ? (
            <select
              name="status"
              form={formId}
              value={opportunity.status}
              onChange={(e) => onStatusChange?.(e.target.value as Opportunity["status"])}
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
            >
              {Object.entries(OPPORTUNITY_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          ) : (
            <span {...chip} className={`${chip.className} mt-0.5`}>
              {OPPORTUNITY_STATUS_LABELS[opportunity.status]}
            </span>
          )}
        </Metric>
        <Metric label="Probability" tone="border-emerald-100 bg-emerald-50/70">
          <span className="text-base font-bold tabular-nums text-emerald-800">
            {probability != null ? `${probability}%` : "—"}
          </span>
        </Metric>
        <Metric label="Expected close" tone="border-sky-100 bg-sky-50/70">
          {editing ? (
            <input
              type="date"
              name="expected_close_date"
              form={formId}
              defaultValue={opportunity.expected_close_date?.slice(0, 10) ?? ""}
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
            />
          ) : (
            formatOpportunityActionDate(opportunity.expected_close_date)
          )}
        </Metric>
      </dl>
    </section>
  );
}
