"use client";

import { FormField, TextAreaField } from "@/components/admin/AdminFormFields";
import {
  formatOpportunityBudget,
  opportunityBudgetValue,
  opportunityPropertyType,
} from "@/lib/opportunityFormParsing";
import {
  OPPORTUNITY_FUNDING_STATUSES,
  OPPORTUNITY_FUNDING_STATUS_LABELS,
  OPPORTUNITY_SALES_ROLES,
  OPPORTUNITY_SALES_ROLE_LABELS,
  type OpportunitySalesRole,
} from "@/lib/opportunityValues";
import { V1_PROPERTY_TYPES } from "@/lib/v1ListValues";
import type { Opportunity } from "@/lib/types/entities";

const labelClass = "text-xs font-medium text-slate-500";
const selectClass = "mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm";
const readOnlyValue = "mt-1 text-sm font-normal leading-relaxed text-slate-900";
const fieldGrid = "grid w-full grid-cols-2 gap-x-5 gap-y-4 md:grid-cols-3";

function CompactField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 py-1">
      <dt className={labelClass}>{label}</dt>
      <dd className={readOnlyValue}>{value || "—"}</dd>
    </div>
  );
}

function SummaryBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="pt-1">
      <dt className={labelClass}>{label}</dt>
      <dd className="mt-1 text-sm font-normal leading-relaxed text-slate-900 line-clamp-4">{value || "—"}</dd>
    </div>
  );
}

