"use client";

import { useState } from "react";
import { FormField } from "@/components/admin/AdminFormFields";
import { DrawerOverviewCard } from "@/components/admin/connections/DrawerOverviewCard";
import { OpportunityPartyContactSelect } from "@/components/admin/opportunities/OpportunityPartyContactSelect";
import {
  CompactField,
  OpportunityRequirementFields,
  OpportunitySalesRoleSelect,
  fieldGrid,
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
import { partiesSummaryRows } from "@/lib/opportunityPartiesDisplay";
import { OPPORTUNITY_SALES_ROLE_LABELS, type OpportunitySalesRole } from "@/lib/opportunityValues";
import type { ContactOption } from "@/lib/repos/contacts";
import type { Opportunity, OpportunityParty } from "@/lib/types/entities";
import { TextAreaField } from "@/components/admin/AdminFormFields";

const cardShell = "!px-3.5 !pt-3 !pb-3.5";

type CompanyOption = { id: number; company_name: string };

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
  const [companyId, setCompanyId] = useState(opportunity.company_id?.toString() ?? "");
  const [salesRole, setSalesRole] = useState<OpportunitySalesRole>(opportunity.sales_role ?? "to_lease");

  return (
    <div className="space-y-4">
      <DrawerOverviewCard title="Opportunity" dense bare className={cardShell}>
        {editing ? (
          <dl className={fieldGrid}>
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
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            </label>
            <OpportunityPartyContactSelect
              instanceKey={`overview-${opportunity.id}-${companyId}`}
              companyId={companyId}
              contacts={contacts}
              defaultContactId={opportunity.primary_contact_id?.toString()}
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
              <select name="status" defaultValue={opportunity.status} className={selectClass}>
                {OPPORTUNITY_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {OPPORTUNITY_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <OpportunitySalesRoleSelect value={salesRole} onChange={setSalesRole} />
          </dl>
        ) : (
          <dl className={fieldGrid}>
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
          </dl>
        )}
      </DrawerOverviewCard>

      {opportunity.referrer_company_id ? (
        <input type="hidden" name="referrer_company_id" value={opportunity.referrer_company_id} />
      ) : null}
      {opportunity.referrer_contact_id ? (
        <input type="hidden" name="referrer_contact_id" value={opportunity.referrer_contact_id} />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <DrawerOverviewCard title="Requirement" dense matchHeight bare className={cardShell}>
          <OpportunityRequirementFields opportunity={opportunity} salesRole={salesRole} editing={editing} />
        </DrawerOverviewCard>

        <DrawerOverviewCard title="Parties summary" dense matchHeight bare className={cardShell}>
          <dl className="space-y-3">
            {summary.map((row) => (
              <div key={row.label} className="flex min-w-0 items-baseline gap-4 py-0.5">
                <dt className={`${labelClass} w-20 shrink-0`}>{row.label}</dt>
                <dd className="min-w-0 flex-1 text-sm leading-relaxed text-slate-900">{row.value}</dd>
              </div>
            ))}
          </dl>
        </DrawerOverviewCard>
      </div>

      <DrawerOverviewCard title="Notes" dense bare className={cardShell}>
        {editing ? (
          <TextAreaField label="Internal remarks" name="remarks" defaultValue={opportunity.remarks ?? ""} />
        ) : (
          <div className="pt-1">
            <dt className={labelClass}>Internal remarks</dt>
            <dd className="mt-1.5 line-clamp-4 text-sm leading-relaxed text-slate-900">
              {opportunity.remarks?.trim() || "—"}
            </dd>
          </div>
        )}
      </DrawerOverviewCard>
    </div>
  );
}
