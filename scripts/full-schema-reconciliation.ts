/**
 * Full schema reconciliation:
 * 1. Empty schema + npm run db:migrate (simulates brand-new deployment)
 * 2. Verify all major admin module queries succeed
 * 3. Compare fresh migrate schema vs reference (public / production mirror)
 * 4. Emit missing tables/columns, unused columns, migration consistency reports
 */
import { execSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { loadEnvForCli } from "./load-env-cli";

loadEnvForCli();

const FRESH_SCHEMA = "migrate_fresh_full_recon";
const REFERENCE_SCHEMA = process.env.SCHEMA_REFERENCE_SCHEMA?.trim() || "public";
const REPORT_JSON = path.join(__dirname, "..", "docs", "full-schema-reconciliation-report.json");
const REPORT_MD = path.join(__dirname, "..", "docs", "full-schema-reconciliation-report.md");
const SCRIPTS_DIR = __dirname;

type Col = { table: string; column: string; dataType: string; udtName: string };
type ModuleResult = { module: string; status: "ok" | "failed"; rows?: number; error?: string };

function baseUrl(): string {
  const url = process.env.NOOSPHERE_DATABASE_URL?.trim();
  if (!url) throw new Error("NOOSPHERE_DATABASE_URL is not set");
  return url;
}

function freshEnv(): NodeJS.ProcessEnv {
  return { ...process.env, NOOSPHERE_DATABASE_URL: baseUrl(), PGOPTIONS: `-c search_path=${FRESH_SCHEMA}` };
}

async function fetchTables(pool: Pool, schema: string): Promise<string[]> {
  const r = await pool.query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = $1 AND table_type = 'BASE TABLE'
     ORDER BY table_name`,
    [schema],
  );
  return r.rows.map((x) => x.table_name);
}

async function fetchColumns(pool: Pool, schema: string): Promise<Col[]> {
  const r = await pool.query<{
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
  return r.rows.map((x) => ({
    table: x.table_name,
    column: x.column_name,
    dataType: x.data_type,
    udtName: x.udt_name,
  }));
}

function pgTypeDisplay(c: Col): string {
  if (c.dataType === "ARRAY") return `${c.udtName.replace(/^_/, "")}[]`;
  if (c.dataType === "USER-DEFINED") return c.udtName;
  if (c.dataType === "character varying") return "TEXT";
  if (c.dataType === "timestamp with time zone") return "TIMESTAMPTZ";
  if (c.dataType === "numeric") return "NUMERIC";
  return c.dataType.toUpperCase();
}

function scanRepoColumnRefs(): Map<string, Set<string>> {
  const repoDir = path.join(__dirname, "..", "lib", "repos");
  const files = readdirSync(repoDir).filter((f) => f.endsWith(".ts"));
  const byTable = new Map<string, Set<string>>();

  for (const file of files) {
    const content = readFileSync(path.join(repoDir, file), "utf8");
    const sqlChunks = content.match(/`[^`]*`/g) ?? [];
    for (const chunk of sqlChunks) {
      const sql = chunk.slice(1, -1);
      const tableMatches = sql.matchAll(/\b(?:FROM|JOIN|INTO|UPDATE)\s+([a-z][a-z0-9_]*)/gi);
      for (const m of tableMatches) {
        const table = m[1]!.toLowerCase();
        if (!byTable.has(table)) byTable.set(table, new Set());
      }
      const colMatches = sql.matchAll(/\b([a-z][a-z0-9_]*)\s*(?:,|\)|=|::|ASC|DESC|NULL|NOT|IN|FROM|WHERE|SET|AS)\b/gi);
      for (const m of colMatches) {
        const col = m[1]!.toLowerCase();
        if (["from", "join", "where", "and", "or", "set", "into", "update", "select", "left", "right", "inner", "outer", "on", "as", "case", "when", "then", "else", "end", "not", "null", "true", "false", "limit", "order", "by", "group", "having", "distinct", "exists", "in", "like", "ilike", "between", "coalesce", "concat", "trim", "both", "string_agg", "array_agg", "count", "sum", "max", "min", "filter", "over", "partition", "row", "rows", "text", "int", "bigint"].includes(col)) {
          continue;
        }
        for (const [table, cols] of byTable) {
          if (sql.includes(table)) cols.add(col);
        }
      }
    }
  }

  return byTable;
}

