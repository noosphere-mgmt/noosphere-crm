import { createBuilding, getBuilding } from "@/lib/repos/buildings";
import { createCompany } from "@/lib/repos/companies";
import { query } from "@/lib/db";
import {
  createMarketableProperty,
  getMarketableProperty,
  updateMarketableProperty,
  type MarketablePropertyInput,
} from "@/lib/repos/marketableProperties";
import { computeRentPsf } from "@/lib/repos/inventory";
import type { AssetType, ListingIntent, MarketablePropertyStatus, OfferType } from "@/lib/types/entities";

export function offerTypeToOperatingModel(offerType: string): string {
  switch (offerType) {
    case "Serviced Office":
      return "Serviced Office";
    case "Shared Office":
      return "Shared Office";
    default:
      return "Conventional Space";
  }
}

export function offerTypeToSpaceForm(offerType: string, spaceType?: string | null): string {
  if (offerType === "Floor") return "Whole Floor";
  if (offerType === "Enbloc") return "Building";
  if (offerType === "Serviced Office" || offerType === "Shared Office") return "Room";
  switch (spaceType) {
    case "Floor":
      return "Whole Floor";
    case "Suite":
      return "Suite";
    case "Room":
      return "Room";
    case "Enbloc":
      return "Building";
    default:
      return "Unit";
  }
}

function buildingPropertyTypeToCategory(propertyType: string | null | undefined): string {
  switch (propertyType) {
    case "Industrial Building":
      return "Industrial";
    case "Residential":
      return "Residential";
    case "Hotel":
      return "Hotel";
    default:
      return "Office";
  }
}

function buildPropertyLabel(parts: {
  floor?: string | null;
  unit?: string | null;
  suite?: string | null;
  space_form?: string | null;
}): string {
  const loc = [parts.floor, parts.suite, parts.unit]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(" · ");
  return loc || parts.space_form?.trim() || "Property";
}

async function findMatchingProperty(input: {
  building_id: number;
  floor?: string | null;
  unit?: string | null;
}): Promise<number | null> {
  const rows = await query<{ id: string }>(
    `SELECT id::text FROM properties
     WHERE building_id = $1
       AND COALESCE(lower(trim(floor)), '') = COALESCE(lower(trim($2::text)), '')
       AND COALESCE(lower(trim(unit)), '') = COALESCE(lower(trim($3::text)), '')
     LIMIT 1`,
    [input.building_id, input.floor ?? "", input.unit ?? ""],
  );
  const id = rows[0]?.id;
  return id ? Number.parseInt(id, 10) : null;
}

async function getPropertyArea(propertyId: number): Promise<number | null> {
  const rows = await query<{ area_sqft: string | null }>(
    `SELECT area_sqft::text FROM properties WHERE id = $1`,
    [propertyId],
  );
  const area = rows[0]?.area_sqft;
  return area ? Number.parseFloat(area) : null;
}

export type QuickAddPropertyInput = {
  building_mode: "existing" | "new";
  building_id?: number | null;
  name_en?: string | null;
  district?: string | null;
  full_address_en?: string | null;
  tower_block?: string | null;
  floor_count?: number | null;
  grade?: string | null;
  mtr_station?: string | null;
  property_mode: "existing" | "new";
  property_id?: number | null;
  space_type?: AssetType | null;
  floor?: string | null;
  unit?: string | null;
  suite?: string | null;
  capacity_pax?: number | null;
  area_sqft?: number | null;
  operator_mode: "existing" | "new";
  operator_company_id?: number | null;
  operator_name?: string | null;
  offer_type: OfferType;
  asking_rent?: number | null;
  rent_psf?: number | null;
  deposit_months?: number | null;
  contract_term_months?: number | null;
  available_date?: string | null;
  commission_rate?: number | null;
  listing_intent?: ListingIntent;
  asking_sale_price?: number | null;
  status?: MarketablePropertyStatus;
  remarks?: string | null;
};

function listingFields(
  input: QuickAddPropertyInput,
  areaSqft: number | null,
  operatorCompanyId: number | null,
): Pick<
  MarketablePropertyInput,
  | "asking_rent"
  | "asking_sale_price"
  | "rent_psf"
  | "deposit_months"
  | "contract_term_months"
  | "available_date"
  | "commission_rate"
  | "listing_intent"
  | "status"
  | "remarks"
  | "operator_company_id"
