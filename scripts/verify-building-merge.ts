/**
 * Building merge: transfer FKs, field resolution, unique handling, archive, rollback.
 * Usage: npm run verify:building-merge
 *
 * Creates temporary buildings/premises/opportunities/activities and deletes them.
 */
import assert from "node:assert/strict";
import "./ensure-env";
import { query } from "../lib/db";
import { createActivity } from "../lib/repos/activities";
import { mergeBuildings, previewBuildingMerge, resolveLivePropertyId } from "../lib/repos/buildingMerge";
import { addProposedPremises } from "../lib/repos/opportunityProposedPremises";
import { createOpportunity, deleteOpportunity } from "../lib/repos/opportunities";
import { createPremisesV1 } from "../lib/repos/premisesV1";
import {
  createPropertyV1,
  deletePropertiesV1,
  getPropertyV1,
  listPropertiesV1,
} from "../lib/repos/propertiesV1";
import type { BuildingRelationshipLine } from "../lib/buildingRelationships";

const PREFIX = "VERIFY-MERGE-BLDG";

function stamp(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function companyIds(): Promise<[string, string] | null> {
  const rows = await query<{ id: string }>(
    `SELECT COALESCE(NULLIF(trim(business_id), ''), company_id) AS id
     FROM companies_v1
     WHERE COALESCE(NULLIF(trim(business_id), ''), company_id) IS NOT NULL
     ORDER BY company_id ASC
     LIMIT 2`,
  );
  if (rows.length < 2) return null;
  return [rows[0]!.id, rows[1]!.id];
}

async function leftoverPremises(propertyId: string): Promise<number> {
  const rows = await query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM premises_v1 WHERE property_id = $1`,
    [propertyId],
  );
  return Number.parseInt(rows[0]?.n ?? "0", 10);
}

async function cleanup(ids: string[], opportunityIds: number[]): Promise<void> {
  const existing = ids.filter(Boolean);
  if (existing.length > 0) {
    await query(
      `DELETE FROM activities
       WHERE notes LIKE $1
          OR premises_id IN (SELECT premises_id FROM premises_v1 WHERE property_id = ANY($2::text[]))`,
      [`${PREFIX}%`, existing],
    );
  }
  for (const id of opportunityIds) {
    try {
      await deleteOpportunity(id);
    } catch {
      /* ignore */
    }
  }
  if (existing.length > 0) {
    await query(
      `DELETE FROM building_merge_audit WHERE master_property_id = ANY($1::text[]) OR duplicate_property_id = ANY($1::text[])`,
      [existing],
    );
    await deletePropertiesV1(existing);
  }
}

async function main(): Promise<void> {
  const companies = await companyIds();
  const created: string[] = [];
  const opportunities: number[] = [];

  try {
    // 1. Two buildings with no linked records
    const a1 = await createPropertyV1({ bldg_name_en: `${PREFIX} A1 ${stamp()}`, district_en: "Central" });
    const b1 = await createPropertyV1({ bldg_name_en: `${PREFIX} B1 ${stamp()}`, district_en: "Central" });
    created.push(a1, b1);
    const preview1 = await previewBuildingMerge([a1, b1]);
    assert.equal(preview1.buildings.find((item) => item.property.property_id === b1)?.impact.premises, 0);
    const merge1 = await mergeBuildings({ propertyIds: [a1, b1], survivorPropertyId: a1 });
    assert.equal(merge1.survivorPropertyId, a1);
    const archived1 = await getPropertyV1(b1);
    assert.equal(archived1?.merged_into_property_id, a1);
    const listed1 = await listPropertiesV1({ q: PREFIX });
    assert.ok(!listed1.some((row) => row.property_id === b1), "archived duplicate must not appear in active listing");
    assert.ok(listed1.some((row) => row.property_id === a1), "master remains in active listing");
    console.log("OK  1. two buildings with no linked records");

    // 2. Duplicate with Premises
    const a2 = await createPropertyV1({ bldg_name_en: `${PREFIX} A2 ${stamp()}` });
    const b2 = await createPropertyV1({ bldg_name_en: `${PREFIX} B2 ${stamp()}` });
    created.push(a2, b2);
    const p2 = await createPremisesV1(b2, { floor: "10", unit: "1001" });
    const merge2 = await mergeBuildings({ propertyIds: [a2, b2], survivorPropertyId: a2 });
    assert.equal(merge2.impact.premises, 1);
    assert.equal(await leftoverPremises(b2), 0);
    const premises2 = await query<{ property_id: string }>(`SELECT property_id FROM premises_v1 WHERE premises_id = $1`, [p2]);
    assert.equal(premises2[0]?.property_id, a2);
    console.log("OK  2. duplicate with premises");

    // 3. Duplicate with Opportunities
    const a3 = await createPropertyV1({ bldg_name_en: `${PREFIX} A3 ${stamp()}` });
    const b3 = await createPropertyV1({ bldg_name_en: `${PREFIX} B3 ${stamp()}` });
    created.push(a3, b3);
    const p3 = await createPremisesV1(b3, { floor: "11", unit: "1101" });
    const opp3 = await createOpportunity({ client_name: `${PREFIX} Opp 3` });
    opportunities.push(opp3);
    await addProposedPremises(opp3, [p3]);
    const merge3 = await mergeBuildings({ propertyIds: [a3, b3], survivorPropertyId: a3 });
    assert.equal(merge3.impact.opportunities, 1);
    const oppPremises = await query<{ property_id: string }>(
      `SELECT pm.property_id FROM opportunity_proposed_premises opp
       JOIN premises_v1 pm ON pm.premises_id = opp.premises_id
       WHERE opp.opportunity_id = $1`,
      [opp3],
    );
    assert.equal(oppPremises[0]?.property_id, a3);
    console.log("OK  3. duplicate with opportunities");

    // 4 + 5. Same company / operator / landlord on both records
    assert.ok(companies, "need two companies_v1 rows for relationship tests");
    const [companyA, companyB] = companies;
    const ownerLine = (companyId: string): BuildingRelationshipLine => ({
      role: "Owner/Landlord",
      company_id: companyId,
      remarks: "",
    });
    const a4 = await createPropertyV1({
      bldg_name_en: `${PREFIX} A4 ${stamp()}`,
      owner_company_id: companyA,
      operator_company_id: companyB,
      building_relationship_lines: [ownerLine(companyA)],
    });
    const b4 = await createPropertyV1({
      bldg_name_en: `${PREFIX} B4 ${stamp()}`,
      owner_company_id: companyA,
      operator_company_id: companyB,
      building_relationship_lines: [ownerLine(companyA)],
    });
    created.push(a4, b4);
    await mergeBuildings({ propertyIds: [a4, b4], survivorPropertyId: a4 });
    const merged4 = await getPropertyV1(a4);
    const ownerLines = (merged4?.building_relationship_lines ?? []).filter(
      (line) => line.role === "Owner/Landlord" && line.company_id === companyA,
    );
    assert.equal(ownerLines.length, 1, "same company relationship must not duplicate");
    assert.equal(merged4?.owner_company_id, companyA);
    assert.equal(merged4?.operator_company_id, companyB);
    console.log("OK  4/5. same company and operator/landlord are deduped");

    // 6. Conflicting populated fields keep master unless user picks duplicate
    const a6 = await createPropertyV1({
      bldg_name_en: `${PREFIX} Master Name ${stamp()}`,
      grade: "A",
      year_built: 1990,
    });
    const b6 = await createPropertyV1({
      bldg_name_en: `${PREFIX} Dup Name ${stamp()}`,
      grade: "B",
      year_built: 2001,
    });
    created.push(a6, b6);
    await mergeBuildings({
      propertyIds: [a6, b6],
      survivorPropertyId: a6,
      fieldChoices: { grade: b6, year_built: a6 },
    });
    const merged6 = await getPropertyV1(a6);
    assert.equal(merged6?.grade, "B");
    assert.equal(merged6?.year_built, 1990);
    assert.ok(merged6?.bldg_name_en?.includes("Master Name"));
    console.log("OK  6. conflicting fields: master kept unless user chooses duplicate");

    // 7. Empty master field + populated duplicate fills automatically
    const a7 = await createPropertyV1({ bldg_name_en: `${PREFIX} A7 ${stamp()}`, grade: null });
    const b7 = await createPropertyV1({ bldg_name_en: `${PREFIX} B7 Alias ${stamp()}`, grade: "Premium" });
    created.push(a7, b7);
    await mergeBuildings({ propertyIds: [a7, b7], survivorPropertyId: a7 });
    const merged7 = await getPropertyV1(a7);
    assert.equal(merged7?.grade, "Premium");
    assert.ok(merged7?.search_aliases?.some((alias) => alias.includes("B7 Alias")));
    const searchHit = await listPropertiesV1({ q: "B7 Alias" });
    assert.ok(searchHit.some((row) => row.property_id === a7), "master is searchable by duplicate alias");
    console.log("OK  7. empty master field fills from duplicate; alias searchable");

    // 8. Unique constraint (external_ref) handled by transferring onto empty master
    const a8 = await createPropertyV1({ bldg_name_en: `${PREFIX} A8 ${stamp()}` });
    const b8 = await createPropertyV1({ bldg_name_en: `${PREFIX} B8 ${stamp()}` });
    created.push(a8, b8);
    const ext8 = `merge-ext-${stamp()}`;
    await query(`UPDATE properties_v1 SET external_ref = $2 WHERE property_id = $1`, [b8, ext8]);
    await mergeBuildings({ propertyIds: [a8, b8], survivorPropertyId: a8 });
    const masterExt = await query<{ external_ref: string | null }>(
      `SELECT external_ref FROM properties_v1 WHERE property_id = $1`,
      [a8],
    );
    const dupExt = await query<{ external_ref: string | null }>(
      `SELECT external_ref FROM properties_v1 WHERE property_id = $1`,
      [b8],
    );
    assert.equal(masterExt[0]?.external_ref, ext8);
    assert.equal(dupExt[0]?.external_ref, null);
    console.log("OK  8. unique external_ref transferred without constraint failure");

    // 8b. Both populated unique refs: merge still succeeds, master keeps its value
    const a8b = await createPropertyV1({ bldg_name_en: `${PREFIX} A8b ${stamp()}` });
    const b8b = await createPropertyV1({ bldg_name_en: `${PREFIX} B8b ${stamp()}` });
    created.push(a8b, b8b);
    await query(`UPDATE properties_v1 SET external_ref = $2 WHERE property_id = $1`, [a8b, `merge-ext-master-${stamp()}`]);
    await query(`UPDATE properties_v1 SET external_ref = $2 WHERE property_id = $1`, [b8b, `merge-ext-dup-${stamp()}`]);
    await mergeBuildings({ propertyIds: [a8b, b8b], survivorPropertyId: a8b });
    console.log("OK  8b. both unique external_refs coexist through merge");

    // 9. Merge failure rolls back everything
    const a9 = await createPropertyV1({ bldg_name_en: `${PREFIX} A9 ${stamp()}` });
    const b9 = await createPropertyV1({ bldg_name_en: `${PREFIX} B9 ${stamp()}` });
    created.push(a9, b9);
    const p9 = await createPremisesV1(b9, { floor: "12", unit: "1201" });
    await assert.rejects(
      () => mergeBuildings({ propertyIds: [a9, b9], survivorPropertyId: a9, failAfter: "reassign" }),
      /Test-forced merge failure/,
    );
    assert.equal(await leftoverPremises(b9), 1);
    const stillOnDup = await query<{ property_id: string }>(`SELECT property_id FROM premises_v1 WHERE premises_id = $1`, [p9]);
    assert.equal(stillOnDup[0]?.property_id, b9);
    const notArchived = await getPropertyV1(b9);
    assert.equal(notArchived?.merged_into_property_id ?? null, null);
    console.log("OK  9. merge failure rolls back premises and archive");

    // 10–13. Activities, old refs, transferred relationships, zero leftover refs
    const a10 = await createPropertyV1({
      bldg_name_en: `${PREFIX} A10 ${stamp()}`,
      district_en: "Admiralty",
    });
    const b10Name = `${PREFIX} B10 SearchMe ${stamp()}`;
    const b10 = await createPropertyV1({ bldg_name_en: b10Name, district_en: "Admiralty" });
    created.push(a10, b10);
    const p10 = await createPremisesV1(b10, { floor: "3", unit: "301" });
    const activityId = await createActivity({
      activity_date: "2026-09-01",
      activity_type: "Call",
      notes: `${PREFIX} activity`,
      premises_id: p10,
    });
    const opp10 = await createOpportunity({ client_name: `${PREFIX} Opp 10` });
    opportunities.push(opp10);
    await addProposedPremises(opp10, [p10]);
    const b10Row = await getPropertyV1(b10);
    const merge10 = await mergeBuildings({ propertyIds: [a10, b10], survivorPropertyId: a10 });
    assert.equal(merge10.impact.activities, 1);
    assert.equal(await leftoverPremises(b10), 0);
    const listed10 = await listPropertiesV1({ q: "B10 SearchMe" });
    assert.ok(listed10.some((row) => row.property_id === a10));
    assert.ok(!listed10.some((row) => row.property_id === b10));
    assert.equal(await resolveLivePropertyId(b10), a10);
    assert.equal(await resolveLivePropertyId(b10Row?.business_id ?? b10), a10);
    const liveActivity = await query<{ property_id: string }>(
      `SELECT pm.property_id
       FROM activities a
       JOIN premises_v1 pm ON pm.premises_id = a.premises_id
       WHERE a.activity_id = $1`,
      [activityId],
    );
    assert.equal(liveActivity[0]?.property_id, a10);
    const audit = await query<{ n: string }>(
      `SELECT COUNT(*)::text AS n FROM building_merge_audit WHERE duplicate_property_id = $1 AND master_property_id = $2`,
      [b10, a10],
    );
    assert.equal(Number.parseInt(audit[0]?.n ?? "0", 10), 1);
    console.log("OK  10–13. archived hidden, old refs resolve, relationships kept, audit written");

    // A. Selected values combine across records; premises from both migrate
    const aA = await createPropertyV1({
      bldg_name_en: `${PREFIX} NameA ${stamp()}`,
      bldg_name_zh: null,
      district_en: "Central",
    });
    const bA = await createPropertyV1({
      bldg_name_en: `${PREFIX} NameB ${stamp()}`,
      bldg_name_zh: `${PREFIX} CN-B`,
      district_en: "Central",
    });
    created.push(aA, bA);
    await createPremisesV1(aA, { floor: "1", unit: "A1" });
    await createPremisesV1(aA, { floor: "2", unit: "A2" });
    await createPremisesV1(bA, { floor: "1", unit: "B1" });
    await createPremisesV1(bA, { floor: "2", unit: "B2" });
    await createPremisesV1(bA, { floor: "3", unit: "B3" });
    const mergeA = await mergeBuildings({
      propertyIds: [aA, bA],
      survivorPropertyId: aA,
      fieldChoices: { bldg_name_en: aA, bldg_name_zh: bA },
    });
    const mergedA = await getPropertyV1(aA);
    assert.ok(mergedA?.bldg_name_en?.includes("NameA"));
    assert.equal(mergedA?.bldg_name_zh, `${PREFIX} CN-B`);
    assert.equal(mergeA.premisesTransferred, 3);
    assert.equal(await leftoverPremises(aA), 5);
    assert.equal(await leftoverPremises(bA), 0);
    assert.equal((await getPropertyV1(bA))?.merged_into_property_id, aA);
    console.log("OK  A. selected name from A, Chinese name from B, 5 premises on survivor");

    // B. Selected value wins even when a different building ID survives
    const aB = await createPropertyV1({ bldg_name_en: `${PREFIX} SurvB ${stamp()}`, grade: "A", year_built: 1999 });
    const bB = await createPropertyV1({ bldg_name_en: `${PREFIX} OtherB ${stamp()}`, grade: "B", year_built: 2010 });
    created.push(aB, bB);
    await mergeBuildings({
      propertyIds: [aB, bB],
      survivorPropertyId: aB,
      fieldChoices: { grade: bB, year_built: bB, bldg_name_en: aB },
    });
    const mergedB = await getPropertyV1(aB);
    assert.equal(mergedB?.grade, "B");
    assert.equal(mergedB?.year_built, 2010);
    assert.ok(mergedB?.bldg_name_en?.includes("SurvB"));
    console.log("OK  B. selected field values override the surviving record");

    // C. Three buildings: one survives, two archived, all premises migrate
    const aC = await createPropertyV1({ bldg_name_en: `${PREFIX} ThreeA ${stamp()}`, year_built: 2000 });
    const bC = await createPropertyV1({ bldg_name_en: `${PREFIX} ThreeB ${stamp()}`, year_built: 2005 });
    const cC = await createPropertyV1({ bldg_name_en: `${PREFIX} ThreeC ${stamp()}`, year_built: 2006 });
    created.push(aC, bC, cC);
    await createPremisesV1(aC, { floor: "1", unit: "C1" });
    await createPremisesV1(bC, { floor: "2", unit: "C2" });
    await createPremisesV1(cC, { floor: "3", unit: "C3" });
    const previewC = await previewBuildingMerge([aC, bC, cC]);
    assert.equal(previewC.buildings.length, 3);
    const mergeC = await mergeBuildings({
      propertyIds: [aC, bC, cC],
      survivorPropertyId: aC,
      fieldChoices: { bldg_name_en: cC, year_built: bC },
    });
    const mergedC = await getPropertyV1(aC);
    assert.ok(mergedC?.bldg_name_en?.includes("ThreeC"));
    assert.equal(mergedC?.year_built, 2005);
    assert.equal(mergeC.archivedPropertyIds.sort().join(","), [bC, cC].sort().join(","));
    assert.equal(await leftoverPremises(aC), 3);
    assert.equal(await leftoverPremises(bC), 0);
    assert.equal(await leftoverPremises(cC), 0);
    assert.equal((await getPropertyV1(bC))?.merged_into_property_id, aC);
    assert.equal((await getPropertyV1(cC))?.merged_into_property_id, aC);
    console.log("OK  C. three-building merge archives two and migrates all premises");

    const leftoverScan = await query<{ table_name: string; n: string }>(
      `SELECT 'premises_v1'::text AS table_name, COUNT(*)::text AS n
       FROM premises_v1 WHERE property_id = $1
       UNION ALL
       SELECT 'properties_v1_active', COUNT(*)::text
       FROM properties_v1 WHERE property_id = $1 AND merged_into_property_id IS NULL`,
      [b10],
    );
    for (const row of leftoverScan) {
      assert.equal(Number.parseInt(row.n, 10), 0, `${row.table_name} still references duplicate ${b10}`);
    }
    console.log("OK  integrity: zero active business records remain on the duplicate building");
  } finally {
    await cleanup(created, opportunities);
  }

  console.log("verify-building-merge: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
