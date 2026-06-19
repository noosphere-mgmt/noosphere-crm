import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import "./ensure-env";
import {
  collectMappingReviews,
  mapAssetToProperty,
  pickPrimaryInventory,
  type EtlAssetRow,
  type EtlInventoryRow,
  type EtlReviewRow,
} from "../lib/etl/assetInventoryMappings";
import { query, withTransaction } from "../lib/db";

const ASSET_SELECT = `
  SELECT
    a.id AS asset_id,
    a.building_id,
    a.parent_asset_id,
    a.asset_type,
    a.asset_status,
    a.floor,
    a.unit,
    a.suite,
    a.display_name_en,
    a.office_name,
    a.office_type,
    a.gross_area_sqft::text,
    a.net_area_sqft::text,
    a.capacity_pax,
    a.view_type,
    a.windows,
    a.source_url,
    a.last_verified_date::text,
    a.remarks AS asset_remarks,
    a.operator_company_id,
    a.landlord_company_id,
    a.current_tenant_company_id,
    a.created_at::text AS asset_created_at,
    a.updated_at::text AS asset_updated_at,
    b.name_en AS building_name,
    b.property_type AS building_property_type,
    b.centre_type AS building_centre_type
  FROM assets a
  JOIN buildings b ON b.id = a.building_id
  ORDER BY a.id ASC
`;

const INVENTORY_SELECT = `
  SELECT
    i.id AS inventory_id,
    i.asset_id,
    i.operator_id,
    i.offer_type,
    i.status AS inventory_status,
    i.listing_intent,
    i.monthly_rent::text,
    i.sale_price::text,
    i.rent_psf::text,
    i.management_fee::text,
    i.deposit_months,
    i.rent_free_period,
    i.contract_term_months,
    i.commission_rate::text,
    i.available_date::text,
    i.source_file,
    i.remarks AS inventory_remarks,
    i.updated_at::text AS inventory_updated_at
  FROM inventory i
  ORDER BY i.asset_id ASC, i.id ASC
`;

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function writeReviewCsv(filePath: string, rows: EtlReviewRow[]): void {
  const header = [
    "asset_id",
    "reason",
    "detail",
    "building_name",
    "floor",
    "unit",
    "inventory_ids",
  ];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.asset_id,
        r.reason,
        r.detail,
        r.building_name,
        r.floor ?? "",
        r.unit ?? "",
        r.inventory_ids,
      ]
        .map((v) => csvEscape(String(v)))
        .join(","),
    ),
  ];
  writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}

async function loadOperatorCompanyMap(): Promise<Map<number, number>> {
  const rows = await query<{ operator_id: number; company_id: number }>(
    `SELECT o.id AS operator_id, c.id AS company_id
     FROM operators o
     JOIN companies c ON lower(trim(c.company_name)) = lower(trim(o.name))
     ORDER BY o.id ASC,
       CASE WHEN 'operator' = ANY(c.roles) THEN 0 ELSE 1 END,
       c.id ASC`,
  );
  const map = new Map<number, number>();
  for (const row of rows) {
    if (!map.has(row.operator_id)) map.set(row.operator_id, row.company_id);
  }
  return map;
}

async function resolveOperatorCompanyId(
  asset: EtlAssetRow,
  inventory: EtlInventoryRow | null,
  operatorMap: Map<number, number>,
): Promise<{ companyId: number | null; resolved: boolean }> {
  if (asset.operator_company_id != null) {
    return { companyId: asset.operator_company_id, resolved: true };
  }
  const operatorId = inventory?.operator_id;
  if (operatorId == null) return { companyId: null, resolved: true };
  const companyId = operatorMap.get(operatorId);
  return { companyId: companyId ?? null, resolved: companyId != null };
}

