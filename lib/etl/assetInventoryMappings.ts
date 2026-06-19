import type { ListingIntent } from "@/lib/types/entities";

export type EtlAssetRow = {
  asset_id: number;
  building_id: number;
  parent_asset_id: number | null;
  asset_type: string;
  asset_status: string;
  floor: string | null;
  unit: string | null;
  suite: string | null;
  display_name_en: string;
  office_name: string | null;
  office_type: string | null;
  gross_area_sqft: string | null;
  net_area_sqft: string | null;
  capacity_pax: number | null;
  view_type: string | null;
  windows: string | null;
  source_url: string | null;
  last_verified_date: string | null;
  asset_remarks: string | null;
  operator_company_id: number | null;
  landlord_company_id: number | null;
  current_tenant_company_id: number | null;
  asset_created_at: string;
  asset_updated_at: string;
  building_name: string;
  building_property_type: string;
  building_centre_type: string | null;
};

export type EtlInventoryRow = {
  inventory_id: number;
  asset_id: number;
  operator_id: number | null;
  offer_type: string;
  inventory_status: string;
  listing_intent: string;
  monthly_rent: string | null;
  sale_price: string | null;
  rent_psf: string | null;
  management_fee: string | null;
  deposit_months: number | null;
  rent_free_period: string | null;
  contract_term_months: number | null;
  commission_rate: string | null;
  available_date: string | null;
  source_file: string | null;
  inventory_remarks: string | null;
  inventory_updated_at: string;
};

export type MappedPropertyRow = {
  id: number;
  building_id: number;
  floor: string | null;
  unit: string | null;
  property_category: string;
  operating_model: string;
  listing_intent: ListingIntent;
  space_form: string;
  occupancy_status: string | null;
  area_sqft: number | null;
  capacity_pax: number | null;
  operator_company_id: number | null;
  landlord_company_id: number | null;
  current_tenant_company_id: number | null;
  asking_rent: number | null;
  asking_sale_price: number | null;
  rent_psf: number | null;
  management_fee: number | null;
  deposit_months: number | null;
  rent_free_period: string | null;
  contract_term_months: number | null;
  commission_rate: number | null;
  available_date: string | null;
  specification: string | null;
  status: string;
  source: string | null;
  source_date: string | null;
  last_updated_date: string | null;
  remarks: string | null;
  legacy_asset_id: number;
  legacy_inventory_id: number | null;
  created_at: string;
  updated_at: string;
};

export type EtlReviewRow = {
  asset_id: number;
  reason: string;
  detail: string;
  building_name: string;
  floor: string | null;
  unit: string | null;
  inventory_ids: string;
};

