/** Industry requirement classification for opportunity workspace (stored in preference columns). */

export type RequirementPrimaryType =
  | "commercial"
  | "residential"
  | "industrial"
  | "land"
  | "other"
  | "unknown";

export const REQUIREMENT_PRIMARY_TYPES: RequirementPrimaryType[] = [
  "commercial",
  "residential",
  "industrial",
  "land",
  "other",
  "unknown",
];

export const REQUIREMENT_PRIMARY_LABELS: Record<RequirementPrimaryType, string> = {
  commercial: "Commercial",
  residential: "Residential",
  industrial: "Industrial",
  land: "Land",
  other: "Other",
  unknown: "Unknown",
};

export const REQUIREMENT_SUBTYPE_OPTIONS: Record<RequirementPrimaryType, { value: string; label: string }[]> = {
  commercial: [
    { value: "conventional_office", label: "Conventional Office" },
    { value: "serviced_office", label: "Serviced Office" },
    { value: "shared_sublet", label: "Shared / Sublet" },
    { value: "shop_retail", label: "Shop / Retail" },
  ],
  residential: [
    { value: "flat", label: "Flat" },
    { value: "serviced_unit", label: "Serviced Unit" },
    { value: "shared_flat", label: "Shared Flat" },
  ],
  industrial: [{ value: "industrial_unit", label: "Industrial Unit" }],
  land: [
    { value: "land", label: "Land" },
  ],
  other: [
    { value: "whole_building", label: "Whole Building / En-bloc" },
    { value: "other", label: "Other" },
  ],
  unknown: [{ value: "unknown", label: "Unknown" }],
};

export const OPPORTUNITY_REQUIREMENT_SUBTYPES = Object.values(REQUIREMENT_SUBTYPE_OPTIONS)
  .flat()
  .map((option) => option.value);

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

/** Primary types stored in property_category_preference. */
export function parseRequirementPrimaryTypes(value: string | null | undefined): RequirementPrimaryType[] {
  return splitList(value).filter((p): p is RequirementPrimaryType =>
    (REQUIREMENT_PRIMARY_TYPES as readonly string[]).includes(p),
  );
}

/** Subtypes stored in property_type_preference. */
export function parseRequirementSubtypes(value: string | null | undefined): string[] {
  return splitList(value);
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
  for (const primary of parseRequirementPrimaryTypes(primaryRaw)) {
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
  const valid = types.filter((t): t is RequirementPrimaryType =>
    (REQUIREMENT_PRIMARY_TYPES as readonly string[]).includes(t),
  );
  return joinList(valid);
}

export function serializeRequirementSubtypes(subtypes: string[]): string | null {
  return joinList(subtypes);
}
