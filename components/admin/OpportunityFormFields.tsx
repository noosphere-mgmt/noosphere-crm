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
  type OpportunitySalesRole,
} from "@/lib/opportunityValues";
import type { ContactOption } from "@/lib/repos/contacts";
import type { Opportunity } from "@/lib/types/entities";

const selectReadOnlyClass = "mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800";

type CompanyOption = { id: number; company_name: string };

type Props = {
  defaults?: Opportunity;
  companies: CompanyOption[];
  contacts: ContactOption[];
};

export function OpportunityFormFields({ defaults, companies, contacts }: Props) {
  const editing = useFormEditing();
  const [companyId, setCompanyId] = useState(defaults?.company_id?.toString() ?? "");
  const [primaryContactId, setPrimaryContactId] = useState(defaults?.primary_contact_id?.toString() ?? "");
  const [salesRole, setSalesRole] = useState<OpportunitySalesRole>(defaults?.sales_role ?? "to_lease");

  const contactsForCompanyList = useMemo(
    () => contactsForCompany(contacts, companyId),
    [companyId, contacts],
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
    status: defaults?.status ?? "new",
    requirement_summary: defaults?.requirement_summary ?? null,
    remarks: defaults?.remarks ?? null,
    created_at: defaults?.created_at ?? "",
    updated_at: defaults?.updated_at ?? "",
  };

  function onCompanyChange(next: string) {
    setCompanyId(next);
    const cid = Number.parseInt(next, 10);
    const stillValid = contacts.some(
      (c) => c.id.toString() === primaryContactId && Number(c.company_id) === cid,
    );
    if (!stillValid) {
      setPrimaryContactId("");
    }
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-sm font-medium text-slate-800">Referrer & admin</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Referrer company
            <select
              name="referrer_company_id"
              defaultValue={defaults?.referrer_company_id?.toString() ?? ""}
              disabled={!editing}
              className={editing ? selectClass : selectReadOnlyClass}
            >
              <option value="">— None —</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </select>
          </label>
          <FormField
            label="Relationship owner (override)"
            name="relationship_owner"
            defaultValue={defaults?.relationship_owner ?? ""}
          />
          <FormField label="Lost reason" name="lost_reason" defaultValue={defaults?.lost_reason ?? ""} />
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
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
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
              {contactsForCompanyList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.contact_name}
                </option>
              ))}
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
              defaultValue={defaults?.status ?? "new"}
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
