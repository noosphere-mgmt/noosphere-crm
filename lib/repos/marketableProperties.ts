import { query } from "@/lib/db";
import type { ListingIntent, MarketableProperty, MarketablePropertyStatus } from "@/lib/types/entities";

const propertySelect = `
  p.id, p.building_id, p.floor, p.unit,
  p.property_category, p.operating_model, p.listing_intent, p.space_form,
  p.occupancy_status, p.area_sqft::text, p.capacity_pax,
  p.operator_company_id, p.landlord_company_id, p.current_tenant_company_id,
  p.furniture, p.office_equipment, p.meeting_room, p.reception_service, p.it_network,
  p.move_in_status, p.view_type, p.fitout_condition, p.window_type,
  p.asking_rent::text, p.asking_sale_price::text, p.rent_psf::text, p.management_fee::text,
  p.deposit_months, p.rent_free_period, p.contract_term_months, p.commission_rate::text,
  p.available_date::text, p.specification, p.status,
  p.source, p.source_date::text, p.last_updated_date::text, p.remarks,
  p.external_ref, p.source_system, p.source_file, p.import_run_id,
  p.legacy_asset_id, p.legacy_inventory_id,
  p.created_at::text, p.updated_at::text,
  b.name_en AS building_name,
  b.district AS building_district
`;

const propertyFrom = `
  FROM properties p
  JOIN buildings b ON b.id = p.building_id
`;

export type MarketablePropertyInput = {
  building_id: number;
  floor?: string | null;
  unit?: string | null;
  property_category: string;
  operating_model: string;
  listing_intent: ListingIntent;
  space_form: string;
  occupancy_status?: string | null;
  area_sqft?: number | null;
  capacity_pax?: number | null;
  operator_company_id?: number | null;
  landlord_company_id?: number | null;
  current_tenant_company_id?: number | null;
  furniture?: string | null;
  office_equipment?: string | null;
  meeting_room?: string | null;
  reception_service?: string | null;
  it_network?: string | null;
  move_in_status?: string | null;
  view_type?: string | null;
  fitout_condition?: string | null;
  window_type?: string | null;
  asking_rent?: number | null;
  asking_sale_price?: number | null;
  rent_psf?: number | null;
  management_fee?: number | null;
  deposit_months?: number | null;
  rent_free_period?: string | null;
  contract_term_months?: number | null;
  commission_rate?: number | null;
  available_date?: string | null;
  specification?: string | null;
  status?: MarketablePropertyStatus;
  source?: string | null;
  source_date?: string | null;
  last_updated_date?: string | null;
  remarks?: string | null;
};

function propertyValues(input: MarketablePropertyInput) {
  const today = new Date().toISOString().slice(0, 10);
  return [
    input.building_id,
    input.floor?.trim() || null,
    input.unit?.trim() || null,
    input.property_category,
    input.operating_model,
    input.listing_intent,
    input.space_form,
    input.occupancy_status ?? null,
    input.area_sqft ?? null,
    input.capacity_pax ?? null,
    input.operator_company_id ?? null,
    input.landlord_company_id ?? null,
    input.current_tenant_company_id ?? null,
    input.furniture ?? null,
    input.office_equipment ?? null,
    input.meeting_room ?? null,
    input.reception_service ?? null,
    input.it_network ?? null,
    input.move_in_status ?? null,
    input.view_type ?? null,
    input.fitout_condition ?? null,
    input.window_type ?? null,
    input.asking_rent ?? null,
    input.asking_sale_price ?? null,
    input.rent_psf ?? null,
    input.management_fee ?? null,
    input.deposit_months ?? null,
    input.rent_free_period?.trim() || null,
    input.contract_term_months ?? null,
    input.commission_rate ?? null,
    input.available_date?.trim() || null,
    input.specification?.trim() || null,
    input.status ?? "available",
    input.source?.trim() || null,
    input.source_date?.trim() || null,
    input.last_updated_date?.trim() || today,
    input.remarks?.trim() || null,
  ];
}

export async function listMarketableProperties(): Promise<MarketableProperty[]> {
  return query<MarketableProperty>(
    `SELECT ${propertySelect} ${propertyFrom}
     ORDER BY p.updated_at DESC, p.id DESC`,
  );
}

export async function listMarketablePropertiesForBuilding(
  buildingId: number,
): Promise<MarketableProperty[]> {
  return query<MarketableProperty>(
    `SELECT ${propertySelect} ${propertyFrom}
     WHERE p.building_id = $1
     ORDER BY p.floor ASC NULLS LAST, p.unit ASC NULLS LAST, p.id ASC`,
    [buildingId],
  );
}

export async function getMarketableProperty(id: number): Promise<MarketableProperty | null> {
  const rows = await query<MarketableProperty>(
    `SELECT ${propertySelect} ${propertyFrom} WHERE p.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function getMarketablePropertyByLegacyInventoryId(
  legacyInventoryId: number,
): Promise<MarketableProperty | null> {
  const rows = await query<MarketableProperty>(
    `SELECT ${propertySelect} ${propertyFrom} WHERE p.legacy_inventory_id = $1 LIMIT 1`,
    [legacyInventoryId],
  );
  return rows[0] ?? null;
}

export async function createMarketableProperty(input: MarketablePropertyInput): Promise<number> {
  const rows = await query<{ id: string }>(
    `INSERT INTO properties (
       building_id, floor, unit,
       property_category, operating_model, listing_intent, space_form,
       occupancy_status, area_sqft, capacity_pax,
       operator_company_id, landlord_company_id, current_tenant_company_id,
       furniture, office_equipment, meeting_room, reception_service, it_network, move_in_status,
       view_type, fitout_condition, window_type,
       asking_rent, asking_sale_price, rent_psf, management_fee,
       deposit_months, rent_free_period, contract_term_months, commission_rate,
       available_date, specification, status,
       source, source_date, last_updated_date, remarks
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22,
       $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37
     )
     RETURNING id::text AS id`,
    propertyValues(input),
  );
  return Number.parseInt(rows[0]!.id, 10);
}

export async function updateMarketableProperty(
  id: number,
  input: MarketablePropertyInput,
): Promise<void> {
  await query(
    `UPDATE properties SET
       building_id = $2, floor = $3, unit = $4,
       property_category = $5, operating_model = $6, listing_intent = $7, space_form = $8,
       occupancy_status = $9, area_sqft = $10, capacity_pax = $11,
       operator_company_id = $12, landlord_company_id = $13, current_tenant_company_id = $14,
       furniture = $15, office_equipment = $16, meeting_room = $17, reception_service = $18,
       it_network = $19, move_in_status = $20,
       view_type = $21, fitout_condition = $22, window_type = $23,
       asking_rent = $24, asking_sale_price = $25, rent_psf = $26, management_fee = $27,
       deposit_months = $28, rent_free_period = $29, contract_term_months = $30, commission_rate = $31,
       available_date = $32, specification = $33, status = $34,
       source = $35, source_date = $36, last_updated_date = $37, remarks = $38
     WHERE id = $1`,
    [id, ...propertyValues(input)],
  );
}

export async function deleteMarketableProperty(id: number): Promise<void> {
  await query(`DELETE FROM properties WHERE id = $1`, [id]);
}
