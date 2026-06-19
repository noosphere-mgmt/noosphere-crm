import { getOpportunity } from "@/lib/repos/opportunities";
import { query } from "@/lib/db";
import type { MatchedProperty, Opportunity } from "@/lib/types/entities";

type PropertyRow = {
  property_id: number;
  floor: string | null;
  unit: string | null;
  specification: string | null;
  property_category: string;
  operating_model: string;
  space_form: string;
  area_sqft: string | null;
  capacity_pax: number | null;
  building_name: string | null;
  building_district: string | null;
  listing_intent: string;
  asking_rent: string | null;
  asking_sale_price: string | null;
  available_date: string | null;
  property_status: string;
};

const propertyCandidateSelect = `
  p.id AS property_id,
  p.floor,
  p.unit,
  p.specification,
  p.property_category,
  p.operating_model,
  p.space_form,
  p.area_sqft::text,
  p.capacity_pax,
  b.name_en AS building_name,
  b.district AS building_district,
  p.listing_intent,
  p.asking_rent::text,
  p.asking_sale_price::text,
  p.available_date::text,
  p.status AS property_status
`;

function parseNum(v: string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function parseDistricts(preference: string | null | undefined): string[] {
  if (!preference?.trim()) return [];
  return preference
    .split(/[,;/|]/)
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

function districtMatches(buildingDistrict: string | null | undefined, prefs: string[]): boolean {
  if (prefs.length === 0) return true;
  const district = (buildingDistrict ?? "").trim().toLowerCase();
  if (!district) return false;
  return prefs.some((p) => district.includes(p) || p.includes(district));
}

type WorkspaceFit = {
  operatingModels: string[];
  spaceForms: string[];
  categories: string[];
};

const WORKSPACE_FIT: Record<string, WorkspaceFit> = {
  "whole floor": {
    operatingModels: ["Conventional Space"],
    spaceForms: ["Whole Floor", "Building"],
    categories: [],
  },
  unit: {
    operatingModels: ["Conventional Space"],
    spaceForms: ["Unit", "Suite", "Room"],
    categories: [],
  },
  "serviced office": {
    operatingModels: ["Serviced Office"],
    spaceForms: ["Room", "Unit", "Suite"],
    categories: ["Office"],
  },
  "shared office": {
    operatingModels: ["Shared Office"],
    spaceForms: ["Room", "Unit"],
    categories: ["Office"],
  },
  "traditional lease": {
    operatingModels: ["Conventional Space"],
    spaceForms: ["Unit", "Whole Floor", "Suite"],
    categories: [],
  },
  industrial: {
    operatingModels: ["Conventional Space"],
    spaceForms: ["Warehouse", "Whole Floor", "Unit", "Building"],
    categories: ["Industrial"],
  },
  retail: {
    operatingModels: ["Conventional Space"],
    spaceForms: ["Shop", "Unit"],
    categories: ["Retail"],
  },
  any: { operatingModels: [], spaceForms: [], categories: [] },
};

function workspaceMatches(workspaceType: string | null | undefined, row: PropertyRow): boolean {
  if (!workspaceType?.trim() || workspaceType.toLowerCase() === "any") return true;
  const fit = WORKSPACE_FIT[workspaceType.trim().toLowerCase()];
  if (!fit) return true;

  const opOk =
    fit.operatingModels.length === 0 || fit.operatingModels.includes(row.operating_model);
  const formOk = fit.spaceForms.length === 0 || fit.spaceForms.includes(row.space_form);
  const catOk =
    fit.categories.length === 0 || fit.categories.includes(row.property_category);

  return opOk && (formOk || catOk);
}

function propertyDisplayLabel(row: PropertyRow): string {
  const loc = [row.floor, row.unit].filter(Boolean).join(" · ");
  if (loc) return loc;
  if (row.specification?.trim()) return row.specification.trim().slice(0, 80);
  return row.building_name ?? "Property";
}

function resolveComparablePrice(row: PropertyRow): number | null {
  const rent = parseNum(row.asking_rent);
  const sale = parseNum(row.asking_sale_price);
  if (row.listing_intent === "sale") return sale;
  if (row.listing_intent === "both") return rent ?? sale;
  return rent;
}

function scoreProperty(opp: Opportunity, row: PropertyRow): MatchedProperty {
  const reasons: string[] = [];
  const gaps: string[] = [];
  let score = 0;

  const budgetMax = parseNum(opp.budget_max) ?? parseNum(opp.budget_min);
  const requiredArea = parseNum(opp.required_area_sqft);
  const price = resolveComparablePrice(row);
  const area = parseNum(row.area_sqft);
  const districts = parseDistricts(opp.district_preference);

  if (budgetMax != null && price != null) {
    if (price <= budgetMax) {
      score += 25;
      reasons.push("Within max budget");
    } else {
      gaps.push(`Price ${price.toLocaleString()} exceeds max budget ${budgetMax.toLocaleString()}`);
    }
  } else if (budgetMax != null && price == null) {
    gaps.push("Property has no price to compare against budget");
  } else {
    score += 5;
  }

  if (requiredArea != null && area != null) {
    const ratio = area / requiredArea;
    if (ratio >= 0.85 && ratio <= 1.25) {
      score += 20;
      reasons.push("Area within target range");
    } else if (area >= requiredArea * 0.7) {
      score += 10;
      reasons.push("Area close to target");
      gaps.push(`Area ${area} sq ft vs required ${requiredArea} sq ft`);
    } else {
      gaps.push(`Area ${area} sq ft below required ${requiredArea} sq ft`);
    }
  } else if (requiredArea != null) {
    gaps.push("Property has no area recorded");
  } else {
    score += 5;
  }

  if (opp.required_capacity_pax != null) {
    if (row.capacity_pax != null) {
      if (row.capacity_pax >= opp.required_capacity_pax) {
        score += 20;
        reasons.push("Capacity meets requirement");
      } else {
        gaps.push(`Capacity ${row.capacity_pax} pax below required ${opp.required_capacity_pax}`);
      }
    } else {
      gaps.push("Property has no capacity recorded");
    }
  } else {
    score += 5;
  }

  if (districtMatches(row.building_district, districts)) {
    if (districts.length > 0) {
      score += 20;
      reasons.push(`District match (${row.building_district})`);
    } else {
      score += 5;
    }
  } else {
    gaps.push(`District ${row.building_district ?? "—"} not in preference`);
  }

  if (workspaceMatches(opp.workspace_type, row)) {
    if (opp.workspace_type?.trim() && opp.workspace_type.toLowerCase() !== "any") {
      score += 15;
      reasons.push(`Workspace fit (${row.operating_model} · ${row.space_form})`);
    } else {
      score += 5;
    }
  } else {
    gaps.push(
      `${row.operating_model} / ${row.space_form} may not fit ${opp.workspace_type}`,
    );
  }

  if (opp.move_in_date) {
    if (!row.available_date) {
      score += 5;
      gaps.push("No available date on property");
    } else if (row.available_date <= opp.move_in_date.slice(0, 10)) {
      score += 15;
      reasons.push("Available by move-in date");
    } else {
      gaps.push(`Available ${row.available_date} after move-in ${opp.move_in_date.slice(0, 10)}`);
    }
  } else {
    score += 5;
  }

  if (row.property_status === "available") {
    score += 10;
    reasons.push("Property is available");
  }

  return {
    property_id: row.property_id,
    match_score: Math.min(100, score),
    match_reasons: reasons,
    match_gaps: gaps,
    display_label: propertyDisplayLabel(row),
    floor: row.floor,
    unit: row.unit,
    area_sqft: row.area_sqft,
    capacity_pax: row.capacity_pax,
    building_name: row.building_name,
    building_district: row.building_district,
    property_category: row.property_category,
    operating_model: row.operating_model,
    space_form: row.space_form,
    listing_intent: row.listing_intent as MatchedProperty["listing_intent"],
    asking_rent: row.asking_rent,
    asking_sale_price: row.asking_sale_price,
    available_date: row.available_date,
    property_status: row.property_status as MatchedProperty["property_status"],
  };
}

async function listPropertyCandidates(): Promise<PropertyRow[]> {
  return query<PropertyRow>(
    `SELECT ${propertyCandidateSelect}
     FROM properties p
     JOIN buildings b ON b.id = p.building_id
     WHERE p.status IN ('available', 'proposed')
     ORDER BY p.updated_at DESC`,
  );
}

export async function matchPropertiesForOpportunity(
  opportunityId: number,
): Promise<MatchedProperty[]> {
  const opportunity = await getOpportunity(opportunityId);
  if (!opportunity) return [];

  const candidates = await listPropertyCandidates();
  return candidates
    .map((row) => scoreProperty(opportunity, row))
    .filter((m) => m.match_score >= 25)
    .sort((a, b) => b.match_score - a.match_score);
}

export async function matchPropertiesForRequirement(
  opportunity: Opportunity,
): Promise<MatchedProperty[]> {
  const candidates = await listPropertyCandidates();
  return candidates
    .map((row) => scoreProperty(opportunity, row))
    .filter((m) => m.match_score >= 25)
    .sort((a, b) => b.match_score - a.match_score);
}
