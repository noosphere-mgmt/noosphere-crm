/**
 * Buildings module schema audit: code-referenced columns vs fresh migrate-only schema.
 * Does NOT compare against existing dev/test databases.
 */
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { loadEnvForCli } from "./load-env-cli";

loadEnvForCli();

const FRESH_SCHEMA = "migrate_fresh_buildings";
const REPORT_FILE = path.join(__dirname, "..", "docs", "buildings-schema-audit-report.json");

/** Columns selected/updated by lib/repos/propertiesV1.ts (Buildings page). */
const PROPERTIES_V1_CODE = [
  "property_id",
  "bldg_name_en",
  "bldg_name_zh",
  "bldg_name_cn",
  "tower_block",
  "floor_count",
  "bldg_area_sqft",
  "bldg_area_sqm",
  "year_built",
  "bldg_desc",
  "building_remarks",
  "land_use",
  "class_of_site",
  "land_tenure",
  "plot_ratio",
  "site_area_sqft",
  "site_area_sqm",
  "country",
  "city_en",
  "city_zh",
  "city_cn",
  "district_en",
  "district_zh",
  "district_cn",
  "street_no",
  "street_name_en",
  "street_name_zh",
  "street_name_cn",
  "full_address_en",
  "full_address_zh",
  "full_address_cn",
  "mtr_station",
  "walking_minutes",
  "facilities",
  "green_certification",
  "lot_number",
  "grade",
  "management_company_id",
  "operator_company_id",
  "current_tenant_company_id",
  "owner_company_id",
  "title",
  "inventory_count",
  "inventory_count_sales",
  "inventory_count_lease",
  "updated_at",
] as const;

/** lib/repos/buildings.ts buildingSelect (Quick Add / legacy). */
const BUILDINGS_CODE = [
  "id",
  "property_id",
  "name_en",
  "name_zh",
  "property_type",
  "centre_type",
  "status",
  "country",
  "city",
  "district",
  "street_no",
  "street_name_en",
  "street_name_zh",
  "full_address_en",
  "full_address_zh",
  "lot_number",
  "land_use",
  "ownership_type",
  "source_url",
  "last_verified_date",
  "latitude",
  "longitude",
  "tower_block",
  "floor_count",
  "typical_floor_area_sqft",
  "year_built",
  "grade",
  "mtr_station",
  "walking_minutes",
  "facilities",
  "green_certification",
  "remarks",
  "created_at",
  "updated_at",
] as const;

function baseUrl(): string {
  const url = process.env.NOOSPHERE_DATABASE_URL?.trim();
  if (!url) throw new Error("NOOSPHERE_DATABASE_URL is not set");
  return url;
}

async function columnSet(pool: Pool, schema: string, table: string): Promise<Set<string>> {
  const rows = await pool.query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2`,
    [schema, table],
  );
  return new Set(rows.rows.map((r) => r.column_name));
}

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: baseUrl() });
  await pool.query(`DROP SCHEMA IF EXISTS ${FRESH_SCHEMA} CASCADE`);
  await pool.query(`CREATE SCHEMA ${FRESH_SCHEMA}`);
  await pool.end();

  execSync("npm run db:migrate", {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    env: { ...process.env, NOOSPHERE_DATABASE_URL: baseUrl(), PGOPTIONS: `-c search_path=${FRESH_SCHEMA}` },
  });

  const fresh = new Pool({ connectionString: baseUrl(), options: `-c search_path=${FRESH_SCHEMA}` });

  const pv1Fresh = await columnSet(fresh, FRESH_SCHEMA, "properties_v1");
  const bFresh = await columnSet(fresh, FRESH_SCHEMA, "buildings");

  const missingPv1 = PROPERTIES_V1_CODE.filter((c) => !pv1Fresh.has(c));
  const missingBuildings = BUILDINGS_CODE.filter((c) => !bFresh.has(c));

  const report = {
    auditedAt: new Date().toISOString(),
    freshSchema: FRESH_SCHEMA,
    properties_v1: {
      referencedByCode: [...PROPERTIES_V1_CODE],
      presentAfterFreshMigrate: [...pv1Fresh].sort(),
      missingFromFreshMigrate: missingPv1,
    },
    buildings: {
      referencedByCode: [...BUILDINGS_CODE],
      presentAfterFreshMigrate: [...bFresh].sort(),
      missingFromFreshMigrate: missingBuildings,
    },
    buildingsPageNote:
      "/admin/properties/buildings uses properties_v1 only (not legacy buildings table)",
  };

  writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

  console.log("\n=== Buildings module schema audit (code vs fresh migrate) ===\n");
  console.log("properties_v1 columns referenced by code:", PROPERTIES_V1_CODE.length);
  console.log("properties_v1 columns after fresh migrate:", pv1Fresh.size);
  console.log(
    "properties_v1 MISSING from fresh migrate:",
    missingPv1.length ? missingPv1.join(", ") : "(none)",
  );
  console.log("\nbuildings (legacy) columns referenced by code:", BUILDINGS_CODE.length);
  console.log("buildings columns after fresh migrate:", bFresh.size);
  console.log(
    "buildings MISSING from fresh migrate:",
    missingBuildings.length ? missingBuildings.join(", ") : "(none)",
  );
  console.log(`\nReport: ${REPORT_FILE}`);

  await fresh.end();

  if (missingPv1.length > 0 || missingBuildings.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
