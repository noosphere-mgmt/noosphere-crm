/**
 * Verify building/premises company field save normalization.
 * Usage: npm run verify:property-company-save
 */
import "./ensure-env";
import { query } from "../lib/db";
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
import { normalizePropertyV1CompanyIdForDb } from "../lib/propertyCompanyFields";
import { normalizeRelationshipLinesForSave, syncRelationshipColumns } from "../lib/premisesRelationships";

async function sampleCompany(): Promise<{ legacyId: number; v1Id: string }> {
  const row = await query<{ legacy_company_id: number; company_id: string }>(
    `SELECT legacy_company_id::int AS legacy_company_id, company_id
     FROM companies_v1 WHERE legacy_company_id IS NOT NULL LIMIT 1`,
  );
  if (!row[0]) throw new Error("No companies_v1 with legacy mapping");
  return { legacyId: row[0].legacy_company_id, v1Id: row[0].company_id };
}

async function assertBuildingSaves(): Promise<void> {
  const { legacyId, v1Id } = await sampleCompany();
  const propertyId = await createPropertyV1({
    bldg_name_en: `Verify Co Save ${Date.now()}`,
  });

  try {
    const none = await getPropertyV1(propertyId);
    if (none?.operator_company_id != null) throw new Error("expected null operator on create");

    const fromLegacy = await normalizePropertyV1CompanyIdForDb(String(legacyId));
    if (fromLegacy !== v1Id) {
      throw new Error(`legacy ${legacyId} => ${fromLegacy}, expected ${v1Id}`);
    }

    await updatePropertyV1(propertyId, { operator_company_id: fromLegacy });
    const withOp = await getPropertyV1(propertyId);
    if (withOp?.operator_company_id !== v1Id) {
      throw new Error(`operator not saved as v1 ref: ${withOp?.operator_company_id}`);
    }

    await updatePropertyV1(propertyId, { operator_company_id: null });
    const cleared = await getPropertyV1(propertyId);
    if (cleared?.operator_company_id != null) throw new Error("operator not cleared");

    const fromV1 = await normalizePropertyV1CompanyIdForDb(v1Id);
    await updatePropertyV1(propertyId, { operator_company_id: fromV1 });
    const fromV1Row = await getPropertyV1(propertyId);
    if (fromV1Row?.operator_company_id !== v1Id) {
      throw new Error("COMP ref save failed");
    }

    console.log("OK  building company save (none / legacy / clear / v1)");
  } finally {
    await deletePropertiesV1([propertyId]);
  }
}

async function assertPremisesSaves(): Promise<void> {
  const { legacyId, v1Id } = await sampleCompany();
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
      await updatePremisesV1(premisesId, {
        operator_company_id: synced.operator_company_id,
        relationship_lines: lines,
      });

      const row = await getPremisesV1(premisesId);
      if (row?.operator_company_id !== v1Id) {
        throw new Error(`premises operator expected ${v1Id}, got ${row?.operator_company_id}`);
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

async function main(): Promise<void> {
  await assertBuildingSaves();
  await assertPremisesSaves();
  console.log("\nProperty company save verified.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
