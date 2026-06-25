/**
 * Repair premises_v1.relationship_lines stored as TEXT or JSON string scalar instead of array.
 * Run: npm run db:fix-relationship-lines
 */
import { query } from "../lib/db";
import {
  SQL_ENSURE_RELATIONSHIP_LINES_JSONB_COLUMN,
  SQL_NORMALIZE_RELATIONSHIP_LINES_JSONB,
  SQL_RELATIONSHIP_LINES_AS_JSONB,
} from "../lib/premisesRelationshipLinesSql";

type BadRow = {
  premises_id: string;
  relationship_lines: unknown;
  jsonb_type: string;
};

async function ensureJsonbColumn(): Promise<void> {
  await query(SQL_ENSURE_RELATIONSHIP_LINES_JSONB_COLUMN);
}

async function listBadRows(): Promise<BadRow[]> {
  return query<BadRow>(
    `SELECT premises_id,
            relationship_lines,
            jsonb_typeof(${SQL_RELATIONSHIP_LINES_AS_JSONB}) AS jsonb_type
     FROM premises_v1
     WHERE relationship_lines IS NOT NULL
       AND jsonb_typeof(${SQL_RELATIONSHIP_LINES_AS_JSONB}) IS DISTINCT FROM 'array'
     ORDER BY premises_id`,
  );
}

async function main() {
  await ensureJsonbColumn();

  const before = await listBadRows();
  if (before.length === 0) {
    console.log("No premises with non-array relationship_lines.");
    return;
  }

  console.log(`Found ${before.length} premise(s) with non-array relationship_lines:`);
  for (const row of before) {
    console.log(`  ${row.premises_id} (${row.jsonb_type}): ${JSON.stringify(row.relationship_lines)}`);
  }

  const updated = await query<{ premises_id: string }>(
    `${SQL_NORMALIZE_RELATIONSHIP_LINES_JSONB} RETURNING premises_id`,
  );
  console.log(`Updated ${updated.length} row(s).`);

  const after = await listBadRows();
  if (after.length > 0) {
    console.error("Still have non-array relationship_lines:", after);
    process.exit(1);
  }

  const targets = ["INV-2026-0007", "INV-2026-0008"];
  const check = await query<{ premises_id: string; jsonb_type: string | null }>(
    `SELECT premises_id, jsonb_typeof(relationship_lines) AS jsonb_type
     FROM premises_v1
     WHERE premises_id = ANY($1::text[])`,
    [targets],
  );
  for (const id of targets) {
    const row = check.find((r) => r.premises_id === id);
    if (!row) {
      console.log(`  ${id}: not in database (skipped)`);
      continue;
    }
    if (row.jsonb_type !== "array" && row.jsonb_type !== null) {
      console.error(`  ${id}: still ${row.jsonb_type}`);
      process.exit(1);
    }
    console.log(`  ${id}: ok (${row.jsonb_type ?? "null"})`);
  }

  console.log("relationship_lines cleanup finished.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
