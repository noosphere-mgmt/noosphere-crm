"use client";

import Link from "next/link";
import { companyFullPageHref } from "@/lib/crmDetailNav";
import type { ContactCrmSummary } from "@/lib/repos/contactCrmSummary";
import type { ContactCompanyAffiliation } from "@/lib/repos/contactCompanyAffiliations";
import type { Contact } from "@/lib/types/entities";

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

export function ContactRelationshipStrip({
  contact,
  affiliations,
  crmSummary,
}: {
  contact: Contact;
  affiliations: ContactCompanyAffiliation[];
  crmSummary: ContactCrmSummary;
}) {
  const primaryAff =
    affiliations.find((a) => a.is_primary) ?? affiliations[0] ?? null;
  const companyLabel =
    primaryAff?.company_name?.trim() ||
    contact.company_name?.trim() ||
    null;
  const companyId = primaryAff?.company_business_id ?? null;
  const title = contact.title?.trim() || primaryAff?.job_title?.trim() || null;
  const openDeals = crmSummary.openOpportunities > 0 ? String(crmSummary.openOpportunities) : null;
  const affiliationsCount = affiliations.length > 0 ? String(affiliations.length) : companyLabel ? "1" : null;

  return (
    <dl className="flex flex-wrap divide-x divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="min-w-[5.5rem] flex-1 px-3 py-2">
        <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Primary company</dt>
        <dd className="mt-0.5 text-sm font-medium text-slate-900">
          {companyLabel && companyId ? (
            <Link href={companyFullPageHref(companyId) ?? "#"} className="text-violet-900 hover:underline">
              {companyLabel}
            </Link>
          ) : (
            companyLabel ?? "—"
          )}
        </dd>
      </div>
      <StripCell label="Title" value={title} />
      <StripCell label="Affiliations" value={affiliationsCount} />
      <StripCell label="Open opportunities" value={openDeals} />
      <StripCell label="Email" value={contact.email} />
      <StripCell label="Phone" value={contact.phone} />
    </dl>
  );
}
