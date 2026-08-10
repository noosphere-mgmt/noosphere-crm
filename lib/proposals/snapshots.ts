import path from "node:path";
import { access } from "node:fs/promises";
import { buildPricingSnapshot, type NetEffectiveRentInput } from "@/lib/pricing/netEffectiveRent";
import type { PremisesRelationshipLine } from "@/lib/v1ListValues";
import {
  resolveLocalizedBuildingName,
} from "@/lib/proposals/i18n";
import type {
  Opportunity,
  OpportunityProposedPremises,
  ProposalLanguage,
  ProposalMediaSnapshot,
  ProposalPremisesSnapshot,
  ProposalPricingSnapshot,
} from "@/lib/types/entities";

export type PremisesWithBuilding = NetEffectiveRentInput & {
  premises_id: string;
  business_id: string | null;
  property_id: string;
  property_name_en: string | null;
  property_name_zh: string | null;
  property_category: string | null;
  space_form: string | null;
  floor: string | null;
  unit: string | null;
  capacity_pax: number | null;
  operating_model: string | null;
  gross_area_sqft: string | null;
  net_area_sqft: string | null;
  source_file: string | null;
  source_url: string | null;
  relationship_lines: PremisesRelationshipLine[] | null;
  contract_term_months: number | null;
  bldg_name_en: string | null;
  bldg_name_zh: string | null;
  bldg_name_cn: string | null;
  district_en: string | null;
  building_business_id: string | null;
};

function premisesDisplayLabel(row: PremisesWithBuilding): string {
  const loc = [row.floor, row.unit].filter(Boolean).join(" · ");
  if (loc) return loc;
  if (row.property_name_en?.trim()) return row.property_name_en.trim();
  return row.bldg_name_en ?? "Premises";
}

export function buildPremisesSnapshot(
  row: PremisesWithBuilding,
  language: ProposalLanguage,
): ProposalPremisesSnapshot {
  const area = row.net_area_sqft ?? row.gross_area_sqft;
  return {
    captured_at: new Date().toISOString(),
    premises_id: row.premises_id,
    premises_business_id: row.business_id,
    building_business_id: row.building_business_id,
    building_name: resolveLocalizedBuildingName(
      language,
      row.bldg_name_en,
      row.bldg_name_zh,
      row.bldg_name_cn,
    ),
    building_name_zh: row.bldg_name_zh,
    building_name_cn: row.bldg_name_cn,
    district: row.district_en,
    floor: row.floor,
    unit: row.unit,
    display_label: premisesDisplayLabel(row),
    property_category: row.property_category,
    space_form: row.space_form,
    area_sqft: area,
    capacity_pax: row.capacity_pax,
    operating_model: row.operating_model,
  };
}

function mediaRoot(): string {
  return process.env.PROPOSAL_MEDIA_ROOT?.trim() || path.join(process.cwd(), "data", "media");
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

export async function buildMediaSnapshot(row: PremisesWithBuilding): Promise<ProposalMediaSnapshot> {
  const items: ProposalMediaSnapshot["items"] = [];
  const captured_at = new Date().toISOString();

  if (row.source_url?.trim()) {
    items.push({
      kind: "brochure",
      url: row.source_url.trim(),
      source: "premises_source_url",
    });
  }

  if (row.source_file?.trim()) {
    const abs = path.isAbsolute(row.source_file)
      ? row.source_file
      : path.join(mediaRoot(), row.source_file.trim());
    if (await fileExists(abs)) {
      items.push({
        kind: "photo",
        url: abs,
        source: "premises_source_file",
      });
    }
  }

  for (const line of row.relationship_lines ?? []) {
    if (items.length >= 3) break;
    if (line.source_url?.trim()) {
      items.push({
        kind: "brochure",
        url: line.source_url.trim(),
        source: "relationship_line",
      });
    }
  }

  return { captured_at, items: items.slice(0, 3) };
}

export function buildItemSnapshots(
  premises: PremisesWithBuilding,
  opportunity: Opportunity,
  language: ProposalLanguage,
  shortlistLine?: OpportunityProposedPremises | null,
  media?: ProposalMediaSnapshot,
): {
  pricing_snapshot: ProposalPricingSnapshot;
  premises_snapshot: ProposalPremisesSnapshot;
  media_snapshot: ProposalMediaSnapshot;
  display_rent: string;
  net_effective_rent: number | null;
  total_initial_cost: number | null;
} {
  const overrides =
    shortlistLine?.proposed_price != null
      ? {
          display_rent: `${shortlistLine.proposed_price} ${premises.currency ?? "HKD"}/mo`,
        }
      : undefined;

  const pricing_snapshot = buildPricingSnapshot(premises, opportunity, overrides);
  const premises_snapshot = buildPremisesSnapshot(premises, language);
  const media_snapshot = media ?? { captured_at: new Date().toISOString(), items: [] };

  const display_rent = pricing_snapshot.overrides?.display_rent ?? pricing_snapshot.display_rent;
  const net_effective_rent = pricing_snapshot.net_effective_rent;
  const total_initial_cost = pricing_snapshot.total_initial_cost;

  return {
    pricing_snapshot,
    premises_snapshot,
    media_snapshot,
    display_rent,
    net_effective_rent,
    total_initial_cost,
  };
}

export const PROMOTABLE_SHORTLIST_STATUSES = new Set([
  "shortlisted",
  "presented",
  "viewing",
  "proposed",
  "negotiation",
]);
