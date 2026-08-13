"use client";

import { useMemo, useState } from "react";
import { FormField, TextAreaField } from "@/components/admin/AdminFormFields";
import {
  formatOpportunityBudget,
  opportunityBudgetValue,
} from "@/lib/opportunityFormParsing";
import {
  OPPORTUNITY_FUNDING_STATUSES,
  OPPORTUNITY_FUNDING_STATUS_LABELS,
  OPPORTUNITY_SALES_ROLES,
  OPPORTUNITY_SALES_ROLE_LABELS,
  isOtherSalesRole,
  isSaleCaseSalesRole,
  type OpportunitySalesRole,
} from "@/lib/opportunityValues";
import {
  OPPORTUNITY_CATEGORY_OPTIONS,
  primaryCategoryPreference,
  primarySpaceFormPreference,
} from "@/lib/opportunityPreferences";
import {
  formatRequirementPrimaryTypes,
  formatRequirementSubtypes,
  REQUIREMENT_SUBTYPE_OPTIONS,
  type RequirementPrimaryType,
} from "@/lib/opportunityRequirementTypes";
import type { Opportunity } from "@/lib/types/entities";

const labelClass = "text-xs font-medium uppercase tracking-wide text-slate-500";
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

function RequiredTypeSubtypeSelects({
  categoryDefault,
  subtypeDefault,
}: {
  categoryDefault?: string | null;
  subtypeDefault?: string | null;
}) {
  const initialType = (primaryCategoryPreference(categoryDefault) ?? "commercial") as RequirementPrimaryType;
  const initialSubtype = primarySpaceFormPreference(subtypeDefault) ?? "";
  const [requiredType, setRequiredType] = useState<RequirementPrimaryType | "">(initialType);
  const [requiredSubtype, setRequiredSubtype] = useState(initialSubtype);

  const subtypeOptions = useMemo(() => {
    if (!requiredType) return [];
    return REQUIREMENT_SUBTYPE_OPTIONS[requiredType] ?? [];
  }, [requiredType]);

  function onRequiredTypeChange(next: string) {
    const typed = next as RequirementPrimaryType | "";
    setRequiredType(typed);
    const options = typed ? REQUIREMENT_SUBTYPE_OPTIONS[typed] ?? [] : [];
    setRequiredSubtype((current) =>
      options.some((opt) => opt.value === current) ? current : "",
    );
  }

  return (
    <>
      <label className="block min-w-0 text-sm">
        <span className={labelClass}>Required Type</span>
        <select
          name="property_category_preference"
          value={requiredType}
          onChange={(e) => onRequiredTypeChange(e.target.value)}
          className={selectClass}
        >
          <option value="">—</option>
          {OPPORTUNITY_CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block min-w-0 text-sm">
        <span className={labelClass}>Required Subtype</span>
        <select
          name="property_type_preference"
          value={requiredSubtype}
          onChange={(e) => setRequiredSubtype(e.target.value)}
          className={selectClass}
          disabled={!requiredType}
        >
          <option value="">—</option>
          {subtypeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </>
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
        <RequiredTypeSubtypeSelects
          categoryDefault={opportunity.property_category_preference}
          subtypeDefault={opportunity.property_type_preference}
        />
        <FormField label="District" name="district_preference" defaultValue={opportunity.district_preference ?? ""} />
        <FormField
          label="Area (Sq Ft)"
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
          label="Est. Start Date"
          name="expected_close_date"
          type="date"
          defaultValue={opportunity.expected_close_date?.slice(0, 10) ?? ""}
        />
        <FormField label="Lease Term" name="lease_term" defaultValue={opportunity.lease_term ?? ""} />
      </dl>
      <TextAreaField
        label="Requirement Summary"
        name="requirement_summary"
        defaultValue={opportunity.requirement_summary ?? ""}
      />
    </>
  );
}

function BuyRequirementEdit({
  opportunity,
  salesRole,
}: {
  opportunity: Opportunity;
  salesRole: OpportunitySalesRole;
}) {
  const isBuy = salesRole === "to_buy";
  const isSaleCase = isSaleCaseSalesRole(salesRole);

  return (
    <>
      <dl className={fieldGrid}>
        <RequiredTypeSubtypeSelects
          categoryDefault={opportunity.property_category_preference}
          subtypeDefault={opportunity.property_type_preference}
        />
        <FormField label="District" name="district_preference" defaultValue={opportunity.district_preference ?? ""} />
        <BudgetFields opportunity={opportunity} />
        {isSaleCase ? (
          <FormField label="Target Yield (%)" name="target_yield" defaultValue={opportunity.target_yield ?? ""} />
        ) : null}
        <FormField
          label="Target Area (Sq Ft)"
          name="required_area_sqft"
          type="number"
          defaultValue={opportunity.required_area_sqft ?? ""}
        />
        {isBuy ? (
          <label className="block min-w-0 text-sm">
            <span className={labelClass}>Funding Status</span>
            <select name="funding_status" defaultValue={opportunity.funding_status ?? ""} className={selectClass}>
              <option value="">—</option>
              {OPPORTUNITY_FUNDING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {OPPORTUNITY_FUNDING_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </dl>
      <TextAreaField
        label="Requirement Summary"
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
        <CompactField
          label="Required Type"
          value={formatRequirementPrimaryTypes(opportunity.property_category_preference)}
        />
        <CompactField
          label="Required Subtype"
          value={formatRequirementSubtypes(
            opportunity.property_category_preference,
            opportunity.property_type_preference,
          )}
        />
        <CompactField label="District" value={opportunity.district_preference ?? ""} />
        <CompactField
          label="Area"
          value={opportunity.required_area_sqft ? `${opportunity.required_area_sqft} sq ft` : ""}
        />
        <CompactField label="Desks" value={opportunity.required_capacity_pax?.toString() ?? ""} />
        <CompactField label="Budget" value={formatOpportunityBudget(opportunity.budget_max, opportunity.budget_min)} />
        <CompactField label="Est. Start Date" value={opportunity.expected_close_date?.slice(0, 10) ?? ""} />
        <CompactField label="Lease Term" value={opportunity.lease_term ?? ""} />
      </dl>
      <SummaryBlock label="Requirement Summary" value={opportunity.requirement_summary ?? ""} />
    </>
  );
}

function BuyRequirementView({
  opportunity,
  salesRole,
}: {
  opportunity: Opportunity;
  salesRole: OpportunitySalesRole;
}) {
  const isBuy = salesRole === "to_buy";
  const isSaleCase = isSaleCaseSalesRole(salesRole);
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
        <CompactField
          label="Required Type"
          value={formatRequirementPrimaryTypes(opportunity.property_category_preference)}
        />
        <CompactField
          label="Required Subtype"
          value={formatRequirementSubtypes(
            opportunity.property_category_preference,
            opportunity.property_type_preference,
          )}
        />
        <CompactField label="District" value={opportunity.district_preference ?? ""} />
        <CompactField label="Budget" value={formatOpportunityBudget(opportunity.budget_max, opportunity.budget_min)} />
        {isSaleCase ? (
          <CompactField
            label="Target Yield (%)"
            value={opportunity.target_yield ? `${opportunity.target_yield}%` : ""}
          />
        ) : null}
        <CompactField
          label="Target Area"
          value={opportunity.required_area_sqft ? `${opportunity.required_area_sqft} sq ft` : ""}
        />
        {isBuy ? <CompactField label="Funding Status" value={fundingLabel} /> : null}
      </dl>
      <SummaryBlock label="Requirement Summary" value={opportunity.requirement_summary ?? ""} />
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
        <dt className={labelClass}>Sales Role</dt>
        <dd className={readOnlyValue}>{readOnlyLabel}</dd>
      </div>
    );
  }

  return (
    <label className="block min-w-0 text-sm">
      <span className={labelClass}>Sales Role</span>
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
  if (isOtherSalesRole(salesRole)) {
    if (editing) {
      return (
        <TextAreaField
          label="Requirement Summary"
          name="requirement_summary"
          defaultValue={opportunity.requirement_summary ?? ""}
        />
      );
    }
    return <SummaryBlock label="Requirement Summary" value={opportunity.requirement_summary ?? ""} />;
  }

  if (editing) {
    return isSaleCaseSalesRole(salesRole) ? (
      <BuyRequirementEdit opportunity={opportunity} salesRole={salesRole} />
    ) : (
      <LeaseRequirementEdit opportunity={opportunity} />
    );
  }

  return isSaleCaseSalesRole(salesRole) ? (
    <BuyRequirementView opportunity={opportunity} salesRole={salesRole} />
  ) : (
    <LeaseRequirementView opportunity={opportunity} />
  );
}

export { CompactField, SummaryBlock, fieldGrid, labelClass, selectClass };
