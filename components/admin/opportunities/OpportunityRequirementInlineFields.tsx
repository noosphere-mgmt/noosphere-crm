"use client";

import {
  InlineDateField,
  InlineSelectField,
  InlineTextAreaField,
  InlineTextField,
} from "@/components/admin/inline/InlineFields";
import { opportunityPropertyType } from "@/lib/opportunityFormParsing";
import {
  OPPORTUNITY_FUNDING_STATUSES,
  OPPORTUNITY_FUNDING_STATUS_LABELS,
  type OpportunitySalesRole,
} from "@/lib/opportunityValues";
import { V1_PROPERTY_TYPES } from "@/lib/v1ListValues";
import type { Opportunity } from "@/lib/types/entities";

type SaveFn = (field: string) => (value: unknown) => Promise<{ ok: boolean; error?: string }>;

const propertyOptions = V1_PROPERTY_TYPES.map((t) => ({ value: t, label: t }));

function LeaseRequirementInline({
  opportunity,
  save,
}: {
  opportunity: Opportunity;
  save: SaveFn;
}) {
  return (
    <>
      <InlineSelectField
        label="Property type"
        value={opportunityPropertyType(opportunity)}
        options={propertyOptions}
        onSave={save("property_type")}
      />
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
        label="Est. start date"
        value={opportunity.expected_close_date}
        onSave={save("expected_close_date")}
      />
      <InlineTextField
        label="Lease term"
        value={opportunity.lease_term}
        onSave={save("lease_term")}
      />
      <div className="col-span-full">
        <InlineTextAreaField
          label="Requirement summary"
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
}: {
  opportunity: Opportunity;
  save: SaveFn;
}) {
  return (
    <>
      <InlineSelectField
        label="Property type"
        value={opportunityPropertyType(opportunity)}
        options={propertyOptions}
        onSave={save("property_type")}
      />
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
      <InlineTextField
        label="Target yield (%)"
        value={opportunity.target_yield}
        onSave={save("target_yield")}
      />
      <InlineTextField
        label="Target area (sq ft)"
        value={opportunity.required_area_sqft}
        onSave={save("required_area_sqft")}
        type="number"
      />
      <InlineSelectField
        label="Funding status"
        value={opportunity.funding_status}
        options={OPPORTUNITY_FUNDING_STATUSES.map((s) => ({
          value: s,
          label: OPPORTUNITY_FUNDING_STATUS_LABELS[s],
        }))}
        onSave={save("funding_status")}
      />
      <div className="col-span-full">
        <InlineTextAreaField
          label="Requirement summary"
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
  return salesRole === "to_buy" ? (
    <BuyRequirementInline opportunity={opportunity} save={save} />
  ) : (
    <LeaseRequirementInline opportunity={opportunity} save={save} />
  );
}
