"use client";

import { useMemo, useState } from "react";
import { FormField, TextAreaField } from "@/components/admin/AdminFormFields";
import { labelClass } from "@/components/admin/opportunities/OpportunityRequirementFields";
import { opportunityBudgetValue } from "@/lib/opportunityFormParsing";
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
import { isProfServiceSalesRole } from "@/lib/opportunityValues";
import type { Opportunity } from "@/lib/types/entities";

const fieldGrid = "grid grid-cols-2 gap-x-3 gap-y-2.5";

function ViewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-slate-500">{label}</dt>
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
        <p className={labelClass}>Requirement detail</p>
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
          Select a required type first. The relevant details will appear here.
        </div>
      </div>
    );
  }

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  return (
    <div className="space-y-2">
      <p className={labelClass}>Requirement detail</p>
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

export function OpportunityRequirementSection({
  opportunity,
  editing,
}: {
  opportunity: Opportunity;
  editing: boolean;
}) {
  const profService = isProfServiceSalesRole(opportunity.sales_role);
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

  if (profService) {
    return editing ? (
      <TextAreaField
        label="Special requirement"
        name="requirement_summary"
        defaultValue={opportunity.requirement_summary ?? ""}
      />
    ) : (
      <ViewField label="Special requirement" value={opportunity.requirement_summary ?? ""} />
    );
  }

  const primarySerialized = serializeRequirementPrimaryTypes(primaryTypes) ?? "";
  const subtypeSerialized = serializeRequirementSubtypes(subtypes) ?? "";

  return (
    <div className="space-y-3">
      <input type="hidden" name="property_category_preference" value={primarySerialized} />
      <input type="hidden" name="property_type_preference" value={subtypeSerialized} />
      {editing ? (
        <>
          <div>
            <p className={`mb-1.5 ${labelClass}`}>Required type</p>
            <PrimaryTypeCheckboxes selected={primaryTypes} onChange={setPrimaryTypes} />
          </div>
          <SubtypeCheckboxes primaryTypes={primaryTypes} selected={subtypes} onChange={setSubtypes} />
        </>
      ) : (
        <dl className={fieldGrid}>
          <ViewField
            label="Required type"
            value={formatRequirementPrimaryTypes(opportunity.property_category_preference)}
          />
          <ViewField
            label="Requirement detail"
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
            label="Area (sq ft)"
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
          {showResidential && !showCommercial ? (
            <FormField
              label="No. of rooms"
              name="required_capacity_pax"
              type="number"
              defaultValue={opportunity.required_capacity_pax?.toString() ?? ""}
            />
          ) : showCommercial && !showResidential ? (
            <FormField
              label="Capacity / no. of persons"
              name="required_capacity_pax"
              type="number"
              defaultValue={opportunity.required_capacity_pax?.toString() ?? ""}
            />
          ) : showResidential || showCommercial ? (
            <FormField
              label={showResidential && showCommercial ? "Rooms / capacity" : showResidential ? "No. of rooms" : "Capacity / no. of persons"}
              name="required_capacity_pax"
              type="number"
              defaultValue={opportunity.required_capacity_pax?.toString() ?? ""}
            />
          ) : null}
          <FormField
            label="Move-in date"
            name="move_in_date"
            type="date"
            defaultValue={opportunity.move_in_date?.slice(0, 10) ?? ""}
          />
          <FormField label="Lease term" name="lease_term" defaultValue={opportunity.lease_term ?? ""} />
          <div className="col-span-2">
            <TextAreaField
              label="Special requirement"
              name="requirement_summary"
              defaultValue={opportunity.requirement_summary ?? ""}
            />
          </div>
        </div>
      ) : (
        <dl className={fieldGrid}>
          <ViewField label="Location" value={opportunity.district_preference ?? ""} />
          <ViewField label="Area" value={opportunity.required_area_sqft ? `${opportunity.required_area_sqft} sq ft` : ""} />
          <ViewField
            label="Budget"
            value={opportunity.budget_max ? `HK$${Number(opportunity.budget_max).toLocaleString()}` : ""}
          />
          {showResidential ? (
            <ViewField
              label="No. of rooms"
              value={opportunity.required_capacity_pax != null ? String(opportunity.required_capacity_pax) : ""}
            />
          ) : null}
          {showCommercial ? (
            <ViewField
              label="Capacity / no. of persons"
              value={opportunity.required_capacity_pax != null ? String(opportunity.required_capacity_pax) : ""}
            />
          ) : null}
          {!showResidential && !showCommercial && opportunity.required_capacity_pax != null ? (
            <ViewField label="Capacity" value={String(opportunity.required_capacity_pax)} />
          ) : null}
          <ViewField label="Move-in date" value={opportunity.move_in_date?.slice(0, 10) ?? ""} />
          <ViewField label="Lease term" value={opportunity.lease_term ?? ""} />
          <div className="col-span-2">
            <ViewField label="Special requirement" value={opportunity.requirement_summary ?? ""} />
          </div>
        </dl>
      )}
    </div>
  );
}
