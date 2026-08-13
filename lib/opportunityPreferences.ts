/** Opportunity required type / subtype preferences (aligned with premises). */

import {
  OPPORTUNITY_REQUIREMENT_SUBTYPES,
  REQUIREMENT_PRIMARY_LABELS,
  REQUIREMENT_PRIMARY_TYPES,
  REQUIREMENT_SUBTYPE_OPTIONS,
  parseRequirementPrimaryTypes,
  parseRequirementSubtypes,
  serializeRequirementPrimaryTypes,
  serializeRequirementSubtypes,
} from "@/lib/opportunityRequirementTypes";

function splitPreferenceList(value: unknown): string[] {
  if (value == null) return [];
  const raw = String(value).trim();
  if (!raw || raw.toLowerCase() === "any" || raw.toLowerCase() === "unknown") return [];
  return raw
    .split(/[,;/|]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Normalize comma-separated required type (asset class); invalid/Unknown tokens dropped. */
export function normalizeCategoryPreference(value: unknown): string | null {
  return serializeRequirementPrimaryTypes(splitPreferenceList(value));
}

/** Normalize comma-separated required subtype (product subtype). */
export function normalizeSpaceFormPreference(value: unknown): string | null {
  return serializeRequirementSubtypes(splitPreferenceList(value));
}

export function parseCategoryPreferenceList(value: string | null | undefined): string[] {
  return parseRequirementPrimaryTypes(value);
}

export function parseSpaceFormPreferenceList(value: string | null | undefined): string[] {
  return parseRequirementSubtypes(value);
}

export const OPPORTUNITY_CATEGORY_OPTIONS = REQUIREMENT_PRIMARY_TYPES.map((value) => ({
  value,
  label: REQUIREMENT_PRIMARY_LABELS[value],
}));

export const OPPORTUNITY_SPACE_FORM_OPTIONS = Object.values(REQUIREMENT_SUBTYPE_OPTIONS)
  .flat()
  .filter((option, index, all) => all.findIndex((item) => item.value === option.value) === index);

/** Primary (first) required type for single-select UI. */
export function primaryCategoryPreference(value: string | null | undefined): string | null {
  return parseCategoryPreferenceList(value)[0] ?? null;
}

/** Primary (first) required subtype for single-select UI. */
export function primarySpaceFormPreference(value: string | null | undefined): string | null {
  return parseSpaceFormPreferenceList(value)[0] ?? null;
}

export { OPPORTUNITY_REQUIREMENT_SUBTYPES };
