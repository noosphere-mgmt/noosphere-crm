"use client";

import { useMemo, useState } from "react";
import { FormField, TextAreaField } from "@/components/admin/AdminFormFields";
import {
  OpportunityRequirementFields,
  OpportunitySalesRoleSelect,
  fieldGrid,
  labelClass,
  selectClass,
} from "@/components/admin/opportunities/OpportunityRequirementFields";
import { useFormEditing } from "@/components/admin/ModuleActionBar";
import { contactsForCompany } from "@/lib/contactCompanyFilter";
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
import {
  type OpportunitySalesRole,
} from "@/lib/opportunityValues";
import { toLegacyCompanySelectOptions, toLegacyContactSelectOptions, resolveCompanySelectValue, resolveContactSelectValue } from "@/lib/crmSelectOptions";
import type { ContactOption } from "@/lib/repos/contacts";
import type { CompanyOption } from "@/lib/repos/companies";
import type { Opportunity, OpportunityStatus } from "@/lib/types/entities";
import { RecordBusinessId } from "@/components/admin/RecordBusinessId";

type Props = {
  defaults?: Opportunity;
  companies: CompanyOption[];
  contacts: ContactOption[];
};

const selectReadOnlyClass = "mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800";

export function OpportunityFormFields({ defaults, companies, contacts }: Props) {
  const editing = useFormEditing();
  const companyOptions = useMemo(() => toLegacyCompanySelectOptions(companies), [companies]);
  const contactOptions = useMemo(() => toLegacyContactSelectOptions(contacts), [contacts]);
  const [companyId, setCompanyId] = useState(
    resolveCompanySelectValue(companies, defaults?.company_id),
  );
  const [primaryContactId, setPrimaryContactId] = useState(
    resolveContactSelectValue(contacts, defaults?.primary_contact_id),
  );
  const [salesRole, setSalesRole] = useState<OpportunitySalesRole>(defaults?.sales_role ?? "to_lease");
  const [status, setStatus] = useState<OpportunityStatus>(defaults?.status ?? "new");

  const contactsForCompanyList = useMemo(
    () => contactsForCompany(contacts, companyId, companies),
    [companyId, contacts, companies],
  );

  const opportunityDefaults: Opportunity = {
    id: defaults?.id ?? 0,
    client_name: defaults?.client_name ?? "",
    lead_type: defaults?.lead_type ?? "direct_client",
    company_name: defaults?.company_name ?? null,
    company_id: defaults?.company_id ?? null,
    primary_contact_id: defaults?.primary_contact_id ?? null,
    referrer_company_id: defaults?.referrer_company_id ?? null,
    referrer_contact_id: defaults?.referrer_contact_id ?? null,
    sales_role: salesRole,
    lease_term: defaults?.lease_term ?? null,
    expected_close_date: defaults?.expected_close_date ?? null,
    lost_reason: defaults?.lost_reason ?? null,
    relationship_owner: defaults?.relationship_owner ?? null,
    budget_min: null,
    budget_max: defaults?.budget_max ?? defaults?.budget_min ?? null,
    required_area_sqft: defaults?.required_area_sqft ?? null,
    required_capacity_pax: defaults?.required_capacity_pax ?? null,
    district_preference: defaults?.district_preference ?? null,
    workspace_type: defaults?.workspace_type ?? null,
    property_type: defaults?.property_type ?? null,
    target_yield: defaults?.target_yield ?? null,
    funding_status: defaults?.funding_status ?? null,
    move_in_date: defaults?.move_in_date ?? null,
    status,
    requirement_summary: defaults?.requirement_summary ?? null,
    remarks: defaults?.remarks ?? null,
    created_at: defaults?.created_at ?? "",
    updated_at: defaults?.updated_at ?? "",
  };

  function onCompanyChange(next: string) {
    setCompanyId(next);
    const stillValid = contactsForCompanyList.some(
      (c) => resolveContactSelectValue(contacts, c.id) === primaryContactId,
    );
    if (!stillValid) {
      setPrimaryContactId("");
    }
  }

  return (
    <>
      {defaults?.business_id ? (
        <div className="mb-2">
          <RecordBusinessId id={defaults.business_id} />
        </div>
      ) : null}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-sm font-medium text-slate-800">Referrer & admin</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Referrer company
            <select
              name="referrer_company_id"
              defaultValue={resolveCompanySelectValue(companies, defaults?.referrer_company_id)}
              disabled={!editing}
              className={editing ? selectClass : selectReadOnlyClass}
            >
              <option value="">— None —</option>
              {companyOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <FormField
            label="Relationship owner (override)"
            name="relationship_owner"
            defaultValue={defaults?.relationship_owner ?? ""}
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm font-medium text-slate-800">Opportunity</p>
        <dl className={fieldGrid}>
          <FormField label="Opportunity name" name="client_name" defaultValue={defaults?.client_name ?? ""} required />
          <label className="block min-w-0 text-sm">
            <span className={labelClass}>Company</span>
            <select
              name="company_id"
              value={companyId}
              onChange={(e) => onCompanyChange(e.target.value)}
              disabled={!editing}
              className={editing ? selectClass : selectReadOnlyClass}
            >
              <option value="">— Select company —</option>
              {companyOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block min-w-0 text-sm">
            <span className={labelClass}>Contact</span>
            <select
              name="primary_contact_id"
              value={primaryContactId}
              onChange={(e) => setPrimaryContactId(e.target.value)}
              className={editing ? selectClass : selectReadOnlyClass}
              disabled={!editing || !companyId}
            >
              <option value="">— Select contact —</option>
              {contactsForCompanyList.map((c) => {
                const value = resolveContactSelectValue(contacts, c.id);
                const opt = contactOptions.find((o) => o.value === value);
                return (
                  <option key={c.id} value={value}>
                    {opt?.label ?? c.contact_name}
                  </option>
                );
              })}
            </select>
          </label>
          <label className="block min-w-0 text-sm">
            <span className={labelClass}>Lead type</span>
            <select
              name="lead_type"
              defaultValue={defaults?.lead_type ?? "direct_client"}
              disabled={!editing}
              className={editing ? selectClass : selectReadOnlyClass}
            >
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
              disabled={!editing}
              className={editing ? selectClass : selectReadOnlyClass}
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
              defaultValue={defaults?.lost_reason ?? ""}
            />
          ) : null}
        </dl>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm font-medium text-slate-800">Requirement</p>
        <OpportunityRequirementFields opportunity={opportunityDefaults} salesRole={salesRole} editing={editing} />
      </div>

      <TextAreaField label="Internal remarks" name="remarks" defaultValue={defaults?.remarks ?? ""} />
      <p className="text-xs text-slate-500">
        District: comma-separated (e.g. Central, Admiralty, Causeway Bay).
      </p>
    </>
  );
}
