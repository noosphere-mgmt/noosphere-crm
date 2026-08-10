/**
 * R1 verification: premises_v1 classification coverage (Phase 38).
 */
import "./ensure-env";
import { query } from "../lib/db";

const CATEGORY_THRESHOLD = 0.95;

async function main(): Promise<void> {
  const cols = await query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'premises_v1'
       AND column_name IN ('property_category', 'listing_intent', 'space_form')`,
  );
  const names = new Set(cols.map((c) => c.column_name));
  for (const required of ["property_category", "listing_intent", "space_form"]) {
    if (!names.has(required)) {
      console.error(`FAIL: premises_v1.${required} column missing — run db:migrate phase 38`);
      process.exit(1);
    }
  }

  const counts = await query<{
    total: string;
    with_category: string;
    with_intent: string;
    with_form: string;
    invalid_intent: string;
  }>(
    `SELECT
       COUNT(*)::text AS total,
       COUNT(*) FILTER (WHERE property_category IS NOT NULL AND btrim(property_category) <> '')::text AS with_category,
       COUNT(*) FILTER (WHERE listing_intent IS NOT NULL)::text AS with_intent,
       COUNT(*) FILTER (WHERE space_form IS NOT NULL AND btrim(space_form) <> '')::text AS with_form,
       COUNT(*) FILTER (
         WHERE listing_intent IS NOT NULL
           AND listing_intent NOT IN ('lease', 'sale', 'both')
       )::text AS invalid_intent
     FROM premises_v1`,
  );

  const row = counts[0]!;
  const total = Number.parseInt(row.total, 10);
  const withCategory = Number.parseInt(row.with_category, 10);
  const invalidIntent = Number.parseInt(row.invalid_intent, 10);
  const categoryRate = total > 0 ? withCategory / total : 1;

  console.log("Supply consolidation (Phase 38) verification:");
  console.log(`- premises_v1 rows: ${total}`);
  console.log(`- property_category populated: ${withCategory} (${(categoryRate * 100).toFixed(1)}%)`);
  console.log(`- listing_intent populated: ${row.with_intent}`);
  console.log(`- space_form populated: ${row.with_form}`);
  console.log(`- invalid listing_intent values: ${invalidIntent}`);

  let failed = false;
  if (invalidIntent > 0) {
    console.error("FAIL: invalid listing_intent values found");
    failed = true;
  }
  if (total > 0 && categoryRate < CATEGORY_THRESHOLD) {
    console.error(
      `FAIL: property_category coverage ${(categoryRate * 100).toFixed(1)}% is below ${CATEGORY_THRESHOLD * 100}% threshold`,
    );
    failed = true;
  }

  if (failed) {
    process.exit(1);
  }
  console.log("OK: Phase 38 classification checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
