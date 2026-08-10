/**
 * R1 verification: opportunity preference columns (Phase 39).
 */
import "./ensure-env";
import { query } from "../lib/db";
import {
  normalizeCategoryPreference,
  normalizeSpaceFormPreference,
  parseCategoryPreferenceList,
  parseSpaceFormPreferenceList,
} from "../lib/opportunityPreferences";

async function main(): Promise<void> {
  const cols = await query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'opportunities'
       AND column_name IN ('property_category_preference', 'property_type_preference')`,
  );
  const names = new Set(cols.map((c) => c.column_name));
  for (const required of ["property_category_preference", "property_type_preference"]) {
    if (!names.has(required)) {
      console.error(`FAIL: opportunities.${required} column missing — run db:migrate phase 39`);
      process.exit(1);
    }
  }

  const counts = await query<{
    total: string;
    with_category: string;
    with_type: string;
  }>(
    `SELECT
       COUNT(*)::text AS total,
       COUNT(*) FILTER (
         WHERE property_category_preference IS NOT NULL
           AND btrim(property_category_preference) <> ''
       )::text AS with_category,
       COUNT(*) FILTER (
         WHERE property_type_preference IS NOT NULL
           AND btrim(property_type_preference) <> ''
       )::text AS with_type
     FROM opportunities`,
  );

  const row = counts[0]!;
  console.log("Opportunity preferences (Phase 39) verification:");
  console.log(`- opportunities rows: ${row.total}`);
  console.log(`- with property_category_preference: ${row.with_category}`);
  console.log(`- with property_type_preference: ${row.with_type}`);

  const invalid = await query<{ id: string; field: string; value: string }>(
    `SELECT id::text, 'category' AS field, property_category_preference AS value
     FROM opportunities
     WHERE property_category_preference IS NOT NULL
       AND btrim(property_category_preference) <> ''
     UNION ALL
     SELECT id::text, 'type' AS field, property_type_preference AS value
     FROM opportunities
     WHERE property_type_preference IS NOT NULL
       AND btrim(property_type_preference) <> ''`,
  );

  let bad = 0;
  for (const r of invalid) {
    const parsed =
      r.field === "category"
        ? parseCategoryPreferenceList(r.value)
        : parseSpaceFormPreferenceList(r.value);
    const normalized =
      r.field === "category"
        ? normalizeCategoryPreference(r.value)
        : normalizeSpaceFormPreference(r.value);
    if (parsed.length === 0 && r.value.trim()) {
      bad++;
      console.error(`FAIL: opportunity ${r.id} has invalid ${r.field} preference: ${r.value}`);
    } else if (normalized !== r.value.trim()) {
      console.warn(
        `WARN: opportunity ${r.id} ${r.field} preference could normalize (${r.value} → ${normalized})`,
      );
    }
  }

  if (bad > 0) {
    console.error(`FAIL: ${bad} opportunities with invalid preference values`);
    process.exit(1);
  }

  console.log("OK: Phase 39 opportunity preference checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
