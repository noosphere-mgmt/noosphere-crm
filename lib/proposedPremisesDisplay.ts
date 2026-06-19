import { formatMoney } from "@/lib/formatCurrency";
import { getPremisesRowPriceDisplay, monthlyRentFieldLabel } from "@/lib/premisesCommercial";
import { formatListingStatus, normalizeListingIntent } from "@/lib/premisesListing";
import type { OpportunityProposedPremises } from "@/lib/types/entities";

function isSaleListing(row: Pick<OpportunityProposedPremises, "inventory_status">): boolean {
  return row.inventory_status?.toLowerCase().includes("sale") ?? false;
}

function parsePriceAmount(value: string | null | undefined): number | null {
  if (!value?.trim()) return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

/** Listing price from premises when no proposal override is stored. */
export function proposedPremisesListingPrice(
  row: Pick<OpportunityProposedPremises, "monthly_rent" | "asking_sale_price" | "inventory_status">,
): string {
  if (isSaleListing(row) && row.asking_sale_price?.trim()) return row.asking_sale_price;
  if (row.monthly_rent?.trim()) return row.monthly_rent;
  return "";
}

/** Price shown/edited on proposal lines — falls back to premises listing price. */
export function proposedPremisesEffectivePrice(
  row: Pick<
    OpportunityProposedPremises,
    "proposed_price" | "monthly_rent" | "asking_sale_price" | "inventory_status"
  >,
): string {
  const proposed = parsePriceAmount(row.proposed_price);
  if (proposed != null && proposed > 0) return String(proposed);
  return proposedPremisesListingPrice(row);
}

export function proposedPremisesEffectiveTourDate(
  row: Pick<OpportunityProposedPremises, "tour_date" | "proposed_date" | "site_tour_activity_date">,
): string {
  return (
    row.tour_date?.slice(0, 10) ??
    row.site_tour_activity_date?.slice(0, 10) ??
    row.proposed_date?.slice(0, 10) ??
    ""
  );
}

export function proposedPremisesTourDateSource(
  row: Pick<OpportunityProposedPremises, "tour_date" | "site_tour_activity_date">,
): "stored" | "activity" | null {
  if (row.tour_date?.slice(0, 10)) return "stored";
  if (row.site_tour_activity_date?.slice(0, 10)) return "activity";
  return null;
}

export function formatProposedPremisesListMeta(
  row: Pick<OpportunityProposedPremises, "gross_area_sqft" | "workstation_count" | "capacity_pax">,
): string {
  const parts: string[] = [];
  if (row.gross_area_sqft) parts.push(`${row.gross_area_sqft} sq ft`);
  if (row.workstation_count) parts.push(`${row.workstation_count} desks`);
  else if (row.capacity_pax) parts.push(`${row.capacity_pax} pax`);
  return parts.join(" · ");
}

export function formatProposedPremisesLabel(row: Pick<OpportunityProposedPremises, "building_name" | "floor" | "unit">): string {
  const space = [row.floor, row.unit].filter(Boolean).join(" / ");
  const building = row.building_name?.trim();
  if (building && space) return `${building} · ${space}`;
  return building || space || "—";
}

export function formatProposedPremisesSpace(row: Pick<OpportunityProposedPremises, "floor" | "unit">): string {
  return [row.floor, row.unit].filter(Boolean).join(" / ") || "—";
}

export function formatProposedPremisesArea(row: Pick<OpportunityProposedPremises, "gross_area_sqft">): string {
  return row.gross_area_sqft ? `${row.gross_area_sqft} sq ft` : "—";
}

export function formatProposedPremisesAskingPrice(
  row: Pick<
    OpportunityProposedPremises,
    "inventory_status" | "monthly_rent" | "asking_sale_price" | "currency" | "offer_type"
  >,
): string {
  const { price } = getPremisesRowPriceDisplay({
    inventory_status: row.inventory_status ?? null,
    monthly_rent: row.monthly_rent ?? null,
    rent_psf: null,
    asking_sale_price: row.asking_sale_price ?? null,
    sale_price_psf: null,
    currency: row.currency ?? null,
  });
  if (price !== "—") return price;
  const isSale =
    row.offer_type?.toLowerCase().includes("sale") || row.inventory_status?.toLowerCase().includes("sale");
  if (isSale && row.asking_sale_price) return formatMoney(row.asking_sale_price, row.currency);
  if (row.monthly_rent) return `${formatMoney(row.monthly_rent, row.currency)}/mo`;
  return "—";
}

export function formatProposedPremisesProposedPrice(
  row: Pick<
    OpportunityProposedPremises,
    "proposed_price" | "currency" | "inventory_status" | "monthly_rent" | "asking_sale_price"
  >,
): string {
  const amount = proposedPremisesEffectivePrice(row);
  if (!amount) return "—";
  const isSale = isSaleListing(row);
  const formatted = formatMoney(amount, row.currency);
  if (isSale) return formatted;
  return `${formatted}/mo`;
}

export function proposedPremisesPriceFieldLabel(
  row: Pick<OpportunityProposedPremises, "operating_model" | "inventory_status">,
): string {
  if (isSaleListing(row)) return "Proposed sale price";
  if (monthlyRentFieldLabel(row.operating_model).includes("Package")) return "Proposed package price";
  return "Proposed price";
}

export function proposedPremisesListingRemarks(
  row: Pick<OpportunityProposedPremises, "remarks" | "advisor_comment" | "client_comment">,
): string {
  return row.remarks?.trim() || row.advisor_comment?.trim() || row.client_comment?.trim() || "";
}

export function formatProposedPremisesListingIntent(
  row: Pick<OpportunityProposedPremises, "inventory_status" | "offer_type">,
): string {
  return normalizeListingIntent(row.inventory_status) ?? row.offer_type?.trim() ?? "—";
}

export function formatProposedPremisesTourDate(
  row: Pick<OpportunityProposedPremises, "tour_date" | "proposed_date" | "site_tour_activity_date">,
): string {
  const date = proposedPremisesEffectiveTourDate(row);
  return date || "—";
}

export function formatProposedPremisesListingStatus(
  row: Pick<OpportunityProposedPremises, "offer_status">,
): string {
  return formatListingStatus(row.offer_status);
}

export function proposedPremisesPropertiesHref(premisesId: string, opportunityId?: number): string {
  const params = new URLSearchParams();
  params.set("premises", premisesId);
  if (opportunityId != null) {
    params.set("return_to", `/admin/opportunities/${opportunityId}?tab=premises`);
  }
  const qs = params.toString();
  return qs ? `/admin/properties?${qs}` : "/admin/properties";
}