function scanSimpleColumnRefs(): Set<string> {
  const repoDir = path.join(__dirname, "..", "lib", "repos");
  const files = readdirSync(repoDir).filter((f) => f.endsWith(".ts"));
  const refs = new Set<string>();
  for (const file of files) {
    const content = readFileSync(path.join(repoDir, file), "utf8");
    for (const m of content.matchAll(/\b([a-z][a-z0-9_]{1,62})\b/g)) {
      refs.add(m[1]!);
    }
  }
  return refs;
}

function parseSchemaSqlTables(): Map<string, Set<string>> {
  const schema = readFileSync(path.join(SCRIPTS_DIR, "schema.sql"), "utf8");
  const tables = new Map<string, Set<string>>();
  const createBlocks = schema.matchAll(
    /CREATE TABLE IF NOT EXISTS\s+([a-z_][a-z0-9_]*)\s*\(([\s\S]*?)\);/gi,
  );
  for (const block of createBlocks) {
    const table = block[1]!.toLowerCase();
    const body = block[2]!;
    const cols = new Set<string>();
    for (const line of body.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("--") || trimmed.startsWith("CONSTRAINT") || trimmed.startsWith("CHECK") || trimmed.startsWith("PRIMARY") || trimmed.startsWith("UNIQUE") || trimmed.startsWith("FOREIGN") || trimmed.startsWith("REFERENCES")) {
        continue;
      }
      const m = trimmed.match(/^([a-z_][a-z0-9_]*)\s+/i);
      if (m) cols.add(m[1]!.toLowerCase());
    }
    tables.set(table, cols);
  }
  return tables;
}

