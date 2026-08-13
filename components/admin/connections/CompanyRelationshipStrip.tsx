"use client";

import type { CompanyCrmSummary } from "@/lib/repos/companyCrmSummary";
import type { Company } from "@/lib/types/entities";
import { formatCompanyRoles } from "@/lib/connectionsDisplay";

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

export function CompanyRelationshipStrip({
  company,
  crmSummary,
}: {
  company: Company;
  crmSummary: CompanyCrmSummary;
}) {
  const roles = formatCompanyRoles(company.roles?.length ? company.roles : ["client"]);
  const industry = company.industry?.trim() || null;
  const district = [company.city, company.district].filter(Boolean).join(" · ") || null;
  const openDeals = crmSummary.openOpportunities > 0 ? String(crmSummary.openOpportunities) : null;
  const supply =
    crmSummary.premises + crmSummary.properties > 0
      ? `${crmSummary.premises} premises · ${crmSummary.properties} buildings`
      : null;
  const contacts = crmSummary.contacts > 0 ? String(crmSummary.contacts) : null;

  return (
    <dl className="flex flex-wrap divide-x divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
      <StripCell label="Roles" value={roles} />
      <StripCell label="Industry" value={industry} />
      <StripCell label="Location" value={district} />
      <StripCell label="Contacts" value={contacts} />
      <StripCell label="Open opportunities" value={openDeals} />
      <StripCell label="Properties" value={supply} />
    </dl>
  );
}
