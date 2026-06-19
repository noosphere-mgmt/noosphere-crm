/**
 * @deprecated Inventory-based matching retired. Use `@/lib/matchProperties` instead.
 */
import type { MatchedOffer, MatchedProperty, Opportunity } from "@/lib/types/entities";
import {
  matchPropertiesForOpportunity,
  matchPropertiesForRequirement,
} from "@/lib/matchProperties";

function toMatchedOffer(m: MatchedProperty): MatchedOffer {
  return {
    offer_id: m.property_id,
    match_score: m.match_score,
    match_reasons: m.match_reasons,
    match_gaps: m.match_gaps,
    asset_display_name: m.display_label,
    asset_floor: m.floor,
    asset_unit: m.unit,
    asset_net_area_sqft: m.area_sqft,
    asset_capacity_pax: m.capacity_pax,
    building_name: m.building_name,
    building_district: m.building_district,
    offer_type: m.space_form as MatchedOffer["offer_type"],
    listing_intent: m.listing_intent,
    monthly_rent: m.asking_rent,
    sale_price: m.asking_sale_price,
    available_date: m.available_date,
    offer_status: m.property_status as MatchedOffer["offer_status"],
  };
}

/** @deprecated Use matchPropertiesForOpportunity */
export async function matchOffersForOpportunity(opportunityId: number): Promise<MatchedOffer[]> {
  const matches = await matchPropertiesForOpportunity(opportunityId);
  return matches.map(toMatchedOffer);
}

/** @deprecated Use matchPropertiesForRequirement */
export async function matchOffersForRequirement(opportunity: Opportunity): Promise<MatchedOffer[]> {
  const matches = await matchPropertiesForRequirement(opportunity);
  return matches.map(toMatchedOffer);
}