function PropertyTypeSelect({
  defaultValue,
  name = "property_type",
}: {
  defaultValue?: string | null;
  name?: string;
}) {
  return (
    <label className="block min-w-0 text-sm">
      <span className={labelClass}>Property type</span>
      <select name={name} defaultValue={defaultValue ?? ""} className={selectClass}>
        <option value="">—</option>
        {V1_PROPERTY_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </label>
  );
}

function BudgetFields({ opportunity }: { opportunity: Opportunity }) {
  return (
    <FormField
      label="Budget (HKD)"
      name="budget_max"
      type="number"
      defaultValue={opportunityBudgetValue(opportunity) ?? ""}
    />
  );
}

function LeaseRequirementEdit({
  opportunity,
}: {
  opportunity: Opportunity;
}) {
  return (
    <>
      <dl className={fieldGrid}>
        <PropertyTypeSelect defaultValue={opportunityPropertyType(opportunity)} />
        <FormField label="District" name="district_preference" defaultValue={opportunity.district_preference ?? ""} />
        <FormField
          label="Area (sq ft)"
          name="required_area_sqft"
          type="number"
          defaultValue={opportunity.required_area_sqft ?? ""}
        />
        <FormField
          label="Desks"
          name="required_capacity_pax"
          type="number"
          defaultValue={opportunity.required_capacity_pax?.toString() ?? ""}
        />
        <BudgetFields opportunity={opportunity} />
        <FormField
          label="Est. start date"
          name="expected_close_date"
          type="date"
          defaultValue={opportunity.expected_close_date?.slice(0, 10) ?? ""}
        />
        <FormField label="Lease term" name="lease_term" defaultValue={opportunity.lease_term ?? ""} />
      </dl>
      <TextAreaField
        label="Requirement summary"
        name="requirement_summary"
        defaultValue={opportunity.requirement_summary ?? ""}
      />
    </>
  );
}

function BuyRequirementEdit({
  opportunity,
}: {
  opportunity: Opportunity;
}) {
  return (
    <>
      <dl className={fieldGrid}>
        <PropertyTypeSelect defaultValue={opportunityPropertyType(opportunity)} />
        <FormField label="District" name="district_preference" defaultValue={opportunity.district_preference ?? ""} />
        <BudgetFields opportunity={opportunity} />
        <FormField label="Target yield (%)" name="target_yield" defaultValue={opportunity.target_yield ?? ""} />
        <FormField
          label="Target area (sq ft)"
          name="required_area_sqft"
          type="number"
          defaultValue={opportunity.required_area_sqft ?? ""}
        />
        <label className="block min-w-0 text-sm">
          <span className={labelClass}>Funding status</span>
          <select name="funding_status" defaultValue={opportunity.funding_status ?? ""} className={selectClass}>
            <option value="">—</option>
            {OPPORTUNITY_FUNDING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {OPPORTUNITY_FUNDING_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      </dl>
      <TextAreaField
        label="Requirement summary"
        name="requirement_summary"
        defaultValue={opportunity.requirement_summary ?? ""}
      />
    </>
  );
}

function LeaseRequirementView({ opportunity }: { opportunity: Opportunity }) {
  return (
    <>
      <dl className={fieldGrid}>
        <CompactField label="Property type" value={opportunityPropertyType(opportunity) ?? ""} />
        <CompactField label="District" value={opportunity.district_preference ?? ""} />
        <CompactField
          label="Area"
          value={opportunity.required_area_sqft ? `${opportunity.required_area_sqft} sq ft` : ""}
        />
        <CompactField label="Desks" value={opportunity.required_capacity_pax?.toString() ?? ""} />
        <CompactField label="Budget" value={formatOpportunityBudget(opportunity.budget_max, opportunity.budget_min)} />
        <CompactField label="Est. start date" value={opportunity.expected_close_date?.slice(0, 10) ?? ""} />
        <CompactField label="Lease term" value={opportunity.lease_term ?? ""} />
      </dl>
      <SummaryBlock label="Requirement summary" value={opportunity.requirement_summary ?? ""} />
    </>
  );
}

function BuyRequirementView({ opportunity }: { opportunity: Opportunity }) {
  const fundingLabel =
    opportunity.funding_status &&
    OPPORTUNITY_FUNDING_STATUS_LABELS[
      opportunity.funding_status as keyof typeof OPPORTUNITY_FUNDING_STATUS_LABELS
    ]
      ? OPPORTUNITY_FUNDING_STATUS_LABELS[
          opportunity.funding_status as keyof typeof OPPORTUNITY_FUNDING_STATUS_LABELS
        ]
      : (opportunity.funding_status ?? "");

  return (
    <>
      <dl className={fieldGrid}>
        <CompactField label="Property type" value={opportunityPropertyType(opportunity) ?? ""} />
        <CompactField label="District" value={opportunity.district_preference ?? ""} />
        <CompactField label="Budget" value={formatOpportunityBudget(opportunity.budget_max, opportunity.budget_min)} />
        <CompactField label="Target yield" value={opportunity.target_yield ? `${opportunity.target_yield}%` : ""} />
        <CompactField
          label="Target area"
          value={opportunity.required_area_sqft ? `${opportunity.required_area_sqft} sq ft` : ""}
        />
        <CompactField label="Funding status" value={fundingLabel} />
      </dl>
      <SummaryBlock label="Requirement summary" value={opportunity.requirement_summary ?? ""} />
    </>
  );
}

export function OpportunitySalesRoleSelect({
  value,
  onChange,
  name = "sales_role",
  readOnlyLabel,
}: {
  value: OpportunitySalesRole;
  onChange?: (role: OpportunitySalesRole) => void;
  name?: string;
  readOnlyLabel?: string;
}) {
  if (readOnlyLabel != null) {
    return (
      <div className="min-w-0 py-1">
        <dt className={labelClass}>Sales role</dt>
        <dd className={readOnlyValue}>{readOnlyLabel}</dd>
      </div>
    );
  }

  return (
    <label className="block min-w-0 text-sm">
      <span className={labelClass}>Sales role</span>
      <select
        name={name}
        value={value}
        onChange={(e) => onChange?.(e.target.value as OpportunitySalesRole)}
        className={selectClass}
      >
        {OPPORTUNITY_SALES_ROLES.map((role) => (
          <option key={role} value={role}>
            {OPPORTUNITY_SALES_ROLE_LABELS[role]}
          </option>
        ))}
      </select>
    </label>
  );
}

export function OpportunityRequirementFields({
  opportunity,
  salesRole,
  editing,
}: {
  opportunity: Opportunity;
  salesRole: OpportunitySalesRole;
  editing: boolean;
}) {
  if (editing) {
    return salesRole === "to_buy" ? (
      <BuyRequirementEdit opportunity={opportunity} />
    ) : (
      <LeaseRequirementEdit opportunity={opportunity} />
    );
  }

  return salesRole === "to_buy" ? (
    <BuyRequirementView opportunity={opportunity} />
  ) : (
    <LeaseRequirementView opportunity={opportunity} />
  );
}

export { CompactField, SummaryBlock, fieldGrid, labelClass, selectClass };
