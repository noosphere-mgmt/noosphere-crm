import { query } from "@/lib/db";
import type { Asset, AssetStatus, AssetType, WindowType } from "@/lib/types/entities";

const assetSelect = `
  a.id, a.asset_code, a.building_id, a.property_id, a.parent_asset_id,
  a.asset_type, a.asset_status, a.floor, a.unit, a.suite,
  a.display_name_en, a.display_name_zh, a.office_name,
  a.gross_area_sqft::text, a.net_area_sqft::text, a.capacity_pax,
  a.view_type, a.windows, a.office_type, a.source_url,
  a.last_verified_date::text, a.remarks,
  a.operator_company_id, a.landlord_company_id, a.current_tenant_company_id,
  a.created_at::text, a.updated_at::text,
  COALESCE(NULLIF(b.tower_block, ''), 'Building #' || b.id::text) AS building_label,
  b.name_en AS building_name,
  b.name_en AS property_name,
  pa.display_name_en AS parent_display_name,
  op_co.company_name AS operator_company_name,
  ll_co.company_name AS landlord_company_name,
  tn_co.company_name AS tenant_company_name
`;

const assetFrom = `
  FROM assets a
  JOIN buildings b ON b.id = a.building_id
  LEFT JOIN assets pa ON pa.id = a.parent_asset_id
  LEFT JOIN companies op_co ON op_co.id = a.operator_company_id
  LEFT JOIN companies ll_co ON ll_co.id = a.landlord_company_id
  LEFT JOIN companies tn_co ON tn_co.id = a.current_tenant_company_id
`;

export type AssetInput = {
  building_id: number;
  property_id?: number | null;
  parent_asset_id?: number | null;
  asset_type: AssetType;
  asset_status?: AssetStatus;
  floor?: string | null;
  unit?: string | null;
  suite?: string | null;
  display_name_en: string;
  display_name_zh?: string | null;
  office_name?: string | null;
  gross_area_sqft?: number | null;
  net_area_sqft?: number | null;
  capacity_pax?: number | null;
  view_type?: string | null;
  windows?: WindowType | null;
  office_type?: string | null;
  source_url?: string | null;
  last_verified_date?: string | null;
  remarks?: string | null;
  operator_company_id?: number | null;
  landlord_company_id?: number | null;
  current_tenant_company_id?: number | null;
};

function assetValues(input: AssetInput) {
  return [
    input.building_id,
    input.property_id ?? null,
    input.parent_asset_id ?? null,
    input.asset_type,
    input.asset_status ?? "active",
    input.floor?.trim() || null,
    input.unit?.trim() || null,
    input.suite?.trim() || null,
    input.display_name_en.trim(),
    input.display_name_zh?.trim() || null,
    input.office_name?.trim() || null,
    input.gross_area_sqft ?? null,
    input.net_area_sqft ?? null,
    input.capacity_pax ?? null,
    input.view_type?.trim() || null,
    input.windows ?? null,
    input.office_type?.trim() || null,
    input.source_url?.trim() || null,
    input.last_verified_date?.trim() || null,
    input.remarks?.trim() || null,
    input.operator_company_id ?? null,
    input.landlord_company_id ?? null,
    input.current_tenant_company_id ?? null,
  ];
}

export function buildAssetDisplayName(parts: {
  office_name?: string | null;
  floor?: string | null;
  unit?: string | null;
  suite?: string | null;
  asset_type?: string | null;
}): string {
  if (parts.office_name?.trim()) return parts.office_name.trim();
  const location = [parts.floor, parts.suite, parts.unit]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(" · ");
  if (location) return location;
  return parts.asset_type?.trim() || "Asset";
}

export function offerTypeToAssetType(offerType: string): AssetType {
  switch (offerType) {
    case "Floor":
      return "Floor";
    case "Enbloc":
      return "Enbloc";
    case "Serviced Office":
    case "Shared Office":
      return "Room";
    default:
      return "Unit";
  }
}

