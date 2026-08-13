"use client";

import { useMemo, useState } from "react";
import { leadFieldLabel } from "@/lib/leadFields";
import {
  OPPORTUNITY_CATEGORY_OPTIONS,
  primaryCategoryPreference,
  primarySpaceFormPreference,
} from "@/lib/opportunityPreferences";
import {
  REQUIREMENT_SUBTYPE_OPTIONS,
  type RequirementPrimaryType,
} from "@/lib/opportunityRequirementTypes";

const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100";
const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500";

export function LeadRequirementTypeFields({
  categoryDefault,
  subtypeDefault,
}: {
  categoryDefault?: string | null;
  subtypeDefault?: string | null;
}) {
  const initialType = (primaryCategoryPreference(categoryDefault) ?? "") as RequirementPrimaryType | "";
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
    const options = typed ? (REQUIREMENT_SUBTYPE_OPTIONS[typed] ?? []) : [];
    setRequiredSubtype((current) =>
      options.some((opt) => opt.value === current) ? current : "",
    );
  }

  return (
    <>
      <label className="block min-w-0">
        <span className={labelClass}>{leadFieldLabel("property_category_preference")}</span>
        <select
          name="property_category_preference"
          value={requiredType}
          onChange={(e) => onRequiredTypeChange(e.target.value)}
          className={fieldClass}
        >
          <option value="">—</option>
          {OPPORTUNITY_CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block min-w-0">
        <span className={labelClass}>{leadFieldLabel("property_type_preference")}</span>
        <select
          name="property_type_preference"
          value={requiredSubtype}
          onChange={(e) => setRequiredSubtype(e.target.value)}
          className={fieldClass}
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