> {
  return {
    asking_rent: input.asking_rent ?? null,
    asking_sale_price: input.asking_sale_price ?? null,
    rent_psf: computeRentPsf({
      monthly_rent: input.asking_rent ?? null,
      net_area_sqft: areaSqft,
      gross_area_sqft: areaSqft,
      rent_psf: input.rent_psf ?? null,
    }),
    deposit_months: input.deposit_months ?? null,
    contract_term_months: input.contract_term_months ?? null,
    available_date: input.available_date,
    commission_rate: input.commission_rate ?? null,
    listing_intent: input.listing_intent ?? "lease",
    status: input.status ?? "available",
    remarks: input.remarks,
    operator_company_id: operatorCompanyId,
  };
}

function propertyPayload(
  input: QuickAddPropertyInput,
  buildingId: number,
  propertyCategory: string,
  operatingModel: string,
  spaceForm: string,
  areaSqft: number | null,
  operatorCompanyId: number | null,
): MarketablePropertyInput {
  return {
    building_id: buildingId,
    floor: input.floor,
    unit: input.unit,
    property_category: propertyCategory,
    operating_model: operatingModel,
    space_form: spaceForm,
    occupancy_status: "Vacant",
    area_sqft: areaSqft,
    capacity_pax: input.capacity_pax ?? null,
    specification: buildPropertyLabel({
      floor: input.floor,
      unit: input.unit,
      suite: input.suite,
      space_form: spaceForm,
    }),
    source: "quick_add",
    ...listingFields(input, areaSqft, operatorCompanyId),
  };
}

export async function quickAddProperty(input: QuickAddPropertyInput): Promise<number> {
  let buildingId: number;

  if (input.building_mode === "existing") {
    if (!input.building_id) throw new Error("Select an existing building.");
    buildingId = input.building_id;
  } else {
    const name = input.name_en?.trim();
    if (!name) throw new Error("Building name is required.");
    buildingId = await createBuilding({
      name_en: name,
      district: input.district ?? "",
      full_address_en: input.full_address_en ?? "",
      tower_block: input.tower_block,
      floor_count: input.floor_count ?? null,
      grade: input.grade,
      mtr_station: input.mtr_station,
    });
  }

  const building = await getBuilding(buildingId);
  const propertyCategory = buildingPropertyTypeToCategory(building?.property_type);
  const operatingModel = offerTypeToOperatingModel(input.offer_type);
  const spaceForm = offerTypeToSpaceForm(input.offer_type, input.space_type);

  let operatorCompanyId: number | null = null;
  if (input.operator_mode === "existing") {
    operatorCompanyId = input.operator_company_id ?? null;
  } else if (input.operator_name?.trim()) {
    operatorCompanyId = await createCompany({
      company_name: input.operator_name.trim(),
      roles: ["operator"],
    });
  }

  let areaSqft = input.area_sqft ?? null;

  if (input.property_mode === "existing") {
    if (!input.property_id) throw new Error("Select an existing property.");
    const existing = await getMarketableProperty(input.property_id);
    if (!existing) throw new Error("Property not found.");
    if (existing.building_id !== buildingId) {
      throw new Error("Selected property does not belong to the selected building.");
    }
    if (areaSqft == null && existing.area_sqft) {
      areaSqft = Number.parseFloat(existing.area_sqft);
    }
    await updateMarketableProperty(
      input.property_id,
      propertyPayload(input, buildingId, propertyCategory, operatingModel, spaceForm, areaSqft, operatorCompanyId),
    );
    return input.property_id;
  }

  const existingId = await findMatchingProperty({
    building_id: buildingId,
    floor: input.floor,
    unit: input.unit,
  });

  if (existingId) {
    if (areaSqft == null) areaSqft = await getPropertyArea(existingId);
    await updateMarketableProperty(
      existingId,
      propertyPayload(input, buildingId, propertyCategory, operatingModel, spaceForm, areaSqft, operatorCompanyId),
    );
    return existingId;
  }

  return createMarketableProperty(
    propertyPayload(input, buildingId, propertyCategory, operatingModel, spaceForm, areaSqft, operatorCompanyId),
  );
}
