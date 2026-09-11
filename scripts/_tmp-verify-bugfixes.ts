import "./ensure-env";
import { query } from "../lib/db";
import { buildingsImportDefinition } from "../lib/import/adapters/buildings";
import { autoMapColumns } from "../lib/import/parseCsv";
import { PROPERTY_TYPES, normalizeBuildingType } from "../lib/lookups";
import { searchActivityContacts } from "../lib/repos/activities";
import { searchRelationshipEntities } from "../lib/repos/relationships";

async function main() {
  const mapping = autoMapColumns(
    ["Building Type", "building_id", "Property Type", "category"],
    buildingsImportDefinition.fields.map((f) => ({ key: f.key, label: f.label, aliases: f.aliases })),
  );
  if (mapping["Building Type"] !== "building_type") {
    throw new Error(`Building Type header not mapped: ${JSON.stringify(mapping)}`);
  }
  if (mapping["Property Type"] !== "building_type") throw new Error("Property Type header not mapped");
  if (mapping.category !== "building_type") throw new Error("category header not mapped");
  if (normalizeBuildingType("commercial") !== "Commercial Building") throw new Error("alias commercial");
  if (normalizeBuildingType("hotel") !== "Hotel") throw new Error("alias hotel");
  console.log("OK mapping + normalizeBuildingType");

  const row = (
    await query<{ property_id: string; business_id: string; building_type: string | null }>(
      `SELECT property_id, business_id, building_type FROM properties_v1 WHERE business_id IS NOT NULL LIMIT 1`,
    )
  )[0];
  if (!row) throw new Error("no building");
  const original = row.building_type;
  const next = PROPERTY_TYPES.find((t) => t !== original) ?? "Hotel";
  await buildingsImportDefinition.updateRecord(row.business_id, { building_type: next }, {});
  const after = (
    await query<{ building_type: string | null }>(
      `SELECT building_type FROM properties_v1 WHERE property_id = $1`,
      [row.property_id],
    )
  )[0];
  if (after?.building_type !== next) {
    throw new Error(`building_type not updated via business_id: expected ${next} got ${after?.building_type}`);
  }
  await buildingsImportDefinition.updateRecord(row.business_id, { building_type: original }, {});
  console.log(
    "OK building_type update via",
    row.business_id,
    "property_id",
    row.property_id,
    original,
    "->",
    next,
    "-> restored",
  );

  const sample = (
    await query<{
      first_name: string | null;
      last_name: string | null;
      display_name: string | null;
      contact_name: string | null;
      chinese_name: string | null;
    }>(
      `SELECT first_name, last_name, display_name, contact_name, chinese_name
       FROM contacts WHERE is_active = TRUE AND COALESCE(first_name, '') <> '' LIMIT 1`,
    )
  )[0];
  console.log("sample contact", sample);
  if (sample?.first_name) {
    const q = String(sample.first_name).trim().slice(0, 4);
    const activityHits = await searchActivityContacts(q, 15);
    const relHits = await searchRelationshipEntities("contact", q, 15);
    console.log(
      "activity hits",
      activityHits.length,
      activityHits.slice(0, 3).map((h) => h.label),
    );
    console.log(
      "relationship hits",
      relHits.length,
      relHits.slice(0, 3).map((h) => h.label),
    );
    if (activityHits.length === 0) throw new Error(`activity search returned 0 for ${q}`);
    if (relHits.length === 0) throw new Error(`relationship search returned 0 for ${q}`);
  }
  console.log("ALL OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
