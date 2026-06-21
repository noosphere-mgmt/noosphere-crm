/**
 * Verify premises import dry_run + commit (export roundtrip).
 * Run: npm run verify:premises-import-commit
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { query } from "../lib/db";
import { getImportObjectDefinition } from "../lib/import/objectRegistry";
import { runImportEngine } from "../lib/import/importEngine";
import { autoMapColumns, parseCsv } from "../lib/import/parseCsv";
import { exportObjectCsv } from "../lib/import/templates";

async function main() {
  const csv = await exportObjectCsv("premises");
  const parsed = parseCsv(csv);
  if (parsed.rows.length === 0) {
    console.log("verify-premises-import-commit: SKIP (no premises rows)");
    return;
  }

  const def = getImportObjectDefinition("premises");
  const columnMapping = autoMapColumns(
    parsed.headers,
    def.fields.map((f) => ({ key: f.key, label: f.label, aliases: f.aliases })),
  );

  // Simulate a fresh import row (clear id so we create a new premises)
  const row = { ...parsed.rows[0]! };
  row.premises_id = "";
  row.floor = "88";
  row.unit = "IMPORTTEST";
  parsed.rows = [row];

  const before = Number((await query<{ n: number }>("SELECT count(*)::int AS n FROM premises_v1"))[0]!.n);

  const dry = await runImportEngine({
    objectType: "premises",
    parsed,
    columnMapping,
    mode: "dry_run",
    sessionMetadata: {},
  });

  const runs = await query<{ id: string }>(
    `INSERT INTO import_runs (object_type, filename, uploaded_by, created_count, updated_count, cleared_count, skipped_count, error_count, duplicate_count, column_mapping, summary)
     VALUES ('premises','test.csv','verify',0,0,0,0,0,0,'{}','{}') RETURNING id::text`,
  );
  const importRunId = Number.parseInt(runs[0]!.id, 10);

  const commit = await runImportEngine({
    objectType: "premises",
    parsed,
    columnMapping,
    mode: "commit",
    importRunId,
    sessionMetadata: {},
  });

  const after = Number((await query<{ n: number }>("SELECT count(*)::int AS n FROM premises_v1"))[0]!.n);
  const created = await query<{ premises_id: string }>(
    `SELECT premises_id FROM premises_v1 WHERE floor = '88' AND unit = 'IMPORTTEST'`,
  );

  console.log("dry summary:", dry.summary);
  console.log("commit summary:", commit.summary);
  if (commit.rows[0]?.error_message) {
    console.log("commit error:", commit.rows[0].error_message);
  }

  if (created[0]) {
    await query(`DELETE FROM premises_v1 WHERE premises_id = $1`, [created[0].premises_id]);
  }

  if (dry.summary.create !== 1 || commit.summary.create !== 1 || after !== before + 1) {
    throw new Error(
      `Expected 1 create in dry/commit and count +1 (dry=${dry.summary.create}, commit=${commit.summary.create}, delta=${after - before})`,
    );
  }

  // building_name_en only (no building_id) — must resolve before match + commit
  const headerFor = (fieldKey: string) =>
    Object.entries(columnMapping).find(([, v]) => v === fieldKey)?.[0] ?? fieldKey;
  const nameOnlyRow: Record<string, string> = {};
  for (const h of parsed.headers) nameOnlyRow[h] = "";
  nameOnlyRow[headerFor("building_name_en")] = String(row.building_name_en ?? "");
  nameOnlyRow[headerFor("floor")] = "89";
  nameOnlyRow[headerFor("unit")] = "IMPORTNAME";
  const buildingIdHeader = headerFor("building_id");
  if (buildingIdHeader in nameOnlyRow) nameOnlyRow[buildingIdHeader] = "";
  const premisesIdHeader = headerFor("premises_id");
  if (premisesIdHeader in nameOnlyRow) nameOnlyRow[premisesIdHeader] = "";
  const nameParsed = { headers: parsed.headers, rows: [nameOnlyRow] };

  const nameDry = await runImportEngine({
    objectType: "premises",
    parsed: nameParsed,
    columnMapping,
    mode: "dry_run",
    sessionMetadata: {},
  });
  if (nameDry.summary.create !== 1) {
    throw new Error(`building_name_en-only dry_run expected create=1, got ${nameDry.summary.create}`);
  }

  const nameCommit = await runImportEngine({
    objectType: "premises",
    parsed: nameParsed,
    columnMapping,
    mode: "commit",
    importRunId,
    sessionMetadata: {},
  });
  const nameCreated = await query<{ premises_id: string }>(
    `SELECT premises_id FROM premises_v1 WHERE floor = '89' AND unit = 'IMPORTNAME'`,
  );
  if (nameCreated[0]) {
    await query(`DELETE FROM premises_v1 WHERE premises_id = $1`, [nameCreated[0].premises_id]);
  }
  if (nameCommit.summary.create !== 1 || !nameCreated[0]) {
    throw new Error(
      `building_name_en-only commit failed (create=${nameCommit.summary.create}, err=${nameCommit.rows[0]?.error_message ?? "none"})`,
    );
  }

  await query(`DELETE FROM import_runs WHERE id = $1`, [importRunId]);

  console.log("verify-premises-import-commit: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
