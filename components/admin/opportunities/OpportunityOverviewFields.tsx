"use client";

import { useState } from "react";
import { FormField } from "@/components/admin/AdminFormFields";
import { DrawerOverviewCard } from "@/components/admin/connections/DrawerOverviewCard";
import { OpportunityPartyContactSelect } from "@/components/admin/opportunities/OpportunityPartyContactSelect";
import {
  CompactField,
  OpportunityRequirementFields,
  OpportunitySalesRoleSelect,
  labelClass,
  selectClass,
} from "@/components/admin/opportunities/OpportunityRequirementFields";
import { useFormEditing } from "@/components/admin/ModuleActionBar";
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
import { toLegacyCompanySelectOptions, toLegacyContactSelectOptions, resolveCompanySelectValue, resolveContactSelectValue } from "@/lib/crmSelectOptions";
import { OPPORTUNITY_SALES_ROLE_LABELS, type OpportunitySalesRole } from "@/lib/opportunityValues";
import type { CompanyOption } from "@/lib/repos/companies";
import type { ContactOption } from "@/lib/repos/contacts";
import type { Opportunity, OpportunityParty, OpportunityStatus } from "@/lib/types/entities";
import { TextAreaField } from "@/components/admin/AdminFormFields";

export function OpportunityOverviewFields({
  opportunity,
  parties,
  companies,
  contacts,
  lastActivityDate,
}: {
  opportunity: Opportunity;
  parties: OpportunityParty[];
  companies: CompanyOption[];
  contacts: ContactOption[];
  lastActivityDate?: string | null;
}) {
  const editing = useFormEditing();
  const summary = partiesSummaryRows(parties);
  const companyOptions = toLegacyCompanySelectOptions(companies);
  const contactOptions = toLegacyContactSelectOptions(contacts);
  const [companyId, setCompanyId] = useState(resolveCompanySelectValue(companies, opportunity.company_id));
  const [salesRole, setSalesRole] = useState<OpportunitySalesRole>(opportunity.sales_role ?? "to_lease");
  const [status, setStatus] = useState<OpportunityStatus>(opportunity.status);

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <DrawerOverviewCard title="Opportunity" columns={3} dense={false} className="w-full">
        {editing ? (
          <>
            <FormField label="Opportunity name" name="client_name" defaultValue={opportunity.client_name} required />
            <label className="block min-w-0 text-sm">
              <span className={labelClass}>Company</span>
              <select
                name="company_id"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className={selectClass}
              >
                <option value="">—</option>
                {companyOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <OpportunityPartyContactSelect
              instanceKey={`overview-${opportunity.id}-${companyId}`}
              companyId={companyId}
              contacts={contacts}
              companies={companies}
              contactOptions={contactOptions}
              defaultContactId={resolveContactSelectValue(contacts, opportunity.primary_contact_id)}
              fieldName="primary_contact_id"
              onNewContact={() => {}}
            />
            <label className="block min-w-0 text-sm">
              <span className={labelClass}>Lead type</span>
              <select name="lead_type" defaultValue={opportunity.lead_type} className={selectClass}>
                {OPPORTUNITY_LEAD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {OPPORTUNITY_LEAD_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block min-w-0 text-sm">
              <span className={labelClass}>Status</span>
              <select
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as OpportunityStatus)}
                className={selectClass}
              >
                {OPPORTUNITY_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {OPPORTUNITY_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <OpportunitySalesRoleSelect value={salesRole} onChange={setSalesRole} />
            {isClosedOpportunityStatus(status) ? (
              <FormField
                label={closedOutcomeReasonLabel(status)}
                name="lost_reason"
                defaultValue={opportunity.lost_reason ?? ""}
              />
            ) : null}
          </>
        ) : (
          <>
            <CompactField label="Opportunity name" value={opportunity.client_name} />
            <CompactField label="Company" value={opportunity.linked_company_name ?? ""} />
            <CompactField label="Contact" value={opportunity.primary_contact_name ?? ""} />
            <CompactField label="Lead type" value={OPPORTUNITY_LEAD_TYPE_LABELS[opportunity.lead_type]} />
            <CompactField label="Status" value={OPPORTUNITY_STATUS_LABELS[opportunity.status]} />
            {lastActivityDate ? (
              <CompactField label="Last activity" value={lastActivityDate.slice(0, 10)} />
            ) : null}
            <OpportunitySalesRoleSelect
              value={salesRole}
              readOnlyLabel={OPPORTUNITY_SALES_ROLE_LABELS[opportunity.sales_role ?? "to_lease"]}
            />
            {isClosedOpportunityStatus(opportunity.status) ? (
              <CompactField
                label={closedOutcomeReasonLabel(opportunity.status)}
                value={opportunity.lost_reason ?? ""}
              />
            ) : null}
          </>
        )}
      </DrawerOverviewCard>

      {opportunity.referrer_company_id ? (
        <input type="hidden" name="referrer_company_id" value={opportunity.referrer_company_id} />
      ) : null}
      {opportunity.referrer_contact_id ? (
        <input type="hidden" name="referrer_contact_id" value={opportunity.referrer_contact_id} />
      ) : null}

      <div className="grid w-full min-w-0 grid-cols-1 items-stretch gap-4 md:grid-cols-2">
        <DrawerOverviewCard title="Requirement" columns={1} dense={false} matchHeight className="w-full min-w-0">
          <div className="col-span-full w-full">
            <OpportunityRequirementFields opportunity={opportunity} salesRole={salesRole} editing={editing} />
          </div>
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
        {editing ? (
          <TextAreaField label="Internal remarks" name="remarks" defaultValue={opportunity.remarks ?? ""} />
        ) : (
          <div className="py-1">
            <dt className={labelClass}>Internal remarks</dt>
            <dd className="mt-1 text-sm font-normal leading-relaxed text-slate-900 whitespace-pre-wrap">
              {opportunity.remarks?.trim() || "—"}
            </dd>
          </div>
        )}
      </DrawerOverviewCard>
    </div>
  );
}
