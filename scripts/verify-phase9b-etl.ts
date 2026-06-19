import "./ensure-env";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { query } from "../lib/db";

type CheckResult = { name: string; pass: boolean; detail: string };

async function main(): Promise<void> {
  const checks: CheckResult[] = [];

  const counts = await query<{
    assets: string;
    inventory: string;
    properties: string;
    buildings: string;
    with_legacy_asset: string;
    with_legacy_inventory: string;
  }>(
    `SELECT
       (SELECT COUNT(*)::text FROM assets) AS assets,
       (SELECT COUNT(*)::text FROM inventory) AS inventory,
       (SELECT COUNT(*)::text FROM properties) AS properties,
       (SELECT COUNT(*)::text FROM buildings) AS buildings,
       (SELECT COUNT(*)::text FROM properties WHERE legacy_asset_id IS NOT NULL) AS with_legacy_asset,
       (SELECT COUNT(*)::text FROM properties WHERE legacy_inventory_id IS NOT NULL) AS with_legacy_inventory`,
  );
  const c = counts[0]!;
  const assetCount = Number.parseInt(c.assets, 10);
  const propertyCount = Number.parseInt(c.properties, 10);

  checks.push({
    name: "properties_count_equals_assets",
    pass: propertyCount === assetCount,
    detail: `properties=${propertyCount}, assets=${assetCount}`,
  });

  const unmigrated = await query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM assets a
     WHERE NOT EXISTS (SELECT 1 FROM properties p WHERE p.legacy_asset_id = a.id)`,
  );
  checks.push({
    name: "all_assets_have_legacy_link",
    pass: Number.parseInt(unmigrated[0]!.n, 10) === 0,
    detail: `unmigrated assets: ${unmigrated[0]!.n}`,
  });

  const idMismatches = await query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM assets a
     JOIN properties p ON p.legacy_asset_id = a.id
     WHERE p.id <> a.id`,
  );
  checks.push({
    name: "property_id_matches_asset_id",
    pass: Number.parseInt(idMismatches[0]!.n, 10) === 0,
    detail: `id mismatches: ${idMismatches[0]!.n}`,
  });

  const orphanBuilding = await query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM properties p
     WHERE NOT EXISTS (SELECT 1 FROM buildings b WHERE b.id = p.building_id)`,
  );
  checks.push({
    name: "all_properties_have_valid_building",
    pass: Number.parseInt(orphanBuilding[0]!.n, 10) === 0,
    detail: `orphan building FKs: ${orphanBuilding[0]!.n}`,
  });

  const requiredNulls = await query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM properties
     WHERE property_category IS NULL OR operating_model IS NULL
        OR listing_intent IS NULL OR space_form IS NULL OR status IS NULL`,
  );
  checks.push({
    name: "required_classification_fields_set",
    pass: Number.parseInt(requiredNulls[0]!.n, 10) === 0,
    detail: `rows with null required fields: ${requiredNulls[0]!.n}`,
  });

  const legacyTables = await query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN ('assets', 'inventory', 'buildings', '_deprecated_sites')`,
  );
  checks.push({
    name: "legacy_tables_preserved",
    pass: legacyTables.some((t) => t.table_name === "assets")
      && legacyTables.some((t) => t.table_name === "inventory")
      && legacyTables.some((t) => t.table_name === "buildings"),
    detail: legacyTables.map((t) => t.table_name).join(", "),
  });

  const samples = await query(
    `SELECT p.id, b.name_en AS building, p.floor, p.unit,
            p.property_category, p.operating_model, p.listing_intent, p.space_form,
            p.occupancy_status, p.area_sqft::text, p.asking_rent::text, p.status,
            p.legacy_asset_id, p.legacy_inventory_id
     FROM properties p
     JOIN buildings b ON b.id = p.building_id
     ORDER BY p.id
     LIMIT 10`,
  );

  const reviewDir = path.resolve(__dirname, "..", "backups", "etl-review");
  let latestReview: string | null = null;
  try {
    const files = readdirSync(reviewDir)
      .filter((f) => f.startsWith("phase9b-review-") && f.endsWith(".csv"))
      .sort()
      .reverse();
    latestReview = files[0] ? path.join(reviewDir, files[0]) : null;
  } catch {
    latestReview = null;
  }

  let reviewRows = 0;
  if (latestReview) {
    const csv = readFileSync(latestReview, "utf8").trim();
    reviewRows = Math.max(0, csv.split("\n").length - 1);
  }

  const allPass = checks.every((ch) => ch.pass);

  console.log("Phase 9b ETL verification");
  console.log("========================");
  for (const ch of checks) {
    console.log(`${ch.pass ? "PASS" : "FAIL"}  ${ch.name}: ${ch.detail}`);
  }
  console.log("\nRow counts:", c);
  console.log(`\nReview CSV: ${latestReview ?? "(none)"} (${reviewRows} rows)`);
  console.log("\nSample properties:");
  console.log(JSON.stringify(samples, null, 2));
  console.log(`\nOverall: ${allPass ? "PASS — safe to plan UI cutover" : "FAIL — resolve before UI cutover"}`);

  if (!allPass) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
