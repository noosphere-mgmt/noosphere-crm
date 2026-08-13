"use client";

import { useCallback, useMemo } from "react";
import { patchOpportunityFieldAction } from "@/app/admin/opportunities/actions";
import { DrawerOverviewCard } from "@/components/admin/connections/DrawerOverviewCard";
import {
  InlineCompanyPickerField,
  InlineSelectField,
  InlineTextAreaField,
  InlineTextField,
} from "@/components/admin/inline/InlineFields";
import { OpportunityRequirementInlineFields } from "@/components/admin/opportunities/OpportunityRequirementInlineFields";
import { labelClass } from "@/components/admin/opportunities/OpportunityRequirementFields";
import {
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_STATUS_LABELS,
} from "@/lib/lookups";
import {
  closedOutcomeReasonLabel,
  isClosedOpportunityStatus,
} from "@/lib/openOpportunityStatus";
import { contactsForCompany } from "@/lib/contactCompanyFilter";
import { partiesSummaryRows } from "@/lib/opportunityPartiesDisplay";
import {
  OPPORTUNITY_SALES_ROLES,
  OPPORTUNITY_SALES_ROLE_LABELS,
  normalizeOpportunitySalesRole,
} from "@/lib/opportunityValues";
import { OPPORTUNITY_SOURCES, OPPORTUNITY_SOURCE_LABELS } from "@/lib/opportunitySourceValues";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";
import { toLegacyContactSelectOptions, resolveCompanySelectValue, resolveContactSelectValue } from "@/lib/crmSelectOptions";
import type { CompanyOption } from "@/lib/repos/companies";

export function OpportunityInlineOverview({ data }: { data: OpportunityDetailData }) {
  const { opportunity, companies, contacts, parties } = data;
  const summary = partiesSummaryRows(parties);

  const companyContacts = useMemo(() => {
    const companyValue = resolveCompanySelectValue(companies as CompanyOption[], opportunity.company_id);
    return contactsForCompany(contacts, companyValue, companies as CompanyOption[]);
  }, [contacts, companies, opportunity.company_id]);

  const contactOptions = useMemo(
    () => [
      { value: "", label: "—" },
      ...toLegacyContactSelectOptions(companyContacts).map((c) => ({
        value: c.value,
        label: c.label,
      })),
    ],
    [companyContacts],
  );

  const save = useCallback(
    (field: string) => async (value: unknown) => {
      const result = await patchOpportunityFieldAction(opportunity.id, field, JSON.stringify(value));
      return { ok: result.ok, error: result.ok ? undefined : result.error };
    },
    [opportunity.id],
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <DrawerOverviewCard title="Opportunity" columns={3} dense={false} className="w-full">
        <InlineTextField
          label="Opportunity Name"
          value={opportunity.client_name}
          onSave={save("client_name")}
        />
        <InlineCompanyPickerField
          label="Company"
          companyId={opportunity.company_id ?? 0}
          companyName={opportunity.linked_company_name ?? opportunity.company_name}
          companies={companies as CompanyOption[]}
          onSave={(businessId) => save("company_id")(businessId)}
        />
        <InlineSelectField
          label="Contact"
          value={resolveContactSelectValue(contacts, opportunity.primary_contact_id)}
          options={contactOptions}
          onSave={(value) => save("primary_contact_id")(value || null)}
        />
        <InlineSelectField
          label="Lead/Opp Source"
          value={opportunity.lead_source ?? "direct"}
          options={OPPORTUNITY_SOURCES.map((source) => ({ value: source, label: OPPORTUNITY_SOURCE_LABELS[source] }))}
          onSave={save("lead_source")}
        />
        <InlineSelectField
          label="Sales Role"
          value={normalizeOpportunitySalesRole(opportunity.sales_role)}
          options={OPPORTUNITY_SALES_ROLES.map((r) => ({
            value: r,
            label: OPPORTUNITY_SALES_ROLE_LABELS[r],
          }))}
          onSave={save("sales_role")}
        />
        <InlineSelectField
          label="Status"
          value={opportunity.status}
          options={OPPORTUNITY_STATUSES.map((s) => ({
            value: s,
            label: OPPORTUNITY_STATUS_LABELS[s],
          }))}
          onSave={save("status")}
        />
        {isClosedOpportunityStatus(opportunity.status) ? (
          <InlineTextField
            label={closedOutcomeReasonLabel(opportunity.status)}
            value={opportunity.lost_reason}
            onSave={save("lost_reason")}
          />
        ) : null}
      </DrawerOverviewCard>

      <div className="grid w-full min-w-0 grid-cols-1 items-stretch gap-4 md:grid-cols-2">
        <DrawerOverviewCard
          title="Requirement"
          columns={3}
          mobileColumns={2}
          dense={false}
          matchHeight
          className="w-full min-w-0"
        >
          <OpportunityRequirementInlineFields
            opportunity={opportunity}
            save={save}
            salesRole={normalizeOpportunitySalesRole(opportunity.sales_role)}
          />
        </DrawerOverviewCard>

        <DrawerOverviewCard title="Parties summary" columns={1} dense={false} matchHeight className="w-full min-w-0">
          <dl className="space-y-3">
            {summary.map((row) => (
              <div key={row.label} className="min-w-0 py-1">
                <dt className={labelClass}>{row.label}</dt>
                <dd className="mt-1 text-sm font-normal leading-relaxed text-slate-900">{row.value}</dd>
              </div>
            ))}
          </dl>
        </DrawerOverviewCard>
      </div>

      <DrawerOverviewCard title="Notes" columns={1} dense={false} className="w-full">
        <InlineTextAreaField
          label="Internal Remarks"
          value={opportunity.remarks}
          onSave={save("remarks")}
          compact
          fullWidth
        />
      </DrawerOverviewCard>
    </div>
  );
}
