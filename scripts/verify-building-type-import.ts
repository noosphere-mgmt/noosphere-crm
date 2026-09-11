/**
 * Verify buildings import can update building_type (canonical + alias values).
 * Run: npx ts-node -r tsconfig-paths/register --compiler-options '{"module":"CommonJS"}' scripts/verify-building-type-import.ts
 */
import "./ensure-env";
import { query } from "../lib/db";
import { runImportEngine } from "../lib/import/importEngine";
import { PROPERTY_TYPES } from "../lib/lookups";

async function importBuildingType(buildingId: string, csvValue: string) {
  return runImportEngine({
    objectType: "buildings",
    parsed: {
      headers: ["building_id", "building_type"],
      rows: [{ building_id: buildingId, building_type: csvValue }],
    },
    columnMapping: { building_id: "building_id", building_type: "building_type" },
    mode: "commit",
    sessionMetadata: {},
  });
}

async function main() {
  const row = (
    await query<{ property_id: string; business_id: string; building_type: string | null }>(
      `SELECT property_id, business_id, building_type
       FROM properties_v1
       WHERE business_id IS NOT NULL
       ORDER BY updated_at DESC NULLS LAST
       LIMIT 1`,
    )
  )[0];
  if (!row) throw new Error("no building to test");

  const original = row.building_type;
  const canonical = PROPERTY_TYPES.find((t) => t !== original) ?? "Hotel";
  const aliasTarget = PROPERTY_TYPES.find((t) => t !== canonical && t !== original) ?? "Hotel";
  const aliasCsv =
    aliasTarget === "Commercial"
      ? "office"
      : aliasTarget === "Industrial"
        ? "industrial building"
        : aliasTarget.toLowerCase();

  try {
    const exact = await importBuildingType(row.business_id, canonical);
    const afterExact = (
      await query<{ building_type: string | null }>(
        `SELECT building_type FROM properties_v1 WHERE property_id = $1`,
        [row.property_id],
      )
    )[0];
    console.log("canonical CSV", JSON.stringify(canonical));
    console.log("engine", exact.summary, exact.rows[0]?.action, exact.rows[0]?.error_message, exact.rows[0]?.changes_summary);
    console.log("db after canonical", afterExact?.building_type);

    if (exact.rows[0]?.error_message) {
      throw new Error(`canonical import error: ${exact.rows[0].error_message}`);
    }
    if (afterExact?.building_type !== canonical) {
      throw new Error(`canonical import did not update DB: expected ${canonical} got ${afterExact?.building_type}`);
    }

    const viaAlias = await importBuildingType(row.business_id, aliasCsv);
    const afterAlias = (
      await query<{ building_type: string | null }>(
        `SELECT building_type FROM properties_v1 WHERE property_id = $1`,
        [row.property_id],
      )
    )[0];
    console.log("alias CSV", JSON.stringify(aliasCsv), "→", aliasTarget);
    console.log("engine", viaAlias.summary, viaAlias.rows[0]?.action, viaAlias.rows[0]?.error_message, viaAlias.rows[0]?.changes_summary);
    console.log("db after alias", afterAlias?.building_type);
    if (viaAlias.rows[0]?.error_message) {
      throw new Error(`alias import error: ${viaAlias.rows[0].error_message}`);
    }
    if (afterAlias?.building_type !== aliasTarget) {
      throw new Error(`alias import did not update DB: expected ${aliasTarget} got ${afterAlias?.building_type}`);
    }
  } finally {
    await query(`UPDATE properties_v1 SET building_type = $2 WHERE property_id = $1`, [row.property_id, original]);
    console.log("restored", row.business_id, original);
  }

  console.log("OK building_type import update");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
