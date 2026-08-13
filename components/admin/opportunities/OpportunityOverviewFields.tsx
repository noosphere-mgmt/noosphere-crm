"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { patchOpportunityFieldAction } from "@/app/admin/opportunities/actions";
import { FormField, TextAreaField } from "@/components/admin/AdminFormFields";
import { AdminEntityLink } from "@/components/admin/AdminEntityLink";
import { OpportunityPartyContactSelect } from "@/components/admin/opportunities/OpportunityPartyContactSelect";
import { OpportunityRequirementSection } from "@/components/admin/opportunities/OpportunityRequirementSection";
import { OpportunityRequirementIntake } from "@/components/admin/opportunities/OpportunityRequirementIntake";
import { labelClass, selectClass } from "@/components/admin/opportunities/OpportunityRequirementFields";
import { useFormEditing } from "@/components/admin/ModuleActionBar";
import { companyFullPageHref, contactFullPageHref } from "@/lib/crmDetailNav";
import {
  defaultWaitingFor,
  formatOpportunityActionDate,
} from "@/lib/lookups";
import {
  closedOutcomeReasonLabel,
  isClosedOpportunityStatus,
} from "@/lib/openOpportunityStatus";
import { OPPORTUNITY_SOURCES, OPPORTUNITY_SOURCE_LABELS } from "@/lib/opportunitySourceValues";
import {
  OPPORTUNITY_SALES_ROLES,
  normalizeOpportunitySalesRole,
  opportunitySalesRoleLabel,
  type OpportunitySalesRole,
} from "@/lib/opportunityValues";
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

