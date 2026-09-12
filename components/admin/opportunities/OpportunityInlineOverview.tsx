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
import { selectableContactsForCompany } from "@/lib/contactCompanyFilter";
import { isSelectableContact } from "@/lib/contactVisibility";
import { partiesSummaryRows } from "@/lib/opportunityPartiesDisplay";
import {
  formatOpportunityMoney,
  opportunityNetProfit,
  parseOpportunityMoney,
} from "@/lib/opportunityFinancials";
import {
  OPPORTUNITY_SALES_ROLE_LABELS,
  normalizeOpportunitySalesRole,
  opportunitySalesRoleSelectOptions,
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
    const selectable = selectableContactsForCompany(contacts, companyValue, companies as CompanyOption[]);
    const currentValue = resolveContactSelectValue(contacts, opportunity.primary_contact_id);
    const historical = contacts.find(
      (contact) =>
        resolveContactSelectValue(contacts, contact.id) === currentValue && !isSelectableContact(contact),
    );
    return historical ? [historical, ...selectable.filter((contact) => contact.id !== historical.id)] : selectable;
  }, [contacts, companies, opportunity.company_id, opportunity.primary_contact_id]);

  const referrerContacts = useMemo(() => {
    const companyValue = resolveCompanySelectValue(companies as CompanyOption[], opportunity.referrer_company_id);
    const selectable = selectableContactsForCompany(contacts, companyValue, companies as CompanyOption[]);
    const currentValue = resolveContactSelectValue(contacts, opportunity.referrer_contact_id);
    const historical = contacts.find(
      (contact) =>
        resolveContactSelectValue(contacts, contact.id) === currentValue && !isSelectableContact(contact),
    );
    return historical ? [historical, ...selectable.filter((contact) => contact.id !== historical.id)] : selectable;
  }, [contacts, companies, opportunity.referrer_company_id, opportunity.referrer_contact_id]);

  const contactOptions = useMemo(() => {
    const labels = new Map(
      toLegacyContactSelectOptions(companyContacts).map((option) => [option.value, option.label] as const),
    );
    return [
      { value: "", label: "—" },
      ...companyContacts.map((contact) => {
        const value = resolveContactSelectValue(contacts, contact.id);
        return {
          value,
          label: labels.get(value) ?? contact.contact_name,
        };
      }),
    ];
  }, [companyContacts, contacts]);

  const referrerContactOptions = useMemo(() => {
    const labels = new Map(
      toLegacyContactSelectOptions(referrerContacts).map((option) => [option.value, option.label] as const),
    );
    return [
      { value: "", label: "Direct / none" },
      ...referrerContacts.map((contact) => {
        const value = resolveContactSelectValue(contacts, contact.id);
        return {
          value,
          label: labels.get(value) ?? contact.contact_name,
        };
      }),
    ];
  }, [referrerContacts, contacts]);

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
        <InlineCompanyPickerField
          label="Introduced by company"
          companyId={opportunity.referrer_company_id}
          companyName={opportunity.referrer_company_name ?? null}
          companies={companies as CompanyOption[]}
          onSave={(businessId) => save("referrer_company_id")(businessId)}
        />
        <InlineSelectField
          label="Introduced by contact"
          value={resolveContactSelectValue(contacts, opportunity.referrer_contact_id)}
          options={referrerContactOptions}
          onSave={(value) => save("referrer_contact_id")(value || null)}
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
          options={opportunitySalesRoleSelectOptions(opportunity.sales_role).map((r) => ({
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
          fullWidth
        />
      </DrawerOverviewCard>

      <DrawerOverviewCard title="Financials" columns={3} dense={false} className="w-full">
        <InlineTextField
          label="Commission / Income (HKD)"
          type="number"
          value={opportunity.commission_income}
          onSave={save("commission_income")}
          useGrouping={false}
        />
        <InlineTextField
          label="Related Costs (HKD)"
          type="number"
          value={opportunity.related_costs}
          onSave={save("related_costs")}
          useGrouping={false}
        />
        <div className="min-w-0 py-1">
          <dt className={labelClass}>Net Profit</dt>
          <dd className="mt-1 text-sm font-semibold tabular-nums text-slate-900">
            {formatOpportunityMoney(
              opportunityNetProfit(
                parseOpportunityMoney(opportunity.commission_income),
                parseOpportunityMoney(opportunity.related_costs),
              ),
            )}
          </dd>
        </div>
      </DrawerOverviewCard>
    </div>
  );
}
