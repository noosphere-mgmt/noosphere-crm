"use client";

import Link from "next/link";
import { opportunityWorkspaceHref } from "@/lib/opportunityWorkspaceNav";
import { formatOpportunityExpectedFee } from "@/lib/opportunitiesList";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";

function SummaryCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function OpportunityProposedServiceTab({ data }: { data: OpportunityDetailData }) {
  const { opportunity, parties, proposals, feeSummary } = data;
  const serviceScope = opportunity.requirement_summary?.trim() || opportunity.property_type?.trim() || "Service scope has not been recorded yet.";
  const proposedParties = parties.filter((party) => party.role !== "end_user");

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-violet-200 bg-violet-50/40 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Proposed service</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Service scope and commercial arrangement</h2>
            <p className="mt-1 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-700">{serviceScope}</p>
          </div>
          <Link href={opportunityWorkspaceHref(opportunity, "overview", "edit")}
            className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm font-medium text-violet-800 hover:bg-violet-50">
            Edit service brief
          </Link>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Service parties" value={String(proposedParties.length)} hint="Providers, partners and referrers" />
        <SummaryCard label="Expected fee" value={formatOpportunityExpectedFee(String(feeSummary.expected_collect || ""))} hint="From the Parties records" />
        <SummaryCard label="Proposal versions" value={String(proposals.length)} hint="Stored under Documents" />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Build the proposal from existing records</h3>
            <p className="mt-1 text-sm text-slate-500">Define the service brief in Overview, confirm providers and fee roles in Parties, then keep the formal output in Documents.</p>
          </div>
          <div className="flex gap-2">
            <Link href={opportunityWorkspaceHref(opportunity, "parties")}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Review parties</Link>
            <Link href={opportunityWorkspaceHref(opportunity, "documents")}
              className="rounded-lg bg-violet-700 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-800">Documents</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
