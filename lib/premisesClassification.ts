/** Canonical premises classification (property-classification.md). */

export const PROPERTY_CATEGORIES = [
  "Office",
  "Serviced Office",
  "Shared Office",
  "Retail",
  "Industrial",
  "Residential",
  "Hotel",
  "Investment",
] as const;

export type PropertyCategory = (typeof PROPERTY_CATEGORIES)[number];

export const SPACE_FORMS = [
  "Unit (s)",
  "Floor (s)",
  "Enbloc",
  "Land",
] as const;

export type SpaceForm = (typeof SPACE_FORMS)[number];

export const CANONICAL_LISTING_INTENTS = ["lease", "sale", "both"] as const;

export type CanonicalListingIntent = (typeof CANONICAL_LISTING_INTENTS)[number];

export const CANONICAL_LISTING_INTENT_LABELS: Record<CanonicalListingIntent, string> = {
  lease: "Lease",
  sale: "Sale",
  both: "Lease & Sale",
};

export type PremisesClassificationSource = {
  property_type?: string | null;
  centre_type?: string | null;
  offer_type?: string | null;
  operating_model?: string | null;
  inventory_status?: string | null;
  monthly_rent?: string | number | null;
  asking_sale_price?: string | number | null;
  floor?: string | null;
};

function norm(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function parseAmount(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseFloat(String(value).replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function isCategory(value: string): value is PropertyCategory {
  return (PROPERTY_CATEGORIES as readonly string[]).includes(value);
}

function isSpaceForm(value: string): value is SpaceForm {
  return (SPACE_FORMS as readonly string[]).includes(value);
}

function isCanonicalListingIntent(value: string): value is CanonicalListingIntent {
  return (CANONICAL_LISTING_INTENTS as readonly string[]).includes(value);
}

/** Map V1 property_type / operating_model / offer_type → property_category. */
export function derivePropertyCategory(source: PremisesClassificationSource): PropertyCategory | null {
  const operatingModel = norm(source.operating_model);
  const centreType = norm(source.centre_type);
  const offerType = norm(source.offer_type);
  const propertyType = norm(source.property_type);

  if (operatingModel === "Serviced Office" || centreType === "Serviced Office") {
    return "Serviced Office";
  }
  if (operatingModel === "Shared Office" || centreType === "Shared Office") {
    return "Shared Office";
  }
  if (operatingModel === "Hotel Operation" || centreType === "Hotel Operation") {
    return "Hotel";
  }

  const offerLower = offerType.toLowerCase();
  if (offerLower.includes("enbloc") || offerLower.includes("portfolio")) {
    return "Investment";
  }

  switch (propertyType) {
    case "Industrial":
      return "Industrial";
    case "Residential":
      return "Residential";
    case "Retails":
      return "Retail";
    case "Land":
      return "Investment";
    case "Commercial":
    case "Mixed Use":
      return "Office";
    default:
      break;
  }

  if (propertyType) return "Office";
  return null;
}

/** True when floor field indicates a whole-floor listing. */
function isWholeFloorIndicator(floor: string | null | undefined): boolean {
  const f = norm(floor).toLowerCase();
  return f === "whole" || f.includes("whole floor");
}

/** Map offer_type → space_form. */
export function deriveSpaceForm(source: PremisesClassificationSource): SpaceForm | null {
  const offerType = norm(source.offer_type);
  if (!offerType) {
    if (isWholeFloorIndicator(source.floor)) return "Floor (s)";
    return null;
  }

  const lower = offerType.toLowerCase();
  if (lower.includes("floor")) return "Floor (s)";
  if (lower.includes("unit") || lower.includes("suite") || lower.includes("room") || lower.includes("shop") || lower.includes("warehouse")) return "Unit (s)";
  if (lower.includes("enbloc") || lower.includes("en-bloc") || lower.includes("portfolio") || lower.includes("building")) return "Enbloc";
  if (lower.includes("land")) return "Land";

  return null;
}

/** Map inventory_status + pricing → lease / sale / both. */
export function deriveCanonicalListingIntent(
  source: PremisesClassificationSource,
): CanonicalListingIntent | null {
  const rent = parseAmount(source.monthly_rent);
  const sale = parseAmount(source.asking_sale_price);
  if (rent != null && sale != null) return "both";

  const status = norm(source.inventory_status).toLowerCase();
  if (status === "for sale" || status.includes("sale")) {
    return sale != null || rent == null ? "sale" : "both";
  }
  if (status === "for lease" || status.includes("lease") || status.includes("rent")) {
    return rent != null || sale == null ? "lease" : "both";
  }

  if (sale != null && rent == null) return "sale";
  if (rent != null && sale == null) return "lease";
  return null;
}

export function derivePremisesClassification(source: PremisesClassificationSource): {
  property_category: PropertyCategory | null;
  space_form: SpaceForm | null;
  listing_intent: CanonicalListingIntent | null;
} {
  return {
    property_category: derivePropertyCategory(source),
    space_form: deriveSpaceForm(source),
    listing_intent: deriveCanonicalListingIntent(source),
  };
}

export function parsePropertyCategory(value: unknown): PropertyCategory | null {
  const s = norm(value ? String(value) : null);
  return s && isCategory(s) ? s : null;
}

export function parseSpaceForm(value: unknown): SpaceForm | null {
  const s = norm(value ? String(value) : null);
  if (s && isSpaceForm(s)) return s;
  const legacy = s.toLowerCase();
  if (["unit", "suite", "room", "shop", "warehouse", "apartment"].includes(legacy)) return "Unit (s)";
  if (["floor", "whole floor"].includes(legacy)) return "Floor (s)";
  if (["en-bloc", "building", "portfolio", "whole building"].includes(legacy)) return "Enbloc";
  if (legacy === "land") return "Land";
  return null;
}

export function parseCanonicalListingIntent(value: unknown): CanonicalListingIntent | null {
  const s = norm(value ? String(value) : null).toLowerCase();
  if (!s) return null;
  if (isCanonicalListingIntent(s)) return s;
  if (s === "for lease" || s === "rent") return "lease";
  if (s === "for sale") return "sale";
  if (s.includes("both")) return "both";
  return null;
}
