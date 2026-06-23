/**
 * Verify building/premises company field save normalization.
 * Usage: npm run verify:property-company-save
 */
import "./ensure-env";
import { query } from "../lib/db";
import {
  coercePremisesV1PatchForDb,
  coercePropertyV1PatchForDb,
  describePropertyV1UpdateParams,
  getPropertyV1FkColumnTypes,
} from "../lib/propertyV1DbCoerce";
import {
  createPropertyV1,
  deletePropertiesV1,
  getPropertyV1,
  updatePropertyV1,
} from "../lib/repos/propertiesV1";
import {
  createPremisesV1,
  deletePremisesV1,
  getPremisesV1,
  updatePremisesV1,
} from "../lib/repos/premisesV1";
import { getCompany } from "../lib/repos/companies";
import { normalizeRelationshipLinesForSave } from "../lib/premisesRelationshipsServer";
import { syncRelationshipColumns } from "../lib/premisesRelationships";

async function sampleCompany(): Promise<{ legacyId: number; v1Id: string }> {
  const row = await query<{ legacy_company_id: number; company_id: string }>(
    `SELECT legacy_company_id::int AS legacy_company_id, company_id
     FROM companies_v1 WHERE legacy_company_id IS NOT NULL LIMIT 1`,
  );
  if (!row[0]) throw new Error("No companies_v1 with legacy mapping");
  return { legacyId: row[0].legacy_company_id, v1Id: row[0].company_id };
}

function assertNoCompOnBigint(
  table: "properties_v1" | "premises_v1",
  column: string,
  value: unknown,
  types: Map<string, "bigint" | "text">,
): void {
  const storage = types.get(`${table}.${column}`);
  if (storage !== "bigint") return;
  if (typeof value === "string" && /^COMP-/i.test(value)) {
    throw new Error(`${table}.${column} is bigint but coerced value is ${value}`);
  }
}

async function logSchemaAndParam31(v1Id: string): Promise<void> {
  const types = await getPropertyV1FkColumnTypes();
  console.log("FK column storage:");
  for (const [key, storage] of [...types.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`  ${key}: ${storage}`);
  }

  const actionPatch = {
    bldg_name_en: "Param probe",
    operator_company_id: v1Id,
  };
  const coerced = await coercePropertyV1PatchForDb(actionPatch);
  const params = describePropertyV1UpdateParams("BLDG-TEST", coerced);
  const p31 = params.find((p) => p.index === 31);
  console.log(
    `Parameter $31 probe: ${p31 ? `${p31.column}=${JSON.stringify(p31.value)}` : "(patch has < 31 params — operator is earlier)"}`,
  );
  for (const p of params) {
    if (p.column.endsWith("_company_id")) {
      assertNoCompOnBigint("properties_v1", p.column, p.value, types);
    }
  }
}

async function expectedOperatorValue(
  v1Id: string,
  legacyId: number,
  types: Map<string, "bigint" | "text">,
): Promise<string | number> {
  const storage = types.get("properties_v1.operator_company_id") ?? "text";
  return storage === "bigint" ? legacyId : v1Id;
}

async function assertBuildingSaves(): Promise<void> {
  const { legacyId, v1Id } = await sampleCompany();
  const types = await getPropertyV1FkColumnTypes();
  await logSchemaAndParam31(v1Id);

  const propertyId = await createPropertyV1({
    bldg_name_en: `Verify Co Save ${Date.now()}`,
  });

  try {
    const none = await getPropertyV1(propertyId);
    if (none?.operator_company_id != null) throw new Error("expected null operator on create");

    const expected = await expectedOperatorValue(v1Id, legacyId, types);

    await updatePropertyV1(propertyId, {
      operator_company_id: String(legacyId),
    });
    const withOp = await getPropertyV1(propertyId);
    if (String(withOp?.operator_company_id) !== String(expected)) {
      throw new Error(`operator expected ${expected}, got ${withOp?.operator_company_id}`);
    }

    await updatePropertyV1(propertyId, { operator_company_id: null });
    const cleared = await getPropertyV1(propertyId);
    if (cleared?.operator_company_id != null) throw new Error("operator not cleared");

    await updatePropertyV1(propertyId, {
      operator_company_id: v1Id,
    });
    const fromV1Row = await getPropertyV1(propertyId);
    if (String(fromV1Row?.operator_company_id) !== String(expected)) {
      throw new Error(`COMP ref save failed: expected ${expected}, got ${fromV1Row?.operator_company_id}`);
    }

    console.log("OK  building company save (none / legacy / clear / v1)");
  } finally {
    await deletePropertiesV1([propertyId]);
  }
}

async function assertPremisesSaves(): Promise<void> {
  const { legacyId, v1Id } = await sampleCompany();
  const types = await getPropertyV1FkColumnTypes();
  const expected =
    (types.get("premises_v1.operator_company_id") ?? "text") === "bigint" ? legacyId : v1Id;

  const propertyId = await createPropertyV1({ bldg_name_en: `Verify Prem Co ${Date.now()}` });

  try {
    const premisesId = await createPremisesV1(propertyId, { floor: "1", unit: "A" });

    try {
      const lines = await normalizeRelationshipLinesForSave([
        {
          relationship_type: "Operator",
          company_id: String(legacyId),
          contact_id: null,
          contact_role: null,
          partnership_mode: null,
          source_url: null,
          source_file: null,
          remarks: null,
        },
      ]);
      const synced = syncRelationshipColumns(lines);
      const coerced = await coercePremisesV1PatchForDb({
        operator_company_id: synced.operator_company_id,
        relationship_lines: lines,
      });
      assertNoCompOnBigint("premises_v1", "operator_company_id", coerced.operator_company_id, types);

      await updatePremisesV1(premisesId, coerced);

      const row = await getPremisesV1(premisesId);
      if (String(row?.operator_company_id) !== String(expected)) {
        throw new Error(`premises operator expected ${expected}, got ${row?.operator_company_id}`);
      }

      await updatePremisesV1(premisesId, {
        operator_company_id: null,
        relationship_lines: [],
      });
      const cleared = await getPremisesV1(premisesId);
      if (cleared?.operator_company_id != null) throw new Error("premises operator not cleared");

      console.log("OK  premises company save (legacy / clear)");
    } finally {
      await deletePremisesV1([premisesId]);
    }
  } finally {
    await deletePropertiesV1([propertyId]);
  }
}

async function assertGetCompanyWithIdMap(): Promise<void> {
  const row = await query<{ id: number }>(`SELECT id::int AS id FROM companies ORDER BY id LIMIT 1`);
  const id = row[0]?.id;
  if (id == null) throw new Error("No companies to test getCompany");
  const company = await getCompany(id);
  if (!company?.company_name) throw new Error("getCompany failed with id_map join");
  console.log("OK  getCompany with id_map_v1 join");
}

async function main(): Promise<void> {
  await assertGetCompanyWithIdMap();
  await assertBuildingSaves();
  await assertPremisesSaves();
  console.log("\nProperty company save verified.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
