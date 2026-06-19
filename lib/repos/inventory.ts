import { query } from "@/lib/db";
import type { Inventory, InventoryStatus, ListingIntent, OfferType } from "@/lib/types/entities";

const inventorySelect = `
  i.id, i.asset_id, i.property_id, i.building_id, i.operator_id, i.offer_type, i.status,
  i.monthly_rent::text, i.rent_psf::text, i.management_fee::text, i.government_rates::text,
  i.deposit_months, i.rent_free_period, i.contract_term_months,
  i.available_date::text, i.commission_rate::text, i.source_file,
  i.listing_intent, i.sale_price::text, i.remarks,
  i.created_at::text, i.updated_at::text,
  a.display_name_en AS asset_display_name,
  a.floor AS asset_floor,
  a.unit AS asset_unit,
  a.net_area_sqft::text AS asset_net_area_sqft,
  COALESCE(b.name_en, a.display_name_en) AS property_name,
  b.name_en AS building_name,
  COALESCE(NULLIF(b.tower_block, ''), 'Building #' || b.id::text) AS building_label,
  o.name AS operator_name
`;

const inventoryFrom = `
  FROM inventory i
  JOIN assets a ON a.id = i.asset_id
  LEFT JOIN buildings b ON b.id = i.building_id
  LEFT JOIN operators o ON o.id = i.operator_id
`;

export type InventoryInput = {
  asset_id: number;
  property_id?: number | null;
  building_id?: number | null;
  operator_id?: number | null;
  offer_type: OfferType;
  status?: InventoryStatus;
  monthly_rent?: number | null;
  rent_psf?: number | null;
  management_fee?: number | null;
  government_rates?: number | null;
  deposit_months?: number | null;
  rent_free_period?: string | null;
  contract_term_months?: number | null;
  available_date?: string | null;
  commission_rate?: number | null;
  source_file?: string | null;
  listing_intent?: ListingIntent;
  sale_price?: number | null;
  remarks?: string | null;
};

function inventoryValues(input: InventoryInput) {
  return [
    input.asset_id,
    input.property_id ?? null,
    input.building_id ?? null,
    input.operator_id ?? null,
    input.offer_type,
    input.status ?? "available",
    input.monthly_rent ?? null,
    input.rent_psf ?? null,
    input.management_fee ?? null,
    input.government_rates ?? null,
    input.deposit_months ?? null,
    input.rent_free_period?.trim() || null,
    input.contract_term_months ?? null,
    input.available_date?.trim() || null,
    input.commission_rate ?? null,
    input.source_file?.trim() || null,
    input.listing_intent ?? "lease",
    input.sale_price ?? null,
    input.remarks?.trim() || null,
  ];
}

export async function listInventory(): Promise<Inventory[]> {
  return query<Inventory>(
    `SELECT ${inventorySelect} ${inventoryFrom} ORDER BY i.updated_at DESC, i.id DESC`,
  );
}

export async function listInventoryForCompany(companyId: number): Promise<Inventory[]> {
  return query<Inventory>(
    `SELECT ${inventorySelect} ${inventoryFrom}
     WHERE a.operator_company_id = $1
        OR a.landlord_company_id = $1
        OR a.current_tenant_company_id = $1
     ORDER BY i.updated_at DESC, i.id DESC`,
    [companyId],
  );
}

export async function getInventoryItem(id: number): Promise<Inventory | null> {
  const rows = await query<Inventory>(
    `SELECT ${inventorySelect} ${inventoryFrom} WHERE i.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function createInventory(input: InventoryInput): Promise<number> {
  const rows = await query<{ id: string }>(
    `INSERT INTO inventory (
       asset_id, property_id, building_id, operator_id, offer_type, status,
       monthly_rent, rent_psf, management_fee, government_rates,
       deposit_months, rent_free_period, contract_term_months,
       available_date, commission_rate, source_file,
       listing_intent, sale_price, remarks
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
     )
     RETURNING id::text AS id`,
    inventoryValues(input),
  );
  return Number.parseInt(rows[0]!.id, 10);
}

export async function updateInventory(
  id: number,
  input: InventoryInput & { status: InventoryStatus; listing_intent: ListingIntent },
): Promise<void> {
  await query(
    `UPDATE inventory SET
       asset_id = $2, property_id = $3, building_id = $4, operator_id = $5,
       offer_type = $6, status = $7,
       monthly_rent = $8, rent_psf = $9, management_fee = $10, government_rates = $11,
       deposit_months = $12, rent_free_period = $13, contract_term_months = $14,
       available_date = $15, commission_rate = $16, source_file = $17,
       listing_intent = $18, sale_price = $19, remarks = $20
     WHERE id = $1`,
    [id, ...inventoryValues(input)],
  );
}

export async function deleteInventory(id: number): Promise<void> {
  await query(`DELETE FROM inventory WHERE id = $1`, [id]);
}

export function computeRentPsf(input: {
  monthly_rent?: number | null;
  net_area_sqft?: number | null;
  gross_area_sqft?: number | null;
  rent_psf?: number | null;
}): number | null {
  if (input.rent_psf != null) return input.rent_psf;
  if (input.monthly_rent == null) return null;
  const area = input.net_area_sqft ?? input.gross_area_sqft;
  if (area == null || area <= 0) return null;
  return Math.round((input.monthly_rent / area) * 100) / 100;
}

export async function getAssetAreaForRentPsf(assetId: number): Promise<{
  net_area_sqft: number | null;
  gross_area_sqft: number | null;
}> {
  const rows = await query<{ net_area_sqft: string | null; gross_area_sqft: string | null }>(
    `SELECT net_area_sqft::text, gross_area_sqft::text FROM assets WHERE id = $1`,
    [assetId],
  );
  const row = rows[0];
  if (!row) return { net_area_sqft: null, gross_area_sqft: null };
  return {
    net_area_sqft: row.net_area_sqft ? Number.parseFloat(row.net_area_sqft) : null,
    gross_area_sqft: row.gross_area_sqft ? Number.parseFloat(row.gross_area_sqft) : null,
  };
}

export async function resolveInventoryLocationFromAsset(assetId: number): Promise<{
  property_id: number | null;
  building_id: number;
}> {
  const rows = await query<{ property_id: string | null; building_id: string }>(
    `SELECT property_id::text, building_id::text FROM assets WHERE id = $1`,
    [assetId],
  );
  const row = rows[0];
  if (!row) throw new Error("Space not found.");
  return {
    property_id: row.property_id ? Number.parseInt(row.property_id, 10) : null,
    building_id: Number.parseInt(row.building_id, 10),
  };
}
