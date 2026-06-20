/**
 * Fresh-DB verification for Buildings / Properties module.
 * 1. Empty schema + npm run db:migrate
 * 2. Execute exact listPropertiesV1 SQL
 * 3. Simulate stale production properties_v1 (missing extension columns) + re-run phase 31
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { loadEnvForCli } from "./load-env-cli";

loadEnvForCli();

const FRESH_SCHEMA = "migrate_fresh_buildings_verify";

/** Exact columns from lib/repos/propertiesV1.ts SELECT (table: properties_v1, no joins). */
export const PROPERTIES_V1_BUILDINGS_COLUMNS: {
  column: string;
  pgType: string;
  source: string;
}[] = [
  { column: "property_id", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "bldg_name_en", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "bldg_name_zh", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "bldg_name_cn", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "tower_block", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "floor_count", pgType: "INTEGER", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "bldg_area_sqft", pgType: "NUMERIC(14,2)", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "bldg_area_sqm", pgType: "NUMERIC(14,2)", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "year_built", pgType: "INTEGER", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "bldg_desc", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "building_remarks", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "land_use", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "class_of_site", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "land_tenure", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "plot_ratio", pgType: "NUMERIC(12,4)", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "site_area_sqft", pgType: "NUMERIC(14,2)", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "site_area_sqm", pgType: "NUMERIC(14,2)", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "country", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "city_en", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "city_zh", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "city_cn", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "district_en", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "district_zh", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "district_cn", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "street_no", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "street_name_en", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "street_name_zh", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "street_name_cn", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "full_address_en", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "full_address_zh", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "full_address_cn", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "mtr_station", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "walking_minutes", pgType: "INTEGER", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "facilities", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "green_certification", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "lot_number", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "grade", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "management_company_id", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "operator_company_id", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "current_tenant_company_id", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "owner_company_id", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "title", pgType: "TEXT", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "inventory_count", pgType: "INTEGER", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "inventory_count_sales", pgType: "INTEGER", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "inventory_count_lease", pgType: "INTEGER", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
  { column: "updated_at", pgType: "TIMESTAMPTZ", source: "lib/repos/propertiesV1.ts listPropertiesV1" },
];

const BUILDINGS_PAGE_SQL = `
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
  ORDER BY bldg_name_en ASC NULLS LAST, property_id ASC
  LIMIT 1
`;

function baseUrl(): string {
  const url = process.env.NOOSPHERE_DATABASE_URL?.trim();
  if (!url) throw new Error("NOOSPHERE_DATABASE_URL is not set");
  return url;
}

function poolOpts(schema: string): { connectionString: string; options: string } {
  return { connectionString: baseUrl(), options: `-c search_path=${schema}` };
}

async function missingColumns(pool: Pool, schema: string): Promise<typeof PROPERTIES_V1_BUILDINGS_COLUMNS> {
  const present = new Set(
    (
      await pool.query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns
         WHERE table_schema = $1 AND table_name = 'properties_v1'`,
        [schema],
      )
    ).rows.map((r) => r.column_name),
  );
  return PROPERTIES_V1_BUILDINGS_COLUMNS.filter((c) => !present.has(c.column));
}

async function runBuildingsQuery(pool: Pool): Promise<void> {
  await pool.query(BUILDINGS_PAGE_SQL);
}

async function main(): Promise<void> {
  const admin = new Pool({ connectionString: baseUrl() });
  await admin.query(`DROP SCHEMA IF EXISTS ${FRESH_SCHEMA} CASCADE`);
  await admin.query(`CREATE SCHEMA ${FRESH_SCHEMA}`);
  await admin.end();

  console.log("Step 1: fresh schema + npm run db:migrate");
  execSync("npm run db:migrate", {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    env: { ...process.env, NOOSPHERE_DATABASE_URL: baseUrl(), PGOPTIONS: `-c search_path=${FRESH_SCHEMA}` },
  });

  const pool = new Pool(poolOpts(FRESH_SCHEMA));

  let missing = await missingColumns(pool, FRESH_SCHEMA);
  if (missing.length > 0) {
    console.error("\nMISSING after fresh migrate:");
    for (const m of missing) {
      console.error(`  properties_v1.${m.column} (${m.pgType}) — ${m.source}`);
    }
    process.exit(1);
  }

  console.log("Step 2: execute exact Buildings page SQL");
  await runBuildingsQuery(pool);
  console.log("  Buildings SELECT: OK");

  console.log("Step 3: simulate stale production properties_v1 (drop extension columns)");
  const staleCols = [
    "grade",
    "management_company_id",
    "title",
    "operator_company_id",
    "current_tenant_company_id",
    "owner_company_id",
    "currency",
    "external_ref",
    "import_run_id",
    "last_verified_date",
  ];
  for (const col of staleCols) {
    await pool.query(`ALTER TABLE properties_v1 DROP COLUMN IF EXISTS ${col}`);
  }

  missing = await missingColumns(pool, FRESH_SCHEMA);
  console.log(`  Dropped ${staleCols.length} columns; missing: ${missing.map((m) => m.column).join(", ")}`);

  console.log("Step 4: apply phase 31 reconciliation only");
  const phase31 = readFileSync(path.join(__dirname, "schema-migrate-phase31-buildings-module-reconciliation.sql"), "utf8");
  await pool.query(phase31);

  missing = await missingColumns(pool, FRESH_SCHEMA);
  if (missing.length > 0) {
    console.error("\nMISSING after phase 31 on stale table:");
    for (const m of missing) {
      console.error(`  properties_v1.${m.column} (${m.pgType}) — ${m.source}`);
    }
    process.exit(1);
  }

  await runBuildingsQuery(pool);
  console.log("  Buildings SELECT after stale+phase31: OK");

  await pool.query(`DROP SCHEMA IF EXISTS ${FRESH_SCHEMA} CASCADE`);
  await pool.end();

  console.log("\nFresh DB verification PASSED (including stale production simulation).");
}

main().catch((err) => {
  console.error("verify-buildings-fresh failed:", err);
  process.exit(1);
});
