/**
 * Fresh-migrate schema audit:
 * 1. Drop/create isolated schema (simulates empty DB; no CREATEDB required)
 * 2. Run npm run db:migrate against that schema via search_path
 * 3. Compare migrate_fresh_audit.* vs public.* on the same server
 * 4. Emit reconciliation SQL for columns present in public but missing after migrate-only
 */
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { loadEnvForCli } from "./load-env-cli";

loadEnvForCli();

const FRESH_SCHEMA = "migrate_fresh_audit";
const RECON_FILE = path.join(__dirname, "schema-migrate-phase30-schema-reconciliation.sql");

type Col = { table: string; column: string; dataType: string };

function baseUrl(): string {
  const url = process.env.NOOSPHERE_DATABASE_URL?.trim();
  if (!url) throw new Error("NOOSPHERE_DATABASE_URL is not set");
  return url;
}

function freshMigrateEnv(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    NOOSPHERE_DATABASE_URL: baseUrl(),
    PGOPTIONS: `-c search_path=${FRESH_SCHEMA}`,
  };
}

async function fetchColumns(pool: Pool, schema: string): Promise<Col[]> {
  const rows = await pool.query<{
    table_name: string;
    column_name: string;
    data_type: string;
    udt_name: string;
  }>(
    `SELECT table_name, column_name, data_type, udt_name
     FROM information_schema.columns
     WHERE table_schema = $1
     ORDER BY table_name, ordinal_position`,
    [schema],
  );
  return rows.rows.map((r) => ({
    table: r.table_name,
    column: r.column_name,
    dataType: r.data_type === "ARRAY" ? `${r.udt_name.replace(/^_/, "")}[]` : r.data_type,
  }));
}

function pgType(dataType: string): string {
  if (dataType.endsWith("[]")) {
    const base = dataType.slice(0, -2);
    if (base === "text") return "TEXT[]";
    return `${base.toUpperCase()}[]`;
  }
  switch (dataType) {
    case "character varying":
      return "TEXT";
    case "timestamp with time zone":
      return "TIMESTAMPTZ";
    case "timestamp without time zone":
      return "TIMESTAMP";
    case "double precision":
      return "DOUBLE PRECISION";
    case "bigint":
      return "BIGINT";
    case "integer":
      return "INTEGER";
    case "numeric":
      return "NUMERIC";
    case "boolean":
      return "BOOLEAN";
    case "date":
      return "DATE";
    case "jsonb":
      return "JSONB";
    case "ARRAY":
      return "TEXT[]";
    default:
      return dataType.toUpperCase();
  }
}

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: baseUrl() });

  console.log(`Preparing empty schema "${FRESH_SCHEMA}" on ${new URL(baseUrl()).pathname.slice(1)}...`);
  await pool.query(`DROP SCHEMA IF EXISTS ${FRESH_SCHEMA} CASCADE`);
  await pool.query(`CREATE SCHEMA ${FRESH_SCHEMA}`);
  await pool.end();

  console.log("Running npm run db:migrate (migrate-only fresh schema)...");
  execSync("npm run db:migrate", {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    env: freshMigrateEnv(),
  });

  const verifyPool = new Pool({ connectionString: baseUrl(), options: `-c search_path=${FRESH_SCHEMA}` });
  const verify = await verifyPool.query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM information_schema.tables WHERE table_schema = current_schema()`,
  );
  await verifyPool.end();
  const freshTableCount = Number.parseInt(verify.rows[0]?.n ?? "0", 10);
  if (freshTableCount === 0) {
    throw new Error(
      `Fresh migrate created 0 tables in schema "${FRESH_SCHEMA}". PGOPTIONS search_path may not be applied.`,
    );
  }
  console.log(`Fresh schema table count: ${freshTableCount}`);

  const comparePool = new Pool({ connectionString: baseUrl() });
  const [freshCols, testCols] = await Promise.all([
    fetchColumns(comparePool, FRESH_SCHEMA),
    fetchColumns(comparePool, "public"),
  ]);
  await comparePool.end();

  const freshSet = new Set(freshCols.map((c) => `${c.table}.${c.column}`));
  const testByTable = new Map<string, Col[]>();
  for (const c of testCols) {
    const list = testByTable.get(c.table) ?? [];
    list.push(c);
    testByTable.set(c.table, list);
  }

  const missingFromFresh: Col[] = [];
  for (const c of testCols) {
    if (!freshSet.has(`${c.table}.${c.column}`)) {
      missingFromFresh.push(c);
    }
  }

  const freshTables = new Set(freshCols.map((c) => c.table));
  const missingTablesOnFresh = [...testByTable.keys()].filter((t) => !freshTables.has(t));

  console.log("\n=== Fresh migrate schema summary ===");
  console.log(`Tables: ${freshTables.size}, columns: ${freshCols.length}`);
  console.log(`Test (public) tables: ${testByTable.size}, columns: ${testCols.length}`);

  if (missingTablesOnFresh.length > 0) {
    console.log("\nTables in test DB but not created by migrate-only:");
    for (const t of missingTablesOnFresh.sort()) console.log(`  - ${t}`);
  }

  console.log("\n=== Columns in test DB missing after migrate-only ===");
  if (missingFromFresh.length === 0) {
    console.log("(none)");
  } else {
    let lastTable = "";
    for (const c of missingFromFresh) {
      if (c.table !== lastTable) {
        console.log(`\n${c.table}:`);
        lastTable = c.table;
      }
      console.log(`  - ${c.column} (${c.dataType})`);
    }
  }

  const byTable = new Map<string, Col[]>();
  for (const c of missingFromFresh) {
    const list = byTable.get(c.table) ?? [];
    list.push(c);
    byTable.set(c.table, list);
  }

  const lines: string[] = [
    "-- Phase 30: Schema reconciliation (auto-generated from fresh migrate vs test DB audit).",
    "-- Adds columns present on working DB but missing after npm run db:migrate on empty schema.",
    "-- Idempotent: safe to run on every deploy.",
    "",
    "BEGIN;",
    "",
  ];

  for (const table of [...byTable.keys()].sort()) {
    const cols = byTable.get(table)!;
    lines.push(`-- ${table}`);
    for (const c of cols) {
      lines.push(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${c.column} ${pgType(c.dataType)};`);
    }
    lines.push("");
  }

  lines.push("COMMIT;", "");

  writeFileSync(RECON_FILE, lines.join("\n"));

  if (missingFromFresh.length === 0) {
    console.log("\nNo column gaps — scripts/schema-migrate-phase30-schema-reconciliation.sql");
    console.log("contains idempotent guards for known production hotfixes.");
  }

  console.log(`\nAudit artifact: ${RECON_FILE}`);
  console.log(`Missing column count: ${missingFromFresh.length}`);
}

main().catch((err) => {
  console.error("schema-audit failed:", err);
  process.exit(1);
});
