import { query } from "@/lib/db";
import { getOpportunity } from "@/lib/repos/opportunities";
import {
  parseCategoryPreferenceList,
  parseSpaceFormPreferenceList,
} from "@/lib/opportunityPreferences";
import type { MatchedProperty, Opportunity } from "@/lib/types/entities";

export const MATCH_SCORE_THRESHOLD = 25;

export type PremisesCandidateRow = {
  premises_id: string;
  premises_business_id: string | null;
  floor: string | null;
  unit: string | null;
  office_name: string | null;
  property_category: string | null;
  space_form: string | null;
  listing_intent: string | null;
  operating_model: string | null;
  area_sqft: string | null;
  capacity_pax: number | null;
  building_name: string | null;
  building_district: string | null;
  monthly_rent: string | null;
  asking_sale_price: string | null;
  available_date: string | null;
  inventory_status: string | null;
  offer_status: string | null;
};

const premisesCandidateSelect = `
  pm.premises_id,
  pm.business_id AS premises_business_id,
  pm.floor,
  pm.unit,
  pm.office_name,
  pm.property_category,
  pm.space_form,
  pm.listing_intent,
  pm.operating_model,
  COALESCE(pm.net_area_sqft, pm.gross_area_sqft)::text AS area_sqft,
  pm.capacity_pax,
  pv.bldg_name_en AS building_name,
  pv.district_en AS building_district,
  pm.monthly_rent::text AS monthly_rent,
  pm.asking_sale_price::text AS asking_sale_price,
  pm.available_date::text AS available_date,
  pm.inventory_status,
  pm.offer_status
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

function premisesDisplayLabel(row: PremisesCandidateRow): string {
  const loc = [row.floor, row.unit].filter(Boolean).join(" · ");
  if (loc) return loc;
  if (row.office_name?.trim()) return row.office_name.trim().slice(0, 80);
  return row.building_name ?? "Premises";
}

function resolveComparablePrice(row: PremisesCandidateRow): number | null {
  const rent = parseNum(row.monthly_rent);
  const sale = parseNum(row.asking_sale_price);
  const intent = (row.listing_intent ?? "").toLowerCase();
  if (intent === "sale") return sale;
  if (intent === "both") return rent ?? sale;
  return rent ?? sale;
}

function resolveMoveInDate(opp: Opportunity): string | null {
  return opp.move_in_date?.slice(0, 10) ?? opp.expected_close_date?.slice(0, 10) ?? null;
}

function isPremisesAvailable(row: PremisesCandidateRow): boolean {
  const offer = (row.offer_status ?? "").trim().toLowerCase();
  if (offer === "available") return true;
  const inv = (row.inventory_status ?? "").trim().toLowerCase();
  return inv.includes("lease") || inv.includes("sale") || inv.includes("rent");
}

function acceptedPremisesCategories(categoryPreferences: string[], subtypePreferences: string[]): string[] {
  const accepted = new Set<string>();
  for (const category of categoryPreferences) {
    if (category === "commercial") {
      const commercialSubtypes = subtypePreferences.filter((value) =>
        [
          "conventional_office",
          "serviced_office",
          "shared_sublet",
          "shared_sublet_office",
          "shop_retail",
        ].includes(value),
      );
      if (commercialSubtypes.length === 0 || commercialSubtypes.includes("conventional_office")) accepted.add("Office");
      if (commercialSubtypes.length === 0 || commercialSubtypes.includes("serviced_office")) accepted.add("Serviced Office");
      if (
        commercialSubtypes.length === 0 ||
        commercialSubtypes.includes("shared_sublet") ||
        commercialSubtypes.includes("shared_sublet_office")
      ) {
        accepted.add("Shared Office");
      }
      if (commercialSubtypes.length === 0 || commercialSubtypes.includes("shop_retail")) accepted.add("Retail");
    } else if (category === "residential") accepted.add("Residential");
    else if (category === "industrial") accepted.add("Industrial");
    else if (category === "land") accepted.add("Investment");
    else if (category !== "other" && category !== "unknown") accepted.add(category);
  }
  return [...accepted];
}

function acceptedPremisesSpaceForms(preferences: string[]): string[] {
  const accepted = new Set<string>();
  for (const value of preferences) {
    if (value === "shop_retail" || value === "industrial_unit") accepted.add("Unit (s)");
    else if (value === "whole_building") {
      accepted.add("Enbloc");
    } else if (value === "land") accepted.add("Land");
    else if (["Unit (s)", "Floor (s)", "Enbloc", "Land"].includes(value)) accepted.add(value);
    else if (["Unit", "Suite", "Room", "Shop", "Warehouse"].includes(value)) accepted.add("Unit (s)");
    else if (["Floor", "Whole Floor"].includes(value)) accepted.add("Floor (s)");
    else if (["En-bloc", "Building", "Portfolio"].includes(value)) accepted.add("Enbloc");
  }
  return [...accepted];
}

/** Hard filter: opportunity category / space-form preferences + sales-role listing intent. */
export function passesPremisesHardFilter(opp: Opportunity, row: PremisesCandidateRow): boolean {
  const categories = parseCategoryPreferenceList(opp.property_category_preference);
  const spaceForms = parseSpaceFormPreferenceList(opp.property_type_preference);
  const acceptedCategories = acceptedPremisesCategories(categories, spaceForms);
  if (acceptedCategories.length > 0) {
    const category = (row.property_category ?? "").trim();
    if (!category || !acceptedCategories.includes(category)) {
      return false;
    }
  }

  const acceptedSpaceForms = acceptedPremisesSpaceForms(spaceForms);
  if (acceptedSpaceForms.length > 0) {
    const form = (row.space_form ?? "").trim();
    if (!form || !acceptedSpaceForms.includes(form)) {
      return false;
    }
  }

  const intent = (row.listing_intent ?? "").toLowerCase();
  if (intent) {
    const role = opp.sales_role ?? "to_lease";
    if ((role === "to_buy" || role === "to_sell") && intent !== "sale" && intent !== "both") return false;
    if ((role === "to_lease" || role === "to_let") && intent !== "lease" && intent !== "both") return false;
  }

  return true;
}

export function scorePremisesMatch(opp: Opportunity, row: PremisesCandidateRow): MatchedProperty {
  const reasons: string[] = [];
  const gaps: string[] = [];
  let score = 0;

  const budgetMax = parseNum(opp.budget_max) ?? parseNum(opp.budget_min);
  const requiredArea = parseNum(opp.required_area_sqft);
  const price = resolveComparablePrice(row);
  const area = parseNum(row.area_sqft);
  const districts = parseDistricts(opp.district_preference);
  const moveIn = resolveMoveInDate(opp);

  if (budgetMax != null && price != null) {
    if (price <= budgetMax) {
      score += 25;
      reasons.push("Within max budget");
    } else {
      gaps.push(`Price ${price.toLocaleString()} exceeds max budget ${budgetMax.toLocaleString()}`);
    }
  } else if (budgetMax != null && price == null) {
    gaps.push("Premises has no price to compare against budget");
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
    gaps.push("Premises has no area recorded");
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
      gaps.push("Premises has no capacity recorded");
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

  if (moveIn) {
    if (!row.available_date) {
      score += 5;
      gaps.push("No available date on premises");
    } else if (row.available_date.slice(0, 10) <= moveIn) {
      score += 15;
      reasons.push("Available by move-in date");
    } else {
      gaps.push(`Available ${row.available_date.slice(0, 10)} after move-in ${moveIn}`);
    }
  } else {
    score += 5;
  }

  if (isPremisesAvailable(row)) {
    score += 10;
    reasons.push("Premises is available");
  }

  const category = row.property_category ?? "";
  const spaceForm = row.space_form ?? "";
  if (category) {
    reasons.unshift(`Category: ${category}${spaceForm ? ` · ${spaceForm}` : ""}`);
  }

  return {
    property_id: 0,
    premises_id: row.premises_id,
    premises_business_id: row.premises_business_id,
    match_score: Math.min(100, score),
    match_reasons: reasons,
    match_gaps: gaps,
    display_label: premisesDisplayLabel(row),
    floor: row.floor,
    unit: row.unit,
    area_sqft: row.area_sqft,
    capacity_pax: row.capacity_pax,
    building_name: row.building_name,
    building_district: row.building_district,
    property_category: category,
    operating_model: row.operating_model ?? "",
    space_form: spaceForm,
    listing_intent: (row.listing_intent ?? "lease") as MatchedProperty["listing_intent"],
    asking_rent: row.monthly_rent,
    asking_sale_price: row.asking_sale_price,
    available_date: row.available_date,
    property_status: isPremisesAvailable(row) ? "available" : "withdrawn",
  };
}

async function listPremisesCandidates(): Promise<PremisesCandidateRow[]> {
  return query<PremisesCandidateRow>(
    `SELECT ${premisesCandidateSelect}
     FROM premises_v1 pm
     JOIN properties_v1 pv ON pv.property_id = pm.property_id
     WHERE COALESCE(pm.offer_status, '') NOT IN ('Leased', 'Sold', 'Withdrawn')
       AND (
         pm.offer_status = 'Available'
         OR pm.inventory_status ILIKE '%lease%'
         OR pm.inventory_status ILIKE '%sale%'
         OR pm.inventory_status ILIKE '%rent%'
         OR (pm.monthly_rent IS NOT NULL OR pm.asking_sale_price IS NOT NULL)
       )
     ORDER BY pm.updated_at DESC`,
  );
}

export function rankPremisesMatches(opp: Opportunity, candidates: PremisesCandidateRow[]): MatchedProperty[] {
  return candidates
    .filter((row) => passesPremisesHardFilter(opp, row))
    .map((row) => scorePremisesMatch(opp, row))
    .filter((m) => m.match_score >= MATCH_SCORE_THRESHOLD)
    .sort((a, b) => b.match_score - a.match_score);
}

export async function matchPremisesForOpportunity(opportunityId: number): Promise<MatchedProperty[]> {
  const opportunity = await getOpportunity(opportunityId);
  if (!opportunity) return [];
  return matchPremisesForRequirement(opportunity);
}

export async function matchPremisesForRequirement(opportunity: Opportunity): Promise<MatchedProperty[]> {
  const candidates = await listPremisesCandidates();
  return rankPremisesMatches(opportunity, candidates);
}
