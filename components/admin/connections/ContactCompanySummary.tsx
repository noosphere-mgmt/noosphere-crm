"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DrawerOverviewCard } from "@/components/admin/connections/DrawerOverviewCard";
import { InlineReadOnlyField } from "@/components/admin/inline/InlineFields";
import { companyDrawerHref } from "@/lib/connectionsDrawerNav";
import type { CompanyDetailTabId } from "@/lib/companyDetailTab";
import { formatCompanyRoles, formatCoverage } from "@/lib/connectionsDisplay";
import { connectionsGlassClasses } from "@/lib/connectionsGlassTheme";
import { RELATIONSHIP_STRENGTH_LABELS } from "@/lib/lookups";
import type { CompanyCrmSummary } from "@/lib/repos/companyCrmSummary";
import type { Company } from "@/lib/types/entities";

function CrmStat({
  label,
  value,
  href,
}: {
  label: string;
  value: number | string;
  href?: string;
}) {
  const content = (
    <>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-900">{value}</dd>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block rounded-sm transition-colors hover:bg-slate-50/80">
        {content}
      </Link>
    );
  }

  return <div>{content}</div>;
}

export function ContactCompanyTab({
  company,
  crmSummary,
  lastActivityDate,
}: {
  company: Company;
  crmSummary?: CompanyCrmSummary;
  lastActivityDate?: string | null;
}) {
  const searchParams = useSearchParams();
  const lastActivity = lastActivityDate?.slice(0, 10) ?? null;
  const strength = company.relationship_strength
    ? RELATIONSHIP_STRENGTH_LABELS[company.relationship_strength]
    : null;

  const tabHref = (tab: CompanyDetailTabId) =>
    companyDrawerHref("/admin/companies", searchParams, company.id, tab);

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <div className="flex items-center justify-end">
        <Link
          href={companyDrawerHref("/admin/companies", searchParams, company.id, "overview")}
          className={`text-sm font-medium ${connectionsGlassClasses.link}`}
        >
          Open company drawer
        </Link>
      </div>

      <div className="grid w-full gap-4 lg:grid-cols-2">
        <DrawerOverviewCard title="Identity" columns={1} dense={false} matchHeight className="w-full">
          <InlineReadOnlyField label="Company Name (EN)" value={company.company_name} />
          <InlineReadOnlyField label="Company Name (ZH)" value={company.company_name_zh} />
          <InlineReadOnlyField label="Company Name (CN)" value={company.company_name_cn} />
        </DrawerOverviewCard>

        <DrawerOverviewCard title="CRM Summary" columns={2} dense={false} matchHeight className="w-full">
          <InlineReadOnlyField
            label="Role"
            value={formatCompanyRoles(company.roles?.length ? company.roles : ["client"])}
          />
          <InlineReadOnlyField label="Coverage" value={formatCoverage(company.coverage)} />
          <InlineReadOnlyField label="Industry" value={company.industry} />
          <InlineReadOnlyField label="Source" value={company.source} />
          {crmSummary && crmSummary.contacts > 0 ? (
            <CrmStat label="Contacts" value={crmSummary.contacts} href={tabHref("contacts")} />
          ) : null}
          {crmSummary && crmSummary.properties > 0 ? (
            <CrmStat label="Properties" value={crmSummary.properties} href={tabHref("premises")} />
          ) : null}
          {crmSummary && crmSummary.premises > 0 ? (
            <CrmStat label="Premises" value={crmSummary.premises} href={tabHref("premises")} />
          ) : null}
          {crmSummary && crmSummary.openOpportunities > 0 ? (
            <CrmStat
              label="Open Opps"
              value={crmSummary.openOpportunities}
              href={tabHref("opportunities")}
            />
          ) : null}
          {lastActivity ? <InlineReadOnlyField label="Last Activity" value={lastActivity} /> : null}
          {strength ? <InlineReadOnlyField label="Relationship" value={strength} /> : null}
          <InlineReadOnlyField
            label="Next Follow-up"
            value={company.next_follow_up_date?.slice(0, 10) ?? null}
          />
        </DrawerOverviewCard>

        <DrawerOverviewCard title="Contact & Location" columns={2} dense={false} matchHeight className="w-full">
          <InlineReadOnlyField label="Country" value={company.country} />
          <InlineReadOnlyField label="City" value={company.city} />
          <InlineReadOnlyField label="District" value={company.district} />
          <InlineReadOnlyField label="Phone" value={company.phone} />
          <InlineReadOnlyField label="Email" value={company.email} />
          <InlineReadOnlyField label="Website" value={company.website} />
        </DrawerOverviewCard>

        <DrawerOverviewCard title="Notes" columns={1} dense={false} matchHeight className="w-full">
          <InlineReadOnlyField label="Internal Remarks" value={company.notes} />
        </DrawerOverviewCard>
      </div>
    </div>
  );
}
