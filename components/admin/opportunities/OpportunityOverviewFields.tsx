"use client";

import { useEffect, useState } from "react";
import { FormField, TextAreaField } from "@/components/admin/AdminFormFields";
import { OpportunityPartyContactSelect } from "@/components/admin/opportunities/OpportunityPartyContactSelect";
import { OpportunityRequirementSection } from "@/components/admin/opportunities/OpportunityRequirementSection";
import { OpportunityRequirementIntake } from "@/components/admin/opportunities/OpportunityRequirementIntake";
import { labelClass, selectClass } from "@/components/admin/opportunities/OpportunityRequirementFields";
import { useFormEditing } from "@/components/admin/ModuleActionBar";
import { defaultWaitingFor, formatOpportunityActionDate } from "@/lib/lookups";
import { OPPORTUNITY_SOURCES, OPPORTUNITY_SOURCE_LABELS } from "@/lib/opportunitySourceValues";
import { OPPORTUNITY_SALES_ROLE_LABELS, OPPORTUNITY_SALES_ROLES } from "@/lib/opportunityValues";
import {
  toLegacyCompanySelectOptions,
  toLegacyContactSelectOptions,
  resolveCompanySelectValue,
  resolveContactSelectValue,
} from "@/lib/crmSelectOptions";
import type { CompanyOption } from "@/lib/repos/companies";
import type { ContactOption } from "@/lib/repos/contacts";
import type { Opportunity } from "@/lib/types/entities";

const compactGrid = "grid grid-cols-2 gap-x-3 gap-y-2.5";

function ClientValue({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-slate-900">{value?.trim() || "—"}</dd>
    </div>
  );
}

function Section({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-3 ${className}`}>
      <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      <div className="pt-2.5">{children}</div>
    </section>
  );
}

export function OpportunityOverviewFields({
  opportunity,
  companies,
  contacts,
  sideContent,
}: {
  opportunity: Opportunity;
  companies: CompanyOption[];
  contacts: ContactOption[];
  sideContent: React.ReactNode;
}) {
  const editing = useFormEditing();
  const companyOptions = toLegacyCompanySelectOptions(companies);
  const contactOptions = toLegacyContactSelectOptions(contacts);
  const savedCompanyId = resolveCompanySelectValue(companies, opportunity.company_id);
  const [companyId, setCompanyId] = useState(savedCompanyId);
  const waitingDisplay =
    opportunity.waiting_for?.trim() || defaultWaitingFor(opportunity.status) || "—";

  useEffect(() => {
    setCompanyId(savedCompanyId);
  }, [savedCompanyId]);

  return (
    <div className="grid w-full min-w-0 items-start gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(240px,0.85fr)]">
      <input type="hidden" name="client_name" value={opportunity.client_name} />
      {opportunity.referrer_company_id ? (
        <input type="hidden" name="referrer_company_id" value={opportunity.referrer_company_id} />
      ) : null}
      {opportunity.referrer_contact_id ? (
        <input type="hidden" name="referrer_contact_id" value={opportunity.referrer_contact_id} />
      ) : null}

      <div className="flex min-w-0 flex-col gap-3">
        <Section title="Client">
          {editing ? (
            <div className={compactGrid}>
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
                <span className={labelClass}>Lead/Opp Source</span>
                <select name="lead_source" defaultValue={opportunity.lead_source ?? "direct"} className={selectClass}>
                  {OPPORTUNITY_SOURCES.map((source) => (
                    <option key={source} value={source}>
                      {OPPORTUNITY_SOURCE_LABELS[source]}
                    </option>
                  ))}
                </select>
                <input type="hidden" name="lead_type" value={opportunity.lead_type} />
              </label>
              <FormField
                label="Owner"
                name="relationship_owner"
                defaultValue={opportunity.relationship_owner ?? ""}
              />
              <label className="block min-w-0 text-sm col-span-2 sm:col-span-1">
                <span className={labelClass}>Transaction</span>
                <select name="sales_role" defaultValue={opportunity.sales_role ?? "to_lease"} className={selectClass}>
                  {OPPORTUNITY_SALES_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {OPPORTUNITY_SALES_ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <dl className={compactGrid}>
              <ClientValue label="Company" value={opportunity.linked_company_name} />
              <ClientValue label="Contact" value={opportunity.primary_contact_name} />
              <ClientValue label="Lead/Opp Source" value={OPPORTUNITY_SOURCE_LABELS[opportunity.lead_source ?? "direct"]} />
              <ClientValue label="Owner" value={opportunity.relationship_owner} />
              <ClientValue label="Transaction" value={OPPORTUNITY_SALES_ROLE_LABELS[opportunity.sales_role ?? "to_lease"]} />
            </dl>
          )}
        </Section>

        <Section title="Situation">
          {editing ? (
            <div className={compactGrid}>
              <FormField
                label="Waiting for"
                name="waiting_for"
                defaultValue={opportunity.waiting_for ?? ""}
              />
              <FormField
                label="Next action date"
                name="next_action_date"
                type="date"
                defaultValue={opportunity.next_action_date?.slice(0, 10) ?? ""}
              />
              <div className="col-span-2">
                <FormField
                  label="Next action"
                  name="next_action"
                  defaultValue={opportunity.next_action ?? ""}
                />
              </div>
            </div>
          ) : (
            <dl className={compactGrid}>
              <ClientValue label="Waiting for" value={waitingDisplay} />
              <ClientValue
                label="Next action date"
                value={formatOpportunityActionDate(opportunity.next_action_date)}
              />
              <div className="col-span-2">
                <ClientValue label="Next action" value={opportunity.next_action} />
              </div>
            </dl>
          )}
        </Section>

        {editing || opportunity.remarks?.trim() ? (
          <Section title="Notes">
            {editing ? (
              <TextAreaField label="Remarks" name="remarks" defaultValue={opportunity.remarks ?? ""} />
            ) : (
              <p className="line-clamp-4 text-sm leading-relaxed whitespace-pre-wrap text-slate-800">
                {opportunity.remarks?.trim() || "—"}
              </p>
            )}
          </Section>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <Section title="Requirement">
          <OpportunityRequirementSection opportunity={opportunity} editing={editing} />
        </Section>
        {!editing ? <OpportunityRequirementIntake opportunity={opportunity} /> : null}
      </div>

      <aside className="min-w-0 lg:sticky lg:top-20">{sideContent}</aside>
    </div>
  );
}
