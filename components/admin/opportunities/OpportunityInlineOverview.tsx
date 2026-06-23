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
  OPPORTUNITY_LEAD_TYPES,
  OPPORTUNITY_LEAD_TYPE_LABELS,
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_STATUS_LABELS,
} from "@/lib/lookups";
import {
  closedOutcomeReasonLabel,
  isClosedOpportunityStatus,
} from "@/lib/openOpportunityStatus";
import { partiesSummaryRows } from "@/lib/opportunityPartiesDisplay";
import {
  OPPORTUNITY_SALES_ROLES,
  OPPORTUNITY_SALES_ROLE_LABELS,
  type OpportunitySalesRole,
} from "@/lib/opportunityValues";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";
import { toLegacyContactSelectOptions } from "@/lib/crmSelectOptions";
import type { CompanyOption } from "@/lib/repos/companies";

export function OpportunityInlineOverview({ data }: { data: OpportunityDetailData }) {
  const { opportunity, companies, contacts, parties } = data;
  const summary = partiesSummaryRows(parties);

  const companyContacts = useMemo(() => {
    if (!opportunity.company_id) return contacts;
    const filtered = contacts.filter((c) => c.company_id === opportunity.company_id);
    return filtered.length > 0 ? filtered : contacts;
  }, [contacts, opportunity.company_id]);

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
          label="Opportunity name"
          value={opportunity.client_name}
          onSave={save("client_name")}
        />
        <InlineCompanyPickerField
          label="Company"
          companyId={opportunity.company_id ?? 0}
          companyName={opportunity.linked_company_name ?? opportunity.company_name}
          companies={companies as CompanyOption[]}
          onSave={async (id) => save("company_id")(Number(id) > 0 ? Number(id) : null)}
        />
        <InlineSelectField
          label="Contact"
          value={opportunity.primary_contact_id ? String(opportunity.primary_contact_id) : ""}
          options={contactOptions}
          onSave={async (value) => {
            const id = value ? Number.parseInt(String(value), 10) : null;
            return save("primary_contact_id")(Number.isFinite(id) ? id : null);
          }}
        />
        <InlineSelectField
          label="Lead type"
          value={opportunity.lead_type}
          options={OPPORTUNITY_LEAD_TYPES.map((t) => ({
            value: t,
            label: OPPORTUNITY_LEAD_TYPE_LABELS[t],
          }))}
          onSave={save("lead_type")}
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
        <InlineSelectField
          label="Sales role"
          value={(opportunity.sales_role ?? "to_lease") as OpportunitySalesRole}
          options={OPPORTUNITY_SALES_ROLES.map((r) => ({
            value: r,
            label: OPPORTUNITY_SALES_ROLE_LABELS[r],
          }))}
          onSave={save("sales_role")}
        />
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
            salesRole={(opportunity.sales_role ?? "to_lease") as OpportunitySalesRole}
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
          label="Internal remarks"
          value={opportunity.remarks}
          onSave={save("remarks")}
          compact
          fullWidth
        />
      </DrawerOverviewCard>
    </div>
  );
}
