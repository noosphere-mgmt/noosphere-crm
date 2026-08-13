"use client";

import {
  InlineDateField,
  InlineSelectField,
  InlineTextAreaField,
  InlineTextField,
} from "@/components/admin/inline/InlineFields";
import {
  OPPORTUNITY_FUNDING_STATUSES,
  OPPORTUNITY_FUNDING_STATUS_LABELS,
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
  REQUIREMENT_SUBTYPE_OPTIONS,
  type RequirementPrimaryType,
} from "@/lib/opportunityRequirementTypes";
import type { Opportunity } from "@/lib/types/entities";

type SaveFn = (field: string) => (value: unknown) => Promise<{ ok: boolean; error?: string }>;

function RequiredTypeSubtypeInline({
  opportunity,
  save,
}: {
  opportunity: Opportunity;
  save: SaveFn;
}) {
  const requiredType = (primaryCategoryPreference(opportunity.property_category_preference) ??
    "") as RequirementPrimaryType | "";
  const subtypeOptions = requiredType ? (REQUIREMENT_SUBTYPE_OPTIONS[requiredType] ?? []) : [];

  return (
    <>
      <InlineSelectField
        label="Required Type"
        value={requiredType}
        options={[{ value: "", label: "—" }, ...OPPORTUNITY_CATEGORY_OPTIONS]}
        onSave={async (value) => {
          const result = await save("property_category_preference")(value);
          if (!result.ok) return result;
          const next = String(value ?? "") as RequirementPrimaryType | "";
          const options = next ? (REQUIREMENT_SUBTYPE_OPTIONS[next] ?? []) : [];
          const current = primarySpaceFormPreference(opportunity.property_type_preference);
          if (current && !options.some((opt) => opt.value === current)) {
            return save("property_type_preference")("");
          }
          return result;
        }}
      />
      <InlineSelectField
        label="Required Subtype"
        value={primarySpaceFormPreference(opportunity.property_type_preference)}
        options={[{ value: "", label: "—" }, ...subtypeOptions]}
        onSave={save("property_type_preference")}
      />
    </>
  );
}

function LeaseRequirementInline({
  opportunity,
  save,
}: {
  opportunity: Opportunity;
  save: SaveFn;
}) {
  return (
    <>
      <RequiredTypeSubtypeInline opportunity={opportunity} save={save} />
      <InlineTextField
        label="District"
        value={opportunity.district_preference}
        onSave={save("district_preference")}
      />
      <InlineTextField
        label="Area"
        value={opportunity.required_area_sqft}
        onSave={save("required_area_sqft")}
        type="number"
      />
      <InlineTextField
        label="Desks"
        value={opportunity.required_capacity_pax?.toString() ?? null}
        onSave={save("required_capacity_pax")}
        type="number"
      />
      <InlineTextField
        label="Budget"
        value={opportunity.budget_max}
        onSave={save("budget_max")}
        type="number"
      />
      <InlineDateField
        label="Est. Start Date"
        value={opportunity.expected_close_date}
        onSave={save("expected_close_date")}
      />
      <InlineTextField
        label="Lease Term"
        value={opportunity.lease_term}
        onSave={save("lease_term")}
      />
      <div className="col-span-full">
        <InlineTextAreaField
          label="Requirement Summary"
          value={opportunity.requirement_summary}
          onSave={save("requirement_summary")}
          compact
          fullWidth
        />
      </div>
    </>
  );
}

function BuyRequirementInline({
  opportunity,
  save,
  salesRole,
}: {
  opportunity: Opportunity;
  save: SaveFn;
  salesRole: OpportunitySalesRole;
}) {
  const isBuy = salesRole === "to_buy";
  const isSaleCase = isSaleCaseSalesRole(salesRole);

  return (
    <>
      <RequiredTypeSubtypeInline opportunity={opportunity} save={save} />
      <InlineTextField
        label="District"
        value={opportunity.district_preference}
        onSave={save("district_preference")}
      />
      <InlineTextField
        label="Budget (HKD)"
        value={opportunity.budget_max}
        onSave={save("budget_max")}
        type="number"
      />
      {isSaleCase ? (
        <InlineTextField
          label="Target Yield (%)"
          value={opportunity.target_yield}
          onSave={save("target_yield")}
        />
      ) : null}
      <InlineTextField
        label="Target Area (Sq Ft)"
        value={opportunity.required_area_sqft}
        onSave={save("required_area_sqft")}
        type="number"
      />
      {isBuy ? (
        <InlineSelectField
          label="Funding Status"
          value={opportunity.funding_status}
          options={OPPORTUNITY_FUNDING_STATUSES.map((s) => ({
            value: s,
            label: OPPORTUNITY_FUNDING_STATUS_LABELS[s],
          }))}
          onSave={save("funding_status")}
        />
      ) : null}
      <div className="col-span-full">
        <InlineTextAreaField
          label="Requirement Summary"
          value={opportunity.requirement_summary}
          onSave={save("requirement_summary")}
          compact
          fullWidth
        />
      </div>
    </>
  );
}

export function OpportunityRequirementInlineFields({
  opportunity,
  save,
  salesRole = opportunity.sales_role ?? "to_lease",
}: {
  opportunity: Opportunity;
  save: SaveFn;
  salesRole?: OpportunitySalesRole;
}) {
  if (isOtherSalesRole(salesRole)) {
    return (
      <div className="col-span-full">
        <InlineTextAreaField
          label="Requirement Summary"
          value={opportunity.requirement_summary}
          onSave={save("requirement_summary")}
          compact
          fullWidth
        />
      </div>
    );
  }

  return isSaleCaseSalesRole(salesRole) ? (
    <BuyRequirementInline opportunity={opportunity} save={save} salesRole={salesRole} />
  ) : (
    <LeaseRequirementInline opportunity={opportunity} save={save} />
  );
}
