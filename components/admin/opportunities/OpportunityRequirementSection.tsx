"use client";

import { useMemo, useState } from "react";
import { FormField, TextAreaField } from "@/components/admin/AdminFormFields";
import { labelClass, selectClass } from "@/components/admin/opportunities/OpportunityRequirementFields";
import {
  formatOpportunityBudget,
  opportunityBudgetValue,
} from "@/lib/opportunityFormParsing";
import {
  REQUIREMENT_PRIMARY_LABELS,
  REQUIREMENT_PRIMARY_TYPES,
  REQUIREMENT_SUBTYPE_OPTIONS,
  formatRequirementPrimaryTypes,
  formatRequirementSubtypes,
  parseRequirementPrimaryTypes,
  parseRequirementSubtypes,
  requirementIncludesCommercial,
  requirementIncludesResidential,
  serializeRequirementPrimaryTypes,
  serializeRequirementSubtypes,
  type RequirementPrimaryType,
} from "@/lib/opportunityRequirementTypes";
import {
  OPPORTUNITY_FUNDING_STATUSES,
  OPPORTUNITY_FUNDING_STATUS_LABELS,
  isLeaseLikeSalesRole,
  isOtherSalesRole,
  isSaleCaseSalesRole,
  normalizeOpportunitySalesRole,
  type OpportunitySalesRole,
} from "@/lib/opportunityValues";
import type { Opportunity } from "@/lib/types/entities";

const fieldGrid = "grid grid-cols-2 gap-x-3 gap-y-2.5";

function ViewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value?.trim() || "—"}</dd>
    </div>
  );
}

function PrimaryTypeCheckboxes({
  selected,
  onChange,
}: {
  selected: RequirementPrimaryType[];
  onChange: (next: RequirementPrimaryType[]) => void;
}) {
  function toggle(type: RequirementPrimaryType) {
    onChange(selected.includes(type) ? selected.filter((t) => t !== type) : [...selected, type]);
  }
  return (
    <div className="flex flex-wrap gap-2">
      {REQUIREMENT_PRIMARY_TYPES.map((type) => {
        const active = selected.includes(type);
        return (
          <label
            key={type}
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={active}
              onChange={() => toggle(type)}
            />
            {REQUIREMENT_PRIMARY_LABELS[type]}
          </label>
        );
      })}
    </div>
  );
}

