/**
 * Post-migrate guard: fail migrate if Buildings page SQL cannot run.
 * Called at end of scripts/migrate.ts
 */
import { query } from "../lib/db";

const BUILDINGS_VERIFY_SQL = `
  SELECT
    property_id,
    bldg_name_en, bldg_name_zh, bldg_name_cn,
    tower_block, floor_count,
    bldg_area_sqft::text AS bldg_area_sqft,
    bldg_area_sqm::text AS bldg_area_sqm,
    year_built,
    bldg_desc,
    building_remarks,
    land_use, class_of_site, land_tenure,
    plot_ratio::text AS plot_ratio,
    site_area_sqft::text AS site_area_sqft,
    site_area_sqm::text AS site_area_sqm,
    country, city_en, city_zh, city_cn,
    district_en, district_zh, district_cn,
    street_no, street_name_en, street_name_zh, street_name_cn,
    full_address_en, full_address_zh, full_address_cn,
    mtr_station, walking_minutes, facilities, green_certification, lot_number,
    grade, management_company_id, operator_company_id, current_tenant_company_id, owner_company_id, title,
    inventory_count, inventory_count_sales, inventory_count_lease,
    updated_at::text AS updated_at
  FROM properties_v1
  LIMIT 0
`;

const REQUIRED_PROPERTIES_V1_COLUMNS = [
  "grade",
  "management_company_id",
  "title",
  "operator_company_id",
  "current_tenant_company_id",
  "owner_company_id",
] as const;

export async function verifyBuildingsPageSchema(): Promise<void> {
  const missing = await query<{ column_name: string }>(
    `SELECT req.column_name
     FROM unnest($1::text[]) AS req(column_name)
     LEFT JOIN information_schema.columns c
       ON c.table_schema = current_schema()
      AND c.table_name = 'properties_v1'
      AND c.column_name = req.column_name
     WHERE c.column_name IS NULL`,
    [REQUIRED_PROPERTIES_V1_COLUMNS],
  );

  if (missing.length > 0) {
    throw new Error(
      `properties_v1 missing columns after migrate: ${missing.map((r) => r.column_name).join(", ")}. ` +
        "Buildings page (/admin/properties/buildings) will crash.",
    );
  }

  await query(BUILDINGS_VERIFY_SQL);
}