function parseDecimal(v: string | null): number | null {
  if (v == null || v.trim() === "") return null;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

export function mapSpaceForm(
  asset: EtlAssetRow,
  inventory: EtlInventoryRow | null,
): { value: string; ambiguous: boolean } {
  const offerType = inventory?.offer_type ?? "";
  if (asset.asset_type === "Enbloc" || offerType === "Enbloc") {
    const categoryHint = mapPropertyCategory(asset, inventory);
    if (categoryHint.value === "Investment") {
      return { value: "Portfolio", ambiguous: false };
    }
    return { value: "Building", ambiguous: true };
  }
  if (asset.asset_type === "Floor" || offerType === "Floor") {
    return { value: "Whole Floor", ambiguous: false };
  }
  if (asset.asset_type === "Suite" || asset.suite?.trim()) {
    return { value: "Suite", ambiguous: false };
  }
  if (asset.asset_type === "Room") {
    return { value: "Room", ambiguous: false };
  }
  if (asset.building_property_type === "Industrial Building") {
    return { value: "Warehouse", ambiguous: false };
  }
  if (asset.building_property_type === "Residential") {
    return { value: "Apartment", ambiguous: false };
  }
  if (offerType === "Serviced Office" || offerType === "Shared Office") {
    return { value: "Room", ambiguous: false };
  }
  return { value: "Unit", ambiguous: asset.asset_type !== "Unit" };
}

export function mapPropertyCategory(
  asset: EtlAssetRow,
  inventory: EtlInventoryRow | null,
): { value: string; ambiguous: boolean } {
  const offerType = inventory?.offer_type ?? "";
  if (offerType === "Enbloc" || asset.asset_type === "Enbloc") {
    return { value: "Investment", ambiguous: false };
  }
  switch (asset.building_property_type) {
    case "Industrial Building":
      return { value: "Industrial", ambiguous: false };
    case "Residential":
      return { value: "Residential", ambiguous: false };
    case "Hotel":
      return { value: "Hotel", ambiguous: false };
    default:
      break;
  }
  if (offerType === "Serviced Office" || offerType === "Shared Office") {
    return { value: "Office", ambiguous: false };
  }
  return { value: "Office", ambiguous: asset.building_property_type !== "Commercial Building" };
}

export function mapOperatingModel(
  asset: EtlAssetRow,
  inventory: EtlInventoryRow | null,
): { value: string; ambiguous: boolean } {
  const offerType = inventory?.offer_type ?? "";
  if (offerType === "Serviced Office") return { value: "Serviced Office", ambiguous: false };
  if (offerType === "Shared Office") return { value: "Shared Office", ambiguous: false };
  if (asset.building_centre_type === "Serviced Office") {
    return { value: "Serviced Office", ambiguous: !inventory };
  }
  if (asset.building_centre_type === "Shared Office") {
    return { value: "Shared Office", ambiguous: !inventory };
  }
  if (asset.building_property_type === "Hotel") {
    return { value: "Hotel Operation", ambiguous: false };
  }
  if (asset.building_property_type === "Residential") {
    const officeName = asset.office_name?.toLowerCase() ?? "";
    if (officeName.includes("serviced") || officeName.includes("somerset")) {
      return { value: "Serviced Apartment", ambiguous: true };
    }
    return { value: "Conventional Space", ambiguous: true };
  }
  return { value: "Conventional Space", ambiguous: false };
}

export function mapListingIntent(inventory: EtlInventoryRow | null): ListingIntent {
  if (!inventory) return "lease";
  const rent = parseDecimal(inventory.monthly_rent);
  const sale = parseDecimal(inventory.sale_price);
  if (rent != null && sale != null) return "both";
  if (inventory.listing_intent === "sale" || (sale != null && rent == null)) return "sale";
  return "lease";
}

export function mapOccupancyStatus(
  asset: EtlAssetRow,
  inventory: EtlInventoryRow | null,
): string | null {
  if (inventory?.inventory_status === "leased") return "Tenanted";
  if (asset.asset_status === "inactive" || asset.asset_status === "archived") {
    return "Owner Occupied";
  }
  if (inventory?.inventory_status === "available" || inventory?.inventory_status === "proposed") {
    return "Vacant";
  }
  return "Vacant";
}

export function mapMarketableStatus(
  asset: EtlAssetRow,
  inventory: EtlInventoryRow | null,
): string {
  if (asset.asset_status === "archived" || asset.asset_status === "inactive") {
    return "archived";
  }
  if (!inventory) return "available";
  switch (inventory.inventory_status) {
    case "leased":
      return inventory.listing_intent === "sale" ? "sold" : "leased";
    case "withdrawn":
      return "withdrawn";
    case "proposed":
      return "proposed";
    default:
      return "available";
  }
}

export function buildSpecification(asset: EtlAssetRow, parentAssetId: number | null): string | null {
  const parts: string[] = [];
  if (asset.display_name_en?.trim()) parts.push(`Display: ${asset.display_name_en.trim()}`);
  if (asset.office_name?.trim()) parts.push(`Office/centre: ${asset.office_name.trim()}`);
  if (asset.office_type?.trim()) parts.push(`Office type: ${asset.office_type.trim()}`);
  if (asset.view_type?.trim()) parts.push(`View: ${asset.view_type.trim()}`);
  if (asset.windows?.trim()) parts.push(`Windows: ${asset.windows.trim()}`);
  if (parentAssetId != null) parts.push(`Legacy parent asset #${parentAssetId}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function mergeRemarks(
  assetRemarks: string | null,
  inventoryRemarks: string | null,
): string | null {
  const parts = [assetRemarks?.trim(), inventoryRemarks?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join("\n\n") : null;
}

export function pickPrimaryInventory(rows: EtlInventoryRow[]): {
  primary: EtlInventoryRow | null;
  extras: EtlInventoryRow[];
} {
  if (rows.length === 0) return { primary: null, extras: [] };
  const rank = (s: string) => {
    switch (s) {
      case "available":
        return 0;
      case "proposed":
        return 1;
      case "leased":
        return 2;
      default:
        return 3;
    }
  };
  const sorted = [...rows].sort((a, b) => {
    const dr = rank(a.inventory_status) - rank(b.inventory_status);
    if (dr !== 0) return dr;
    return b.inventory_updated_at.localeCompare(a.inventory_updated_at);
  });
  return { primary: sorted[0]!, extras: sorted.slice(1) };
}

export function mapAssetToProperty(
  asset: EtlAssetRow,
  inventory: EtlInventoryRow | null,
): MappedPropertyRow {
  const category = mapPropertyCategory(asset, inventory);
  const operatingModel = mapOperatingModel(asset, inventory);
  const spaceForm = mapSpaceForm(asset, inventory);
  const area =
    parseDecimal(asset.net_area_sqft) ?? parseDecimal(asset.gross_area_sqft);

  const updatedAt =
    inventory && inventory.inventory_updated_at > asset.asset_updated_at
      ? inventory.inventory_updated_at
      : asset.asset_updated_at;

  return {
    id: asset.asset_id,
    building_id: asset.building_id,
    floor: asset.floor,
    unit: asset.unit,
    property_category: category.value,
    operating_model: operatingModel.value,
    listing_intent: mapListingIntent(inventory),
    space_form: spaceForm.value,
    occupancy_status: mapOccupancyStatus(asset, inventory),
    area_sqft: area,
    capacity_pax: asset.capacity_pax,
    operator_company_id: asset.operator_company_id,
    landlord_company_id: asset.landlord_company_id,
    current_tenant_company_id: asset.current_tenant_company_id,
    asking_rent: inventory ? parseDecimal(inventory.monthly_rent) : null,
    asking_sale_price: inventory ? parseDecimal(inventory.sale_price) : null,
    rent_psf: inventory ? parseDecimal(inventory.rent_psf) : null,
    management_fee: inventory ? parseDecimal(inventory.management_fee) : null,
    deposit_months: inventory?.deposit_months ?? null,
    rent_free_period: inventory?.rent_free_period ?? null,
    contract_term_months: inventory?.contract_term_months ?? null,
    commission_rate: inventory ? parseDecimal(inventory.commission_rate) : null,
    available_date: inventory?.available_date?.slice(0, 10) ?? null,
    specification: buildSpecification(asset, asset.parent_asset_id),
    status: mapMarketableStatus(asset, inventory),
    source: inventory?.source_file ?? asset.source_url,
    source_date: asset.last_verified_date?.slice(0, 10) ?? null,
    last_updated_date: updatedAt.slice(0, 10),
    remarks: mergeRemarks(asset.asset_remarks, inventory?.inventory_remarks ?? null),
    legacy_asset_id: asset.asset_id,
    legacy_inventory_id: inventory?.inventory_id ?? null,
    created_at: asset.asset_created_at,
    updated_at: updatedAt,
  };
}

export function collectMappingReviews(
  asset: EtlAssetRow,
  inventory: EtlInventoryRow | null,
  extras: EtlInventoryRow[],
  operatorResolved: boolean,
  operatorId: number | null,
): EtlReviewRow[] {
  const reviews: EtlReviewRow[] = [];
  const invIds = (ids: number[]) => ids.join(";") || "—";

  if (!inventory) {
    reviews.push({
      asset_id: asset.asset_id,
      reason: "no_inventory_row",
      detail: "Asset migrated with defaults; no linked inventory/offer row.",
      building_name: asset.building_name,
      floor: asset.floor,
      unit: asset.unit,
      inventory_ids: "—",
    });
  }

  if (extras.length > 0) {
    reviews.push({
      asset_id: asset.asset_id,
      reason: "multiple_inventory_rows",
      detail: `Used primary inventory #${inventory?.inventory_id}; ${extras.length} additional row(s) not migrated.`,
      building_name: asset.building_name,
      floor: asset.floor,
      unit: asset.unit,
      inventory_ids: invIds([
        inventory?.inventory_id ?? 0,
        ...extras.map((e) => e.inventory_id),
      ].filter((id) => id > 0)),
    });
  }

  if (asset.parent_asset_id != null) {
    reviews.push({
      asset_id: asset.asset_id,
      reason: "parent_asset_hierarchy",
      detail: `Legacy parent_asset_id=${asset.parent_asset_id} noted in specification.`,
      building_name: asset.building_name,
      floor: asset.floor,
      unit: asset.unit,
      inventory_ids: inventory ? String(inventory.inventory_id) : "—",
    });
  }

  if (operatorId != null && !operatorResolved && asset.operator_company_id == null) {
    reviews.push({
      asset_id: asset.asset_id,
      reason: "operator_unresolved",
      detail: `inventory.operator_id=${operatorId} could not be matched to a company.`,
      building_name: asset.building_name,
      floor: asset.floor,
      unit: asset.unit,
      inventory_ids: inventory ? String(inventory.inventory_id) : "—",
    });
  }

  const category = mapPropertyCategory(asset, inventory);
  const operatingModel = mapOperatingModel(asset, inventory);
  const spaceForm = mapSpaceForm(asset, inventory);
  if (category.ambiguous || operatingModel.ambiguous || spaceForm.ambiguous) {
    reviews.push({
      asset_id: asset.asset_id,
      reason: "ambiguous_classification",
      detail: [
        category.ambiguous ? `category→${category.value}` : null,
        operatingModel.ambiguous ? `operating_model→${operatingModel.value}` : null,
        spaceForm.ambiguous ? `space_form→${spaceForm.value}` : null,
      ]
        .filter(Boolean)
        .join("; "),
      building_name: asset.building_name,
      floor: asset.floor,
      unit: asset.unit,
      inventory_ids: inventory ? String(inventory.inventory_id) : "—",
    });
  }

  return reviews;
}
