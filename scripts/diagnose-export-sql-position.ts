/**
 * Print export SQL length and snippet around PostgreSQL error position.
 * Usage: npx ts-node -r tsconfig-paths/register --compiler-options '{"module":"CommonJS"}' scripts/diagnose-export-sql-position.ts
 */
import "./ensure-env";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { IMPORT_OBJECT_TYPES, type ImportObjectType } from "../lib/import/types";

const ADAPTER_FILES: Record<ImportObjectType, string> = {
  buildings: "buildings.ts",
  premises: "premises.ts",
  companies: "companies.ts",
  contacts: "contacts.ts",
  relationships: "relationships.ts",
  opportunities: "opportunities.ts",
  opportunity_parties: "opportunityParties.ts",
  opportunity_proposed_premises: "opportunityProposedPremises.ts",
  activities: "activities.ts",
  activity_premises: "activityPremises.ts",
};

function extractExportSql(filePath: string): string | null {
  const src = readFileSync(filePath, "utf8");
  if (!src.includes("async exportRows()")) return null;
  const selectMatch = src.match(/const SELECT = `([\s\S]*?)`;/);
  const fromMatch = src.match(/const FROM = `([\s\S]*?)`;/);
  if (!selectMatch || !fromMatch) {
    const relSelect = src.match(/const SELECT = `([\s\S]*?)`;/);
    if (relSelect && src.includes("FROM relationships r")) {
      return `SELECT ${relSelect[1]} FROM relationships r WHERE r.relationship_type IN ('Refers', 'Represents') ORDER BY r.updated_at DESC`;
    }
    return null;
  }
  const orderMatch = src.match(/exportRows\(\)[\s\S]*?`SELECT \$\{SELECT\} FROM \$\{FROM\}([^`]+)`/);
  const order = orderMatch?.[1]?.trim() ?? " ORDER BY 1";
  return `SELECT ${selectMatch[1]} FROM ${fromMatch[1]}${order}`;
}

const POSITION = Number(process.env.PG_ERROR_POSITION ?? "999");

for (const objectType of IMPORT_OBJECT_TYPES) {
  const file = join(__dirname, "../lib/import/adapters", ADAPTER_FILES[objectType]);
  const sql = extractExportSql(file);
  if (!sql) {
    console.log(`${objectType}: (no export SQL extracted)`);
    continue;
  }
  const start = Math.max(0, POSITION - 40);
  const snippet = sql.slice(start, POSITION + 40).replace(/\s+/g, " ");
  console.log(`\n${objectType}: len=${sql.length}`);
  console.log(`  @${POSITION}: ...${snippet}...`);
}
