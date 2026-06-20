/**
 * Verify property module queries against fresh migrate-only schema.
 */
import { execSync } from "node:child_process";
import { Pool } from "pg";
import { loadEnvForCli } from "./load-env-cli";

loadEnvForCli();

const FRESH_SCHEMA = "migrate_fresh_verify";

async function main(): Promise<void> {
  const base = process.env.NOOSPHERE_DATABASE_URL?.trim();
  if (!base) throw new Error("NOOSPHERE_DATABASE_URL is not set");

  const admin = new Pool({ connectionString: base });
  await admin.query(`DROP SCHEMA IF EXISTS ${FRESH_SCHEMA} CASCADE`);
  await admin.query(`CREATE SCHEMA ${FRESH_SCHEMA}`);
  await admin.end();

  execSync("npm run db:migrate", {
    cwd: `${__dirname}/..`,
    stdio: "inherit",
    env: { ...process.env, NOOSPHERE_DATABASE_URL: base, PGOPTIONS: `-c search_path=${FRESH_SCHEMA}` },
  });

  process.env.NOOSPHERE_DATABASE_URL = base;
  process.env.PGOPTIONS = `-c search_path=${FRESH_SCHEMA}`;

  const { listPropertiesV1, countPropertiesV1 } = await import("../lib/repos/propertiesV1");
  const { listPremisesFullFiltered, countPremisesV1, listPremisesForPropertyV1 } = await import(
    "../lib/repos/premisesV1"
  );
  const { listMarketableProperties } = await import("../lib/repos/marketableProperties");

  const buildings = await listPropertiesV1({});
  const buildingCount = await countPropertiesV1();
  const premises = await listPremisesFullFiltered({});
  const premisesCount = await countPremisesV1();
  const legacy = await listMarketableProperties();

  if (buildings[0]) {
    await listPremisesForPropertyV1(buildings[0].property_id);
  }

  console.log("Fresh schema verification OK:");
  console.log(`  listPropertiesV1 (Buildings): ${buildings.length} rows, count=${buildingCount}`);
  console.log(`  listPremisesFullFiltered (Premises): ${premises.length} rows, count=${premisesCount}`);
  console.log(`  listMarketableProperties (Quick Add): ${legacy.length} rows`);

  const pool = new Pool({ connectionString: base, options: `-c search_path=${FRESH_SCHEMA}` });
  const cols = await pool.query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = 'properties_v1'
       AND column_name = ANY($2::text[])`,
    [
      FRESH_SCHEMA,
      [
        "grade",
        "management_company_id",
        "operator_company_id",
        "current_tenant_company_id",
        "owner_company_id",
        "title",
      ],
    ],
  );
  await pool.end();

  const cleanup = new Pool({ connectionString: base });
  await cleanup.query(`DROP SCHEMA IF EXISTS ${FRESH_SCHEMA} CASCADE`);
  await cleanup.end();

  console.log(`  properties_v1 extension columns: ${cols.rows.map((r) => r.column_name).join(", ")}`);
}

main().catch((err) => {
  console.error("verify-fresh failed:", err);
  process.exit(1);
});
