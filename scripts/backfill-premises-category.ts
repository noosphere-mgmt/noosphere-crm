/**
 * Idempotent backfill: map premises_v1 legacy fields → property_category, space_form, listing_intent.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register --compiler-options '{"module":"CommonJS"}' scripts/backfill-premises-category.ts
 *   ... --force   # overwrite existing classification values
 */
import "./ensure-env";
import { query } from "../lib/db";
import { derivePremisesClassification } from "../lib/premisesClassification";

type Row = {
  premises_id: string;
  property_type: string | null;
  centre_type: string | null;
  offer_type: string | null;
  operating_model: string | null;
  inventory_status: string | null;
  monthly_rent: string | null;
  asking_sale_price: string | null;
  floor: string | null;
  property_category: string | null;
  space_form: string | null;
  listing_intent: string | null;
};

async function main(): Promise<void> {
  const force = process.argv.includes("--force");

  const rows = await query<Row>(
    `SELECT premises_id, property_type, centre_type, offer_type, operating_model,
            inventory_status, monthly_rent::text, asking_sale_price::text, floor,
            property_category, space_form, listing_intent
     FROM premises_v1
     ORDER BY premises_id ASC`,
  );

  let updated = 0;
  let skipped = 0;
  let unchanged = 0;

  for (const row of rows) {
    const derived = derivePremisesClassification(row);

    const nextCategory = force || !row.property_category?.trim()
      ? derived.property_category
      : row.property_category;
    const nextSpaceForm = force || !row.space_form?.trim() ? derived.space_form : row.space_form;
    const nextListingIntent =
      force || !row.listing_intent?.trim() ? derived.listing_intent : row.listing_intent;

    if (
      nextCategory === row.property_category &&
      nextSpaceForm === row.space_form &&
      nextListingIntent === row.listing_intent
    ) {
      unchanged++;
      continue;
    }

    if (!nextCategory && !nextSpaceForm && !nextListingIntent) {
      skipped++;
      continue;
    }

    await query(
      `UPDATE premises_v1 SET
         property_category = COALESCE($2, property_category),
         space_form = COALESCE($3, space_form),
         listing_intent = COALESCE($4, listing_intent),
         updated_at = NOW()
       WHERE premises_id = $1`,
      [row.premises_id, nextCategory, nextSpaceForm, nextListingIntent],
    );
    updated++;
  }

  const stats = await query<{ total: string; with_category: string; with_intent: string; with_form: string }>(
    `SELECT
       COUNT(*)::text AS total,
       COUNT(*) FILTER (WHERE property_category IS NOT NULL AND btrim(property_category) <> '')::text AS with_category,
       COUNT(*) FILTER (WHERE listing_intent IS NOT NULL)::text AS with_intent,
       COUNT(*) FILTER (WHERE space_form IS NOT NULL AND btrim(space_form) <> '')::text AS with_form
     FROM premises_v1`,
  );

  const s = stats[0]!;
  const total = Number.parseInt(s.total, 10);
  const withCategory = Number.parseInt(s.with_category, 10);
  const pct = total > 0 ? ((withCategory / total) * 100).toFixed(1) : "0";

  console.log(`Premises classification backfill complete (${force ? "force" : "fill-empty"} mode).`);
  console.log(`- Rows scanned: ${rows.length}`);
  console.log(`- Updated: ${updated}`);
  console.log(`- Unchanged: ${unchanged}`);
  console.log(`- Skipped (no derivable values): ${skipped}`);
  console.log(`- With property_category: ${withCategory}/${total} (${pct}%)`);
  console.log(`- With listing_intent: ${s.with_intent}/${total}`);
  console.log(`- With space_form: ${s.with_form}/${total}`);

  if (total > 0 && withCategory / total < 0.95) {
    console.warn("WARNING: fewer than 95% of premises have property_category — review mapping rules.");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
