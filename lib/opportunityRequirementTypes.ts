/** Opportunity required type / subtype — aligned with premises asset_class / product_subtype. */

import { PREMISES_ASSET_CLASSES, PREMISES_PRODUCT_SUBTYPES } from "@/lib/v1ListValues";

export type RequirementPrimaryType = (typeof PREMISES_ASSET_CLASSES)[number]["value"];

export const REQUIREMENT_PRIMARY_TYPES: RequirementPrimaryType[] = PREMISES_ASSET_CLASSES.map(
  (item) => item.value,
);

export const REQUIREMENT_PRIMARY_LABELS: Record<RequirementPrimaryType, string> = Object.fromEntries(
  PREMISES_ASSET_CLASSES.map((item) => [item.value, item.label]),
) as Record<RequirementPrimaryType, string>;

export const REQUIREMENT_SUBTYPE_OPTIONS: Record<
  RequirementPrimaryType,
  { value: string; label: string }[]
> = {
  commercial: [...PREMISES_PRODUCT_SUBTYPES.commercial],
  residential: [...PREMISES_PRODUCT_SUBTYPES.residential],
  industrial: [...PREMISES_PRODUCT_SUBTYPES.industrial],
  land: [...PREMISES_PRODUCT_SUBTYPES.land],
  other: [...PREMISES_PRODUCT_SUBTYPES.other],
};

export const OPPORTUNITY_REQUIREMENT_SUBTYPES = Object.values(REQUIREMENT_SUBTYPE_OPTIONS)
  .flat()
  .map((option) => option.value);

/** Legacy subtype values still accepted on import/read. */
const SUBTYPE_ALIASES: Record<string, string> = {
  shared_sublet: "shared_sublet_office",
};

function splitList(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(/[,;/|]/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function joinList(parts: string[]): string | null {
  return parts.length > 0 ? parts.join(", ") : null;
}

function normalizeSubtypeToken(value: string): string {
  const key = value.trim().toLowerCase();
  return SUBTYPE_ALIASES[key] ?? value.trim();
}

function isRequirementPrimaryType(value: string): value is RequirementPrimaryType {
  return (REQUIREMENT_PRIMARY_TYPES as readonly string[]).includes(value);
}

/** Primary types stored in property_category_preference (Unknown removed). */
export function parseRequirementPrimaryTypes(value: string | null | undefined): RequirementPrimaryType[] {
  return splitList(value)
    .map((p) => p.toLowerCase())
    .filter((p): p is RequirementPrimaryType => isRequirementPrimaryType(p));
}

/** Subtypes stored in property_type_preference. */
export function parseRequirementSubtypes(value: string | null | undefined): string[] {
  const allowed = new Set(OPPORTUNITY_REQUIREMENT_SUBTYPES);
  return splitList(value)
    .map(normalizeSubtypeToken)
    .filter((p) => allowed.has(p));
}

export function formatRequirementPrimaryTypes(value: string | null | undefined): string {
  const types = parseRequirementPrimaryTypes(value);
  if (types.length === 0) return "—";
  return types.map((t) => REQUIREMENT_PRIMARY_LABELS[t]).join(", ");
}

export function formatRequirementSubtypes(
  primaryRaw: string | null | undefined,
  subtypeRaw: string | null | undefined,
): string {
  const subtypes = parseRequirementSubtypes(subtypeRaw);
  if (subtypes.length === 0) return "—";
  const labelByValue = new Map<string, string>();
  const primaries = parseRequirementPrimaryTypes(primaryRaw);
  const primaryKeys = primaries.length > 0 ? primaries : REQUIREMENT_PRIMARY_TYPES;
  for (const primary of primaryKeys) {
    for (const opt of REQUIREMENT_SUBTYPE_OPTIONS[primary]) {
      labelByValue.set(opt.value, opt.label);
    }
  }
  return subtypes.map((s) => labelByValue.get(s) ?? s).join(", ");
}

export function requirementIncludesResidential(primaryRaw: string | null | undefined): boolean {
  return parseRequirementPrimaryTypes(primaryRaw).includes("residential");
}

export function requirementIncludesCommercial(primaryRaw: string | null | undefined): boolean {
  const types = parseRequirementPrimaryTypes(primaryRaw);
  return types.includes("commercial") || types.includes("industrial");
}

export function serializeRequirementPrimaryTypes(types: string[]): string | null {
  const valid = types.filter((t): t is RequirementPrimaryType => isRequirementPrimaryType(t));
  return joinList(valid);
}

export function serializeRequirementSubtypes(subtypes: string[]): string | null {
  const allowed = new Set(OPPORTUNITY_REQUIREMENT_SUBTYPES);
  return joinList(
    subtypes.map(normalizeSubtypeToken).filter((s) => allowed.has(s)),
  );
}

export function subtypesForRequiredTypes(
  primaryTypes: RequirementPrimaryType[],
): { value: string; label: string }[] {
  const seen = new Set<string>();
  const out: { value: string; label: string }[] = [];
  for (const primary of primaryTypes) {
    for (const opt of REQUIREMENT_SUBTYPE_OPTIONS[primary] ?? []) {
      if (!seen.has(opt.value)) {
        seen.add(opt.value);
        out.push(opt);
      }
    }
  }
  return out;
}
