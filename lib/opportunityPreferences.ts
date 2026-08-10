/** Opportunity property category / space-form preferences (Phase 39). */

import {
  PROPERTY_CATEGORIES,
  SPACE_FORMS,
} from "@/lib/premisesClassification";
import {
  OPPORTUNITY_REQUIREMENT_SUBTYPES,
  REQUIREMENT_SUBTYPE_OPTIONS,
  REQUIREMENT_PRIMARY_LABELS,
  REQUIREMENT_PRIMARY_TYPES,
} from "@/lib/opportunityRequirementTypes";

function splitPreferenceList(value: unknown): string[] {
  if (value == null) return [];
  const raw = String(value).trim();
  if (!raw || raw.toLowerCase() === "any") return [];
  return raw
    .split(/[,;/|]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function joinPreferences(parts: string[]): string | null {
  return parts.length > 0 ? parts.join(", ") : null;
}

function filterValidCategories(parts: string[]): string[] {
  return parts.filter((p) =>
    (PROPERTY_CATEGORIES as readonly string[]).includes(p) ||
    (REQUIREMENT_PRIMARY_TYPES as readonly string[]).includes(p),
  );
}

function filterValidSpaceForms(parts: string[]): string[] {
  return parts.filter((p) =>
    (SPACE_FORMS as readonly string[]).includes(p) ||
    (OPPORTUNITY_REQUIREMENT_SUBTYPES as readonly string[]).includes(p),
  );
}

/** Normalize comma-separated category preference; invalid tokens dropped. */
export function normalizeCategoryPreference(value: unknown): string | null {
  return joinPreferences(filterValidCategories(splitPreferenceList(value)));
}

/** Normalize comma-separated space-form preference (stored as property_type_preference). */
export function normalizeSpaceFormPreference(value: unknown): string | null {
  return joinPreferences(filterValidSpaceForms(splitPreferenceList(value)));
}

export function parseCategoryPreferenceList(value: string | null | undefined): string[] {
  return filterValidCategories(splitPreferenceList(value));
}

export function parseSpaceFormPreferenceList(value: string | null | undefined): string[] {
  return filterValidSpaceForms(splitPreferenceList(value));
}

export const OPPORTUNITY_CATEGORY_OPTIONS = REQUIREMENT_PRIMARY_TYPES.map((value) => ({
  value,
  label: REQUIREMENT_PRIMARY_LABELS[value],
}));

export const OPPORTUNITY_SPACE_FORM_OPTIONS = Object.values(
  // Labels are intentionally shared with the Overview multi-select taxonomy.
  // Duplicate subtype values are removed below.
  REQUIREMENT_SUBTYPE_OPTIONS,
).flat().filter((option, index, all) => all.findIndex((item) => item.value === option.value) === index);

/** Primary (first) category for single-select UI. */
export function primaryCategoryPreference(value: string | null | undefined): string | null {
  return parseCategoryPreferenceList(value)[0] ?? null;
}

/** Primary (first) space form for single-select UI. */
export function primarySpaceFormPreference(value: string | null | undefined): string | null {
  return parseSpaceFormPreferenceList(value)[0] ?? null;
}