function parseMigratePhases(): { referenced: string[]; missingOnDisk: string[]; orphansOnDisk: string[] } {
  const migrateTs = readFileSync(path.join(SCRIPTS_DIR, "migrate.ts"), "utf8");
  const referenced = [...migrateTs.matchAll(/readSql\("([^"]+\.sql)"\)/g)].map((m) => m[1]!);
  const onDisk = readdirSync(SCRIPTS_DIR)
    .filter((f) => f.startsWith("schema-migrate-phase") && f.endsWith(".sql"))
    .sort();
  const refSet = new Set(referenced);
  const diskSet = new Set(onDisk);
  return {
    referenced,
    missingOnDisk: referenced.filter((f) => !diskSet.has(f)),
    orphansOnDisk: onDisk.filter((f) => !refSet.has(f)),
  };
}

async function verifyModules(): Promise<ModuleResult[]> {
  process.env.NOOSPHERE_DATABASE_URL = baseUrl();
  process.env.PGOPTIONS = `-c search_path=${FRESH_SCHEMA}`;

  const results: ModuleResult[] = [];

  async function run(name: string, fn: () => Promise<unknown>): Promise<void> {
    try {
      const out = await fn();
      const rows = Array.isArray(out) ? out.length : undefined;
      results.push({ module: name, status: "ok", rows });
    } catch (err) {
      results.push({ module: name, status: "failed", error: err instanceof Error ? err.message : String(err) });
    }
  }

  const { fetchDashboardData } = await import("../lib/repos/dashboard");
  const { listConnectionCompanies } = await import("../lib/repos/connections");
  const { listContacts } = await import("../lib/repos/contacts");
  const { listOpportunities } = await import("../lib/repos/opportunities");
  const { listActivities } = await import("../lib/repos/activities");
  const { listPropertiesV1, countPropertiesV1, listPropertyV1SelectOptions } = await import("../lib/repos/propertiesV1");
  const { listPremisesFullFiltered, countPremisesV1, listPremisesFilterOptions } = await import("../lib/repos/premisesV1");
  const { listMarketableProperties } = await import("../lib/repos/marketableProperties");
  const { listBuildings } = await import("../lib/repos/buildings");
  const { listCompanyOptionsByRole } = await import("../lib/repos/companies");
  const { listProposedPremisesForOpportunity } = await import("../lib/repos/opportunityProposedPremises");
  const { listCompanyV1Options } = await import("../lib/repos/companiesV1");
  const { listContactV1Options } = await import("../lib/repos/contactsV1");

  await run("Dashboard", () => fetchDashboardData());
  await run("Connections (Companies)", () => listConnectionCompanies());
  await run("Connections (Contacts)", () => listContacts());
  await run("Opportunities", () => listOpportunities());
  await run("Activities", () => listActivities());
  await run("Properties (Premises list)", () => listPremisesFullFiltered({}));
  await run("Properties (filter options)", () => listPremisesFilterOptions());
  await run("Buildings", () => listPropertiesV1({}));
  await run("Buildings (count)", () => countPropertiesV1());
  await run("Premises", () => listPremisesFullFiltered({}));
  await run("Premises (count)", () => countPremisesV1());
  await run("Quick Add Property (marketable)", () => listMarketableProperties());
  await run("Quick Add Property (buildings)", () => listBuildings());
  await run("Quick Add Property (operators)", () => listCompanyOptionsByRole("operator"));
  await run("Opportunity Premises Selector", () => listPremisesFullFiltered({ q: "test" }));
  await run("Opportunity Proposed Premises", () => listProposedPremisesForOpportunity(1));
  await run("V1 company options", () => listCompanyV1Options());
  await run("V1 contact options", () => listContactV1Options());
  await run("V1 property select options", () => listPropertyV1SelectOptions());

  return results;
}

function mdSection(title: string, lines: string[]): string {
  return `## ${title}\n\n${lines.join("\n")}\n\n`;
}

async function main(): Promise<void> {
  console.log("=== Full schema reconciliation ===\n");
  console.log(`Fresh schema: ${FRESH_SCHEMA}`);
  console.log(`Reference schema: ${REFERENCE_SCHEMA} (set SCHEMA_REFERENCE_SCHEMA to override)\n`);

  const admin = new Pool({ connectionString: baseUrl() });
  await admin.query(`DROP SCHEMA IF EXISTS ${FRESH_SCHEMA} CASCADE`);
  await admin.query(`CREATE SCHEMA ${FRESH_SCHEMA}`);
  await admin.end();

  console.log("Step 1: npm run db:migrate on empty schema...");
  execSync("npm run db:migrate", { cwd: path.join(__dirname, ".."), stdio: "inherit", env: freshEnv() });

  console.log("\nStep 2: verify all admin module queries...");
  const moduleResults = await verifyModules();
  for (const r of moduleResults) {
    if (r.status === "ok") {
      console.log(`  ✓ ${r.module}${r.rows != null ? ` (${r.rows} rows)` : ""}`);
    } else {
      console.log(`  ✗ ${r.module}: ${r.error}`);
    }
  }
  const failedModules = moduleResults.filter((r) => r.status === "failed");

  console.log("\nStep 3: compare fresh migrate vs reference schema...");
  const pool = new Pool({ connectionString: baseUrl() });
  const [freshTables, refTables, freshCols, refCols] = await Promise.all([
    fetchTables(pool, FRESH_SCHEMA),
    fetchTables(pool, REFERENCE_SCHEMA),
    fetchColumns(pool, FRESH_SCHEMA),
    fetchColumns(pool, REFERENCE_SCHEMA),
  ]);

  const freshTableSet = new Set(freshTables);
  const refTableSet = new Set(refTables);
  const freshColSet = new Set(freshCols.map((c) => `${c.table}.${c.column}`));
  const refColSet = new Set(refCols.map((c) => `${c.table}.${c.column}`));

  const missingTablesOnFresh = refTables.filter((t) => !freshTableSet.has(t)).map((table) => ({
    table,
    note: `Present in ${REFERENCE_SCHEMA} but not created by npm run db:migrate`,
  }));
  const missingTablesOnReference = freshTables.filter((t) => !refTableSet.has(t)).map((table) => ({
    table,
    note: `Created by migrate but absent in ${REFERENCE_SCHEMA}`,
  }));

  const missingColumnsOnFresh = refCols
    .filter((c) => !freshColSet.has(`${c.table}.${c.column}`))
    .map((c) => ({
      table: c.table,
      column: c.column,
      expectedType: pgTypeDisplay(c),
      source: `reference schema ${REFERENCE_SCHEMA}`,
    }));

  const missingColumnsOnReference = freshCols
    .filter((c) => !refColSet.has(`${c.table}.${c.column}`))
    .map((c) => ({
      table: c.table,
      column: c.column,
      expectedType: pgTypeDisplay(c),
      source: "fresh migrate (production needs npm run db:migrate)",
    }));

  console.log("\nStep 4: unused columns (in fresh schema, not referenced in lib/repos)...");
  const repoRefs = scanSimpleColumnRefs();
  const structural = new Set(["id", "created_at", "updated_at"]);
  const unusedColumns = freshCols
    .filter((c) => !repoRefs.has(c.column) && !structural.has(c.column))
    .map((c) => ({
      table: c.table,
      column: c.column,
      type: pgTypeDisplay(c),
      note: "Column name not found in lib/repos/*.ts (may be used by import/ETL or future features)",
    }));

  console.log("\nStep 5: migration consistency...");
  const phases = parseMigratePhases();
  const schemaSqlTables = parseSchemaSqlTables();
  const freshByTable = new Map<string, Col[]>();
  for (const c of freshCols) {
    const list = freshByTable.get(c.table) ?? [];
    list.push(c);
    freshByTable.set(c.table, list);
  }

  const schemaSqlGaps: { table: string; column: string; note: string }[] = [];
  for (const [table, baseCols] of schemaSqlTables) {
    const freshTableCols = new Set((freshByTable.get(table) ?? []).map((c) => c.column));
    for (const col of baseCols) {
      if (!freshTableCols.has(col)) {
        schemaSqlGaps.push({
          table,
          column: col,
          note: "In schema.sql CREATE but missing after full migrate (should be added by a phase file)",
        });
      }
    }
  }

  const phaseOnlyTables = freshTables.filter((t) => !schemaSqlTables.has(t)).map((table) => ({
    table,
    note: "Created by phase migrations, not in schema.sql base CREATE",
  }));

  const duplicatePhaseRuns = phases.referenced.filter(
    (f, i) => phases.referenced.indexOf(f) !== i,
  );

  await pool.end();

  const report = {
    generatedAt: new Date().toISOString(),
    freshSchema: FRESH_SCHEMA,
    referenceSchema: REFERENCE_SCHEMA,
    database: new URL(baseUrl()).pathname.slice(1),
    summary: {
      freshTables: freshTables.length,
      freshColumns: freshCols.length,
      referenceTables: refTables.length,
      referenceColumns: refCols.length,
      modulesVerified: moduleResults.length,
      modulesFailed: failedModules.length,
      missingTablesOnFresh: missingTablesOnFresh.length,
      missingColumnsOnFresh: missingColumnsOnFresh.length,
      missingTablesOnReference: missingTablesOnReference.length,
      missingColumnsOnReference: missingColumnsOnReference.length,
      unusedColumns: unusedColumns.length,
      schemaSqlGaps: schemaSqlGaps.length,
    },
    moduleVerification: moduleResults,
    missingTablesReport: {
      onFreshMigrate: missingTablesOnFresh,
      onReferenceSchema: missingTablesOnReference,
    },
    missingColumnsReport: {
      onFreshMigrate: missingColumnsOnFresh,
      onReferenceSchema: missingColumnsOnReference,
    },
    unusedColumnsReport: unusedColumns,
    migrationConsistencyReport: {
      migratePhaseCount: phases.referenced.length,
      phasesReferencedInMigrateTs: phases.referenced,
      phaseFilesMissingOnDisk: phases.missingOnDisk,
      phaseFilesOrphanedNotInMigrateTs: phases.orphansOnDisk,
      duplicatePhaseRunsInMigrateTs: [...new Set(duplicatePhaseRuns)],
      schemaSqlBaseTableCount: schemaSqlTables.size,
      phaseOnlyTables,
      schemaSqlColumnsMissingAfterFullMigrate: schemaSqlGaps,
      notes: [
        "schema.sql is applied first; phase files add columns and new tables.",
        "phase31 runs twice in migrate.ts (early after 10c, late after 29) — idempotent by design.",
        "phase30 is superseded by phase31 and is not run by migrate.ts.",
      ],
    },
  };

  writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

  const md: string[] = [
    "# Full Schema Reconciliation Report",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `Fresh schema: \`${FRESH_SCHEMA}\` | Reference: \`${REFERENCE_SCHEMA}\` | Database: \`${report.database}\``,
    "",
    "## Summary",
    "",
    "| Metric | Count |",
    "| --- | --- |",
    `| Fresh migrate tables | ${report.summary.freshTables} |`,
    `| Fresh migrate columns | ${report.summary.freshColumns} |`,
    `| Reference schema tables | ${report.summary.referenceTables} |`,
    `| Reference schema columns | ${report.summary.referenceColumns} |`,
    `| Module queries verified | ${report.summary.modulesVerified} |`,
    `| Module query failures | ${report.summary.modulesFailed} |`,
    `| Missing tables on fresh migrate | ${report.summary.missingTablesOnFresh} |`,
    `| Missing columns on fresh migrate | ${report.summary.missingColumnsOnFresh} |`,
    `| Missing tables on reference | ${report.summary.missingTablesOnReference} |`,
    `| Missing columns on reference (prod behind) | ${report.summary.missingColumnsOnReference} |`,
    `| Unused columns (heuristic) | ${report.summary.unusedColumns} |`,
    "",
  ];

  md.push(
    mdSection(
      "Module verification",
      moduleResults.map(
        (r) =>
          `- ${r.status === "ok" ? "✓" : "✗"} **${r.module}**${r.rows != null ? ` — ${r.rows} rows` : ""}${r.error ? ` — ${r.error}` : ""}`,
      ),
    ),
  );

  md.push(
    mdSection(
      "Missing tables (on fresh migrate)",
      missingTablesOnFresh.length
        ? missingTablesOnFresh.map((r) => `- \`${r.table}\` — ${r.note}`)
        : ["(none — fresh migrate creates all reference tables)"],
    ),
  );

  md.push(
    mdSection(
      "Missing columns (on fresh migrate vs reference)",
      missingColumnsOnFresh.length
        ? missingColumnsOnFresh.map(
            (r) => `- \`${r.table}.${r.column}\` (${r.expectedType}) — ${r.source}`,
          )
        : ["(none — npm run db:migrate produces a complete schema)"],
    ),
  );

  md.push(
    mdSection(
      "Missing on reference schema (production behind migrate)",
      missingColumnsOnReference.length
        ? missingColumnsOnReference.slice(0, 50).map(
            (r) => `- \`${r.table}.${r.column}\` (${r.expectedType})`,
          ).concat(
            missingColumnsOnReference.length > 50
              ? [`- … and ${missingColumnsOnReference.length - 50} more`]
              : [],
          )
        : ["(none — reference schema matches fresh migrate)"],
    ),
  );

  md.push(
    mdSection(
      "Unused columns (heuristic — not found in lib/repos)",
      unusedColumns.length
        ? unusedColumns.slice(0, 40).map((r) => `- \`${r.table}.${r.column}\` (${r.type})`)
        : ["(none detected)"],
    ),
  );

  if (unusedColumns.length > 40) {
    md.push(`_… and ${unusedColumns.length - 40} more in JSON report_\n`);
  }

  md.push(
    mdSection(
      "Migration consistency",
      [
        `- Phase files referenced in migrate.ts: **${phases.referenced.length}**`,
        `- Orphan phase files (not in migrate.ts): ${phases.orphansOnDisk.length ? phases.orphansOnDisk.join(", ") : "(none)"}`,
        `- Duplicate phase runs: ${duplicatePhaseRuns.length ? [...new Set(duplicatePhaseRuns)].join(", ") : "(none)"}`,
        `- Tables created only in phases (not schema.sql): ${phaseOnlyTables.map((t) => t.table).join(", ") || "(none)"}`,
        `- schema.sql columns missing after full migrate: ${schemaSqlGaps.length ? schemaSqlGaps.map((g) => `\`${g.table}.${g.column}\``).join(", ") : "(none)"}`,
      ],
    ),
  );

  writeFileSync(REPORT_MD, md.join("\n"));

  console.log(`\nReports written:`);
  console.log(`  ${REPORT_JSON}`);
  console.log(`  ${REPORT_MD}`);

  console.log("\n=== Summary ===");
  console.log(`Fresh: ${freshTables.length} tables, ${freshCols.length} columns`);
  console.log(`Reference (${REFERENCE_SCHEMA}): ${refTables.length} tables, ${refCols.length} columns`);
  console.log(`Missing on fresh: ${missingTablesOnFresh.length} tables, ${missingColumnsOnFresh.length} columns`);
  console.log(`Missing on reference: ${missingTablesOnReference.length} tables, ${missingColumnsOnReference.length} columns`);
  console.log(`Unused columns (heuristic): ${unusedColumns.length}`);
  console.log(`Module failures: ${failedModules.length}`);

  if (failedModules.length > 0 || missingColumnsOnFresh.length > 0 || missingTablesOnFresh.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("full-schema-reconciliation failed:", err);
  process.exit(1);
});