async function main(): Promise<void> {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const reviewDir = path.resolve(__dirname, "..", "backups", "etl-review");
  mkdirSync(reviewDir, { recursive: true });
  const reviewPath = path.join(reviewDir, `phase9b-review-${stamp}.csv`);

  const [assets, inventoryRows, operatorMap, existingIds] = await Promise.all([
    query<EtlAssetRow>(ASSET_SELECT),
    query<EtlInventoryRow>(INVENTORY_SELECT),
    loadOperatorCompanyMap(),
    query<{ id: number }>(`SELECT id FROM properties`),
  ]);

  const existingIdSet = new Set(existingIds.map((r) => r.id));
  const inventoryByAsset = new Map<number, EtlInventoryRow[]>();
  for (const row of inventoryRows) {
    const list = inventoryByAsset.get(row.asset_id) ?? [];
    list.push(row);
    inventoryByAsset.set(row.asset_id, list);
  }

  const reviews: EtlReviewRow[] = [];
  let inserted = 0;
  let updated = 0;

  await withTransaction(async (client) => {
    for (const asset of assets) {
      const invList = inventoryByAsset.get(asset.asset_id) ?? [];
      const { primary, extras } = pickPrimaryInventory(invList);
      const mapped = mapAssetToProperty(asset, primary);

      const operator = await resolveOperatorCompanyId(asset, primary, operatorMap);
      if (operator.companyId != null) {
        mapped.operator_company_id = operator.companyId;
      }

      reviews.push(
        ...collectMappingReviews(
          asset,
          primary,
          extras,
          operator.resolved,
          primary?.operator_id ?? null,
        ),
      );

      const insertParams = [
        mapped.building_id,
        mapped.floor,
        mapped.unit,
        mapped.property_category,
        mapped.operating_model,
        mapped.listing_intent,
        mapped.space_form,
        mapped.occupancy_status,
        mapped.area_sqft,
        mapped.capacity_pax,
        mapped.operator_company_id,
        mapped.landlord_company_id,
        mapped.current_tenant_company_id,
        mapped.asking_rent,
        mapped.asking_sale_price,
        mapped.rent_psf,
        mapped.management_fee,
        mapped.deposit_months,
        mapped.rent_free_period,
        mapped.contract_term_months,
        mapped.commission_rate,
        mapped.available_date,
        mapped.specification,
        mapped.status,
        mapped.source,
        mapped.source_date,
        mapped.last_updated_date,
        mapped.remarks,
        mapped.legacy_asset_id,
        mapped.legacy_inventory_id,
        mapped.created_at,
        mapped.updated_at,
      ];

      if (existingIdSet.has(mapped.id)) {
        await client.query(
          `UPDATE properties SET
             building_id = $2, floor = $3, unit = $4,
             property_category = $5, operating_model = $6, listing_intent = $7, space_form = $8,
             occupancy_status = $9, area_sqft = $10, capacity_pax = $11,
             operator_company_id = $12, landlord_company_id = $13, current_tenant_company_id = $14,
             asking_rent = $15, asking_sale_price = $16, rent_psf = $17, management_fee = $18,
             deposit_months = $19, rent_free_period = $20, contract_term_months = $21,
             commission_rate = $22, available_date = $23, specification = $24, status = $25,
             source = $26, source_date = $27, last_updated_date = $28, remarks = $29,
             legacy_asset_id = $30, legacy_inventory_id = $31, updated_at = $32::timestamptz
           WHERE id = $1`,
          [mapped.id, ...insertParams.slice(0, 30), mapped.updated_at],
        );
        updated += 1;
      } else {
        await client.query(
          `INSERT INTO properties (
             id, building_id, floor, unit,
             property_category, operating_model, listing_intent, space_form,
             occupancy_status, area_sqft, capacity_pax,
             operator_company_id, landlord_company_id, current_tenant_company_id,
             asking_rent, asking_sale_price, rent_psf, management_fee,
             deposit_months, rent_free_period, contract_term_months, commission_rate,
             available_date, specification, status,
             source, source_date, last_updated_date, remarks,
             legacy_asset_id, legacy_inventory_id, created_at, updated_at
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
             $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29,
             $30, $31, $32::timestamptz, $33::timestamptz
           )`,
          [mapped.id, ...insertParams],
        );
        inserted += 1;
      }
    }

    await client.query(
      `SELECT setval(
         pg_get_serial_sequence('properties', 'id'),
         GREATEST((SELECT COALESCE(MAX(id), 1) FROM properties), 1)
       )`,
    );
  });

  writeReviewCsv(reviewPath, reviews);

  const counts = await query<{ label: string; n: string }>(
    `SELECT 'assets' AS label, COUNT(*)::text AS n FROM assets
     UNION ALL SELECT 'inventory', COUNT(*)::text FROM inventory
     UNION ALL SELECT 'properties', COUNT(*)::text FROM properties
     UNION ALL SELECT 'properties_with_legacy_asset', COUNT(*)::text FROM properties WHERE legacy_asset_id IS NOT NULL
     UNION ALL SELECT 'properties_with_legacy_inventory', COUNT(*)::text FROM properties WHERE legacy_inventory_id IS NOT NULL`,
  );

  console.log("Phase 9b ETL complete.");
  console.log(`Inserted: ${inserted}, updated: ${updated}`);
  console.log(`Review rows: ${reviews.length}`);
  console.log(`Review CSV: ${reviewPath}`);
  console.log("Row counts:");
  for (const row of counts) {
    console.log(`  ${row.label}: ${row.n}`);
  }
}

main().catch((err) => {
  console.error("Phase 9b ETL failed:", err);
  process.exit(1);
});
