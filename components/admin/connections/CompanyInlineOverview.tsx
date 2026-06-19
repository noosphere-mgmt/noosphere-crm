"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { patchCompanyFieldAction } from "@/app/admin/companies/actions";
import { DrawerOverviewCard } from "@/components/admin/connections/DrawerOverviewCard";
import { InlineEditProvider } from "@/components/admin/inline/InlineEditProvider";
import { InlineRecordToolbar } from "@/components/admin/inline/InlineRecordChrome";
import {
  InlineMultiSelectField,
  InlineReadOnlyField,
  InlineTextAreaField,
  InlineTextField,
} from "@/components/admin/inline/InlineFields";
import { companyDrawerHref } from "@/lib/connectionsDrawerNav";
import type { CompanyDetailTabId } from "@/lib/companyDetailTab";
import { COVERAGE_OPTIONS } from "@/lib/connectionsValues";
import { COMPANY_ROLES, COMPANY_ROLE_LABELS } from "@/lib/lookups";
import type { CompanyCrmSummary } from "@/lib/repos/companyCrmSummary";
import type { Company, CompanyRole } from "@/lib/types/entities";

function normalizeRoles(roles: CompanyRole[]): CompanyRole[] {
  return roles.map((role) => {
    if (role === "property_management") return "building_management";
    if (role === "developer") return "other";
    return role;
  });
}

function CrmStat({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
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

export function CompanyInlineOverview({
  company,
  crmSummary,
  lastActivityDate,
  deleteAction,
  initialEditHighlight = false,
  embedded = false,
}: {
  company: Company;
  crmSummary?: CompanyCrmSummary;
  lastActivityDate?: string | null;
  deleteAction?: () => Promise<void>;
  initialEditHighlight?: boolean;
  embedded?: boolean;
}) {
  const searchParams = useSearchParams();
  const roles = useMemo(() => normalizeRoles(company.roles?.length ? company.roles : ["client"]), [company.roles]);
  const lastActivity = lastActivityDate?.slice(0, 10) ?? null;

  const save = useCallback(
    (field: string) => async (value: unknown) => {
      const result = await patchCompanyFieldAction(company.id, field, JSON.stringify(value));
      return { ok: result.ok, error: result.ok ? undefined : result.error };
    },
    [company.id],
  );

  const tabHref = (tab: CompanyDetailTabId) =>
    companyDrawerHref("/admin/companies", searchParams, company.id, tab);

  const body = (
    <div className="grid gap-4 lg:grid-cols-2">
      <DrawerOverviewCard title="Identity" columns={1} dense={false} matchHeight>
        <InlineTextField label="Company Name (EN)" value={company.company_name} onSave={save("company_name")} />
        <InlineTextField
          label="Company Name (ZH)"
          value={company.company_name_zh}
          onSave={save("company_name_zh")}
        />
        <InlineTextField
          label="Company Name (CN)"
          value={company.company_name_cn}
          onSave={save("company_name_cn")}
        />
      </DrawerOverviewCard>

      <DrawerOverviewCard title="CRM Summary" columns={2} dense={false} matchHeight>
        <InlineMultiSelectField
          label="Role"
          values={roles}
          options={[...COMPANY_ROLES]}
          optionLabel={(r) => COMPANY_ROLE_LABELS[r] ?? r}
          onSave={save("roles")}
          colSpan={1}
        />
        <InlineMultiSelectField
          label="Coverage"
          values={company.coverage ?? []}
          options={[...COVERAGE_OPTIONS]}
          onSave={save("coverage")}
          colSpan={1}
          allowSelectAll
        />
        <InlineTextField label="Industry" value={company.industry} onSave={save("industry")} />
        <InlineTextField label="Source" value={company.source} onSave={save("source")} />
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
      </DrawerOverviewCard>

      <DrawerOverviewCard title="Contact & Location" columns={2} dense={false} matchHeight>
        <InlineTextField label="Country" value={company.country} onSave={save("country")} />
        <InlineTextField label="City" value={company.city} onSave={save("city")} />
        <InlineTextField label="District" value={company.district} onSave={save("district")} />
        <InlineTextField label="Phone" value={company.phone} onSave={save("phone")} />
        <InlineTextField label="Email" value={company.email} type="email" onSave={save("email")} />
        <InlineTextField label="Website" value={company.website} type="url" onSave={save("website")} />
      </DrawerOverviewCard>

      <DrawerOverviewCard title="Notes" columns={1} dense={false} matchHeight>
        <InlineTextAreaField label="Internal Remarks" value={company.notes} onSave={save("notes")} />
      </DrawerOverviewCard>
    </div>
  );

  if (embedded) {
    return body;
  }

  return (
    <InlineEditProvider initialEditHighlight={initialEditHighlight}>
      <div className="mb-3 flex items-start justify-end gap-2">
        {deleteAction ? <InlineRecordToolbar deleteAction={deleteAction} /> : null}
      </div>
      {body}
    </InlineEditProvider>
  );
}
