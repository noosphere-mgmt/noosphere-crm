"use client";

import Link from "next/link";
import {
  formatOpportunityBudget,
  opportunityPropertyType,
} from "@/lib/opportunityFormParsing";
import { latestProposalSummary } from "@/lib/opportunityPipeline";
import { opportunityWorkspaceHref } from "@/lib/opportunityWorkspaceNav";
import { isProfServiceSalesRole } from "@/lib/opportunityValues";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";

function StripCell({
  label,
  value,
  empty = "—",
}: {
  label: string;
  value: string | null | undefined;
  empty?: string;
}) {
  const display = value?.trim() || empty;
  const muted = display === empty;
  return (
    <div className="min-w-[5.5rem] flex-1 px-3 py-2">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={`mt-0.5 text-sm font-medium ${muted ? "text-slate-400" : "text-slate-900"}`}>{display}</dd>
    </div>
  );
}

export function OpportunityRequirementStrip({
  data,
  proposalsEnabled,
}: {
  data: OpportunityDetailData;
  proposalsEnabled: boolean;
}) {
  const { opportunity, proposals } = data;

  if (isProfServiceSalesRole(opportunity.sales_role)) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700">
        <span className="font-medium text-slate-900">Prof Service</span>
        {opportunity.requirement_summary ? (
          <span className="text-slate-600"> — {opportunity.requirement_summary.slice(0, 120)}</span>
        ) : null}
      </div>
    );
  }

  const location =
    opportunity.district_preference?.trim() ||
    null;
  const size = opportunity.required_area_sqft
    ? `${opportunity.required_area_sqft} sq ft`
    : opportunity.required_capacity_pax != null
      ? `${opportunity.required_capacity_pax} pax`
      : null;
  const budget = formatOpportunityBudget(opportunity.budget_max, opportunity.budget_min);
  const budgetDisplay = budget !== "—" ? budget : null;
  const category =
    opportunity.property_category_preference?.trim() ||
    opportunityPropertyType(opportunity) ||
    null;
  const moveIn = (opportunity.move_in_date ?? opportunity.expected_close_date)?.slice(0, 10) ?? null;

  const proposalSummary = proposalsEnabled ? latestProposalSummary(proposals) : null;
  const proposalDisplay = proposalSummary
    ? `v${proposalSummary.version} · ${proposalSummary.status}`
    : null;

  const hasAny =
    location || size || budgetDisplay || category || moveIn || proposalDisplay;

  if (!hasAny) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-2.5">
        <p className="text-sm text-slate-500">Set location, size, and budget on the Brief tab to improve matching.</p>
        <Link
          href={opportunityWorkspaceHref(opportunity, "overview", "edit")}
          className="text-sm font-medium text-emerald-800 hover:underline"
        >
          Edit brief →
        </Link>
      </div>
    );
  }

  return (
    <dl className="flex flex-wrap divide-x divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
      <StripCell label="Location" value={location} />
      <StripCell label="Size" value={size} />
      <StripCell label="Budget" value={budgetDisplay} />
      <StripCell label="Category" value={category} />
      <StripCell label="Move-in" value={moveIn} />
      {proposalsEnabled ? (
        <StripCell label="Proposal" value={proposalDisplay} empty="None" />
      ) : null}
    </dl>
  );
}