function ClientValue({
  label,
  value,
  labelClassName = "text-slate-500",
}: {
  label: string;
  value?: ReactNode;
  labelClassName?: string;
}) {
  const empty =
    value == null ||
    value === "" ||
    (typeof value === "string" && !value.trim());
  return (
    <div className="min-w-0">
      <dt className={`text-[11px] font-medium uppercase tracking-wide ${labelClassName}`}>{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium text-slate-900">
        {empty ? "—" : value}
      </dd>
    </div>
  );
}

function OutcomeReasonField({
  label,
  value,
  onSave,
  editing,
  labelClassName,
}: {
  label: string;
  value: string | null;
  onSave: (value: unknown) => Promise<{ ok: boolean; error?: string }>;
  editing: boolean;
  labelClassName: string;
}) {
  const [draft, setDraft] = useState(value ?? "");
  const [inlineEditing, setInlineEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  useEffect(() => {
    if (inlineEditing) inputRef.current?.focus();
  }, [inlineEditing]);

  async function commit() {
    const next = draft.trim() || null;
    if ((next ?? "") === (value ?? "").trim()) {
      setInlineEditing(false);
      return;
    }
    const result = await onSave(next);
    if (result.ok) setInlineEditing(false);
  }

  if (editing) {
    return (
      <label className="col-span-2 block min-w-0 text-sm">
        <span className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${labelClassName}`}>
          {label}
        </span>
        <input
          name="lost_reason"
          defaultValue={value ?? ""}
          className={selectClass}
          placeholder={label.includes("Won") ? "Why was this won?" : "Why was this lost?"}
        />
      </label>
    );
  }

  return (
    <div className="col-span-2 min-w-0">
      <dt className={`text-[11px] font-medium uppercase tracking-wide ${labelClassName}`}>{label}</dt>
      <dd className="mt-0.5">
        {inlineEditing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => void commit()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void commit();
              }
              if (e.key === "Escape") {
                setDraft(value ?? "");
                setInlineEditing(false);
              }
            }}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            placeholder={label.includes("Won") ? "Why was this won?" : "Why was this lost?"}
          />
        ) : (
          <button
            type="button"
            onClick={() => setInlineEditing(true)}
            className="w-full truncate text-left text-sm font-medium text-slate-900 hover:text-slate-700"
            title="Click to edit"
          >
            {value?.trim() || <span className="text-slate-400">—</span>}
          </button>
        )}
      </dd>
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
  const [salesRole, setSalesRole] = useState<OpportunitySalesRole>(
    normalizeOpportunitySalesRole(opportunity.sales_role),
  );
  const waitingDisplay =
    opportunity.waiting_for?.trim() || defaultWaitingFor(opportunity.status) || "—";
  const closed = isClosedOpportunityStatus(opportunity.status);
  const outcomeReasonLabel = closedOutcomeReasonLabel(opportunity.status);
  const outcomeReasonLabelClass =
    opportunity.status === "closed_won"
      ? "text-emerald-700"
      : opportunity.status === "closed_lost"
        ? "text-rose-700"
        : "text-amber-700";

  const saveLostReason = useCallback(
    async (value: unknown) => {
      const result = await patchOpportunityFieldAction(
        opportunity.id,
        "lost_reason",
        JSON.stringify(value),
      );
      return { ok: result.ok, error: result.ok ? undefined : result.error };
    },
    [opportunity.id],
  );

  useEffect(() => {
    setCompanyId(savedCompanyId);
  }, [savedCompanyId]);

  useEffect(() => {
    setSalesRole(normalizeOpportunitySalesRole(opportunity.sales_role));
  }, [opportunity.sales_role, opportunity.id]);

  return (
    <div className="grid w-full min-w-0 items-start gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(240px,0.85fr)]">
      {!editing ? <input type="hidden" name="client_name" value={opportunity.client_name} /> : null}
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
              <div className="col-span-2">
                <FormField
                  label="Opportunity Name"
                  name="client_name"
                  defaultValue={opportunity.client_name}
                  required
                />
              </div>
              <label className="block min-w-0 text-sm">
                <span className={labelClass}>Company</span>
                <select
                  name="company_id"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className={selectClass}
                >
                  <option value="">No Company</option>
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
              <input type="hidden" name="lead_type" value={opportunity.lead_type ?? "direct_client"} />
              <label className="block min-w-0 text-sm">
                <span className={labelClass}>Lead/Opp Source</span>
                <select name="lead_source" defaultValue={opportunity.lead_source ?? "direct"} className={selectClass}>
                  {OPPORTUNITY_SOURCES.map((source) => (
                    <option key={source} value={source}>
                      {OPPORTUNITY_SOURCE_LABELS[source]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block min-w-0 text-sm col-span-2 sm:col-span-1">
                <span className={labelClass}>Sales Role</span>
                <select
                  name="sales_role"
                  value={salesRole}
                  onChange={(e) => setSalesRole(e.target.value as OpportunitySalesRole)}
                  className={selectClass}
                >
                  {OPPORTUNITY_SALES_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {opportunitySalesRoleLabel(role)}
                    </option>
                  ))}
                </select>
              </label>
              <FormField
                label="Owner"
                name="relationship_owner"
                defaultValue={opportunity.relationship_owner ?? ""}
              />
              {closed ? (
                <OutcomeReasonField
                  label={outcomeReasonLabel}
                  value={opportunity.lost_reason}
                  onSave={saveLostReason}
                  editing
                  labelClassName={outcomeReasonLabelClass}
                />
              ) : null}
            </div>
          ) : (
            <dl className={compactGrid}>
              <ClientValue
                label="Company"
                value={
                  opportunity.linked_company_name ? (
                    <AdminEntityLink
                      href={companyFullPageHref(
                        opportunity.linked_company_business_id ?? opportunity.company_id,
                      )}
                      className="underline-offset-2 hover:underline"
                    >
                      {opportunity.linked_company_name}
                    </AdminEntityLink>
                  ) : (
                    "No Company"
                  )
                }
              />
              <ClientValue
                label="Contact"
                value={
                  opportunity.primary_contact_name ? (
                    <AdminEntityLink
                      href={contactFullPageHref(
                        opportunity.primary_contact_business_id ?? opportunity.primary_contact_id,
                      )}
                      className="underline-offset-2 hover:underline"
                    >
                      {opportunity.primary_contact_name}
                    </AdminEntityLink>
                  ) : null
                }
              />
              <ClientValue label="Lead/Opp Source" value={OPPORTUNITY_SOURCE_LABELS[opportunity.lead_source ?? "direct"]} />
              <ClientValue label="Sales Role" value={opportunitySalesRoleLabel(opportunity.sales_role)} />
              <ClientValue label="Owner" value={opportunity.relationship_owner} />
              {closed ? (
                <OutcomeReasonField
                  label={outcomeReasonLabel}
                  value={opportunity.lost_reason}
                  onSave={saveLostReason}
                  editing={false}
                  labelClassName={outcomeReasonLabelClass}
                />
              ) : null}
            </dl>
          )}
        </Section>

        <Section title="Situation">
          {editing ? (
            <div className={compactGrid}>
              <FormField
                label="Waiting For"
                name="waiting_for"
                defaultValue={opportunity.waiting_for ?? ""}
              />
              <FormField
                label="Next Action Date"
                name="next_action_date"
                type="date"
                defaultValue={opportunity.next_action_date?.slice(0, 10) ?? ""}
              />
              <div className="col-span-2">
                <FormField
                  label="Next Action"
                  name="next_action"
                  defaultValue={opportunity.next_action ?? ""}
                />
              </div>
            </div>
          ) : (
            <dl className={compactGrid}>
              <ClientValue label="Waiting For" value={waitingDisplay} />
              <ClientValue
                label="Next Action Date"
                value={formatOpportunityActionDate(opportunity.next_action_date)}
              />
              <div className="col-span-2">
                <ClientValue label="Next Action" value={opportunity.next_action} />
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
          <OpportunityRequirementSection
            opportunity={opportunity}
            editing={editing}
            salesRole={editing ? salesRole : normalizeOpportunitySalesRole(opportunity.sales_role)}
          />
        </Section>
        {!editing ? <OpportunityRequirementIntake opportunity={opportunity} /> : null}
      </div>

      <aside className="min-w-0 lg:sticky lg:top-20">{sideContent}</aside>
    </div>
  );
}
