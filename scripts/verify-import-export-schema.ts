/**
 * Verify every import adapter exportRows() query runs against the current DB schema.
 * Usage: npm run verify:import-export-schema
 */
import "./ensure-env";
import { getImportObjectDefinition } from "../lib/import/objectRegistry";
import { IMPORT_OBJECT_TYPES, type ImportObjectType } from "../lib/import/types";

async function verifyExport(objectType: ImportObjectType): Promise<{ ok: boolean; error?: string }> {
  const def = getImportObjectDefinition(objectType);
  if (!def.exportRows) {
    return { ok: true };
  }
  try {
    await def.exportRows();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function main(): Promise<void> {
  const failures: { objectType: ImportObjectType; error: string }[] = [];

  for (const objectType of IMPORT_OBJECT_TYPES) {
    const result = await verifyExport(objectType);
    if (result.ok) {
      console.log(`OK  ${objectType}`);
    } else {
      console.error(`FAIL ${objectType}: ${result.error}`);
      failures.push({ objectType, error: result.error ?? "unknown" });
    }
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} export(s) failed schema check.`);
    process.exit(1);
  }

  console.log(`\nAll ${IMPORT_OBJECT_TYPES.length} import/export adapters verified.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