export async function listAssets(): Promise<Asset[]> {
  return query<Asset>(
    `SELECT ${assetSelect} ${assetFrom} ORDER BY b.name_en ASC, a.display_name_en ASC, a.id ASC`,
  );
}

export async function listAssetsForBuilding(buildingId: number): Promise<Asset[]> {
  return query<Asset>(
    `SELECT ${assetSelect} ${assetFrom} WHERE a.building_id = $1 ORDER BY a.display_name_en ASC, a.id ASC`,
    [buildingId],
  );
}

export async function listAssetsForCompany(companyId: number): Promise<Asset[]> {
  return query<Asset>(
    `SELECT ${assetSelect} ${assetFrom}
     WHERE a.operator_company_id = $1
        OR a.landlord_company_id = $1
        OR a.current_tenant_company_id = $1
     ORDER BY b.name_en ASC, a.display_name_en ASC, a.id ASC`,
    [companyId],
  );
}

export async function getAsset(id: number): Promise<Asset | null> {
  const rows = await query<Asset>(
    `SELECT ${assetSelect} ${assetFrom} WHERE a.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function createAsset(input: AssetInput): Promise<number> {
  const rows = await query<{ id: string }>(
    `INSERT INTO assets (
       building_id, property_id, parent_asset_id, asset_type, asset_status,
       floor, unit, suite, display_name_en, display_name_zh, office_name,
       gross_area_sqft, net_area_sqft, capacity_pax, view_type, windows,
       office_type, source_url, last_verified_date, remarks,
       operator_company_id, landlord_company_id, current_tenant_company_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
     RETURNING id::text AS id`,
    assetValues(input),
  );
  return Number.parseInt(rows[0]!.id, 10);
}

export async function updateAsset(id: number, input: AssetInput): Promise<void> {
  await query(
    `UPDATE assets SET
       building_id = $2, property_id = $3, parent_asset_id = $4, asset_type = $5, asset_status = $6,
       floor = $7, unit = $8, suite = $9, display_name_en = $10, display_name_zh = $11, office_name = $12,
       gross_area_sqft = $13, net_area_sqft = $14, capacity_pax = $15, view_type = $16, windows = $17,
       office_type = $18, source_url = $19, last_verified_date = $20, remarks = $21,
       operator_company_id = $22, landlord_company_id = $23, current_tenant_company_id = $24
     WHERE id = $1`,
    [id, ...assetValues(input)],
  );
}

export async function deleteAsset(id: number): Promise<void> {
  await query(`DELETE FROM assets WHERE id = $1`, [id]);
}

export async function listAssetOptions(): Promise<
  Array<{ id: number; building_id: number; property_id: number; label: string }>
> {
  return query<{ id: number; building_id: number; property_id: number; label: string }>(
    `SELECT a.id, a.building_id, a.property_id,
            a.display_name_en || ' · ' || b.name_en AS label
     FROM assets a
     JOIN buildings b ON b.id = a.building_id
     WHERE a.asset_status = 'active'
     ORDER BY b.name_en ASC, a.display_name_en ASC`,
  );
}

export async function findMatchingAsset(input: {
  building_id: number;
  asset_type: AssetType;
  floor?: string | null;
  unit?: string | null;
  suite?: string | null;
  office_name?: string | null;
}): Promise<Asset | null> {
  const rows = await query<Asset>(
    `SELECT ${assetSelect} ${assetFrom}
     WHERE a.building_id = $1
       AND a.asset_type = $2
       AND COALESCE(lower(trim(a.floor)), '') = COALESCE(lower(trim($3::text)), '')
       AND COALESCE(lower(trim(a.unit)), '') = COALESCE(lower(trim($4::text)), '')
       AND COALESCE(lower(trim(a.suite)), '') = COALESCE(lower(trim($5::text)), '')
       AND COALESCE(lower(trim(a.office_name)), '') = COALESCE(lower(trim($6::text)), '')
     LIMIT 1`,
    [
      input.building_id,
      input.asset_type,
      input.floor ?? "",
      input.unit ?? "",
      input.suite ?? "",
      input.office_name ?? "",
    ],
  );
  return rows[0] ?? null;
}
