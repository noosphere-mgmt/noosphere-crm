/**
 * Repair premises_v1.relationship_lines stored as JSON string (e.g. "[]") instead of array.
 * Run: npm run db:fix-relationship-lines
 */
import { query } from "../lib/db";

type BadRow = {
  premises_id: string;
  relationship_lines: unknown;
  jsonb_type: string;
};

const FIX_SQL = `
UPDATE premises_v1
SET relationship_lines = CASE
  WHEN jsonb_typeof(relationship_lines) = 'string' THEN
    COALESCE((relationship_lines #>> '{}')::jsonb, '[]'::jsonb)
  WHEN jsonb_typeof(relationship_lines) = 'array' THEN relationship_lines
  ELSE '[]'::jsonb
END
WHERE relationship_lines IS NOT NULL
  AND jsonb_typeof(relationship_lines) IS DISTINCT FROM 'array'
`;

async function listBadRows(): Promise<BadRow[]> {
  return query<BadRow>(
    `SELECT premises_id,
            relationship_lines,
            jsonb_typeof(relationship_lines) AS jsonb_type
     FROM premises_v1
     WHERE relationship_lines IS NOT NULL
       AND jsonb_typeof(relationship_lines) IS DISTINCT FROM 'array'
     ORDER BY premises_id`,
  );
}

async function main() {
  const before = await listBadRows();
  if (before.length === 0) {
    console.log("No premises with non-array relationship_lines.");
    return;
  }

  console.log(`Found ${before.length} premise(s) with non-array relationship_lines:`);
  for (const row of before) {
    console.log(`  ${row.premises_id} (${row.jsonb_type}): ${JSON.stringify(row.relationship_lines)}`);
  }

  const updated = await query<{ premises_id: string }>(`${FIX_SQL} RETURNING premises_id`);
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