function SubtypeCheckboxes({
  primaryTypes,
  selected,
  onChange,
}: {
  primaryTypes: RequirementPrimaryType[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const options = useMemo(() => {
    const seen = new Set<string>();
    const out: { value: string; label: string }[] = [];
    for (const primary of primaryTypes) {
      for (const opt of REQUIREMENT_SUBTYPE_OPTIONS[primary]) {
        if (!seen.has(opt.value)) {
          seen.add(opt.value);
          out.push(opt);
        }
      }
    }
    return out;
  }, [primaryTypes]);

  if (options.length === 0) {
    return (
      <div className="space-y-2">
        <p className={labelClass}>Required Subtype</p>
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
          Select a required type first. Matching subtypes will appear here.
        </div>
      </div>
    );
  }

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  return (
    <div className="space-y-2">
      <p className={labelClass}>Required Subtype</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <label
              key={opt.value}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition ${
                active
                  ? "border-violet-500 bg-violet-50 text-violet-900"
                  : "border-slate-200 text-slate-700 hover:border-slate-300"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={active}
                onChange={() => toggle(opt.value)}
              />
              {opt.label}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function capacityLabel(showResidential: boolean, showCommercial: boolean): string {
  if (showResidential && showCommercial) return "Rooms / Capacity";
  if (showResidential) return "No. of Rooms";
  if (showCommercial) return "Capacity / No. of Persons";
  return "Capacity";
}

export function OpportunityRequirementSection({
  opportunity,
  editing,
  salesRole: salesRoleProp,
}: {
  opportunity: Opportunity;
  editing: boolean;
  salesRole?: OpportunitySalesRole | null;
}) {
  const salesRole = normalizeOpportunitySalesRole(salesRoleProp ?? opportunity.sales_role);
  const profService = isOtherSalesRole(salesRole);
  const isLease = isLeaseLikeSalesRole(salesRole);
  const isBuy = salesRole === "to_buy";
  const isSaleCase = isSaleCaseSalesRole(salesRole);

  const [primaryTypes, setPrimaryTypes] = useState<RequirementPrimaryType[]>(() =>
    parseRequirementPrimaryTypes(opportunity.property_category_preference),
  );
  const [subtypes, setSubtypes] = useState<string[]>(() =>
    parseRequirementSubtypes(opportunity.property_type_preference),
  );

  const showResidential = requirementIncludesResidential(
    serializeRequirementPrimaryTypes(primaryTypes),
  );
  const showCommercial = requirementIncludesCommercial(
    serializeRequirementPrimaryTypes(primaryTypes),
  );
  const showCapacity = isLease && (showResidential || showCommercial);

  if (profService) {
    return editing ? (
      <TextAreaField
        label="Special Requirement"
        name="requirement_summary"
        defaultValue={opportunity.requirement_summary ?? ""}
      />
    ) : (
      <ViewField label="Special Requirement" value={opportunity.requirement_summary ?? ""} />
    );
  }

  const primarySerialized = serializeRequirementPrimaryTypes(primaryTypes) ?? "";
  const subtypeSerialized = serializeRequirementSubtypes(subtypes) ?? "";
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
    <div className="space-y-3">
      <input type="hidden" name="property_category_preference" value={primarySerialized} />
      <input type="hidden" name="property_type_preference" value={subtypeSerialized} />
      {editing ? (
        <>
          <div>
            <p className={`mb-1.5 ${labelClass}`}>Required Type</p>
            <PrimaryTypeCheckboxes
              selected={primaryTypes}
              onChange={(next) => {
                setPrimaryTypes(next);
                const allowed = new Set(
                  next.flatMap((type) => REQUIREMENT_SUBTYPE_OPTIONS[type].map((opt) => opt.value)),
                );
                setSubtypes((current) => current.filter((value) => allowed.has(value)));
              }}
            />
          </div>
          <SubtypeCheckboxes primaryTypes={primaryTypes} selected={subtypes} onChange={setSubtypes} />
        </>
      ) : (
        <dl className={fieldGrid}>
          <ViewField
            label="Required Type"
            value={formatRequirementPrimaryTypes(opportunity.property_category_preference)}
          />
          <ViewField
            label="Required Subtype"
            value={formatRequirementSubtypes(
              opportunity.property_category_preference,
              opportunity.property_type_preference,
            )}
          />
        </dl>
      )}

      {editing ? (
        <div className={fieldGrid}>
          <FormField
            label="Location"
            name="district_preference"
            defaultValue={opportunity.district_preference ?? ""}
          />
          <FormField
            label={isSaleCase ? "Target Area (Sq Ft)" : "Area (Sq Ft)"}
            name="required_area_sqft"
            type="number"
            defaultValue={opportunity.required_area_sqft ?? ""}
          />
          <FormField
            label="Budget (HKD)"
            name="budget_max"
            type="number"
            defaultValue={opportunityBudgetValue(opportunity) ?? ""}
          />
          {showCapacity ? (
            <FormField
              label={capacityLabel(showResidential, showCommercial)}
              name="required_capacity_pax"
              type="number"
              defaultValue={opportunity.required_capacity_pax?.toString() ?? ""}
            />
          ) : null}
          {isLease ? (
            <>
              <FormField
                label="Move-In Date"
                name="move_in_date"
                type="date"
                defaultValue={opportunity.move_in_date?.slice(0, 10) ?? ""}
              />
              <FormField label="Lease Term" name="lease_term" defaultValue={opportunity.lease_term ?? ""} />
            </>
          ) : null}
          {isSaleCase ? (
            <FormField
              label="Target Yield (%)"
              name="target_yield"
              defaultValue={opportunity.target_yield ?? ""}
            />
          ) : null}
          {isBuy ? (
            <label className="block min-w-0 text-sm">
              <span className={labelClass}>Funding Status</span>
              <select
                name="funding_status"
                defaultValue={opportunity.funding_status ?? ""}
                className={selectClass}
              >
                <option value="">—</option>
                {OPPORTUNITY_FUNDING_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {OPPORTUNITY_FUNDING_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="col-span-2">
            <TextAreaField
              label="Special Requirement"
              name="requirement_summary"
              defaultValue={opportunity.requirement_summary ?? ""}
            />
          </div>
        </div>
      ) : (
        <dl className={fieldGrid}>
          <ViewField label="Location" value={opportunity.district_preference ?? ""} />
          <ViewField
            label={isSaleCase ? "Target Area" : "Area"}
            value={opportunity.required_area_sqft ? `${opportunity.required_area_sqft} sq ft` : ""}
          />
          <ViewField
            label="Budget"
            value={formatOpportunityBudget(opportunity.budget_max, opportunity.budget_min)}
          />
          {showCapacity ? (
            <ViewField
              label={capacityLabel(showResidential, showCommercial)}
              value={
                opportunity.required_capacity_pax != null
                  ? String(opportunity.required_capacity_pax)
                  : ""
              }
            />
          ) : null}
          {isLease ? (
            <>
              <ViewField label="Move-In Date" value={opportunity.move_in_date?.slice(0, 10) ?? ""} />
              <ViewField label="Lease Term" value={opportunity.lease_term ?? ""} />
            </>
          ) : null}
          {isSaleCase ? (
            <ViewField
              label="Target Yield (%)"
              value={opportunity.target_yield ? `${opportunity.target_yield}%` : ""}
            />
          ) : null}
          {isBuy ? <ViewField label="Funding Status" value={fundingLabel} /> : null}
          <div className="col-span-2">
            <ViewField label="Special Requirement" value={opportunity.requirement_summary ?? ""} />
          </div>
        </dl>
      )}
    </div>
  );
}
