/**
 * Verify CRM reference resolution and mixed-ref SQL joins.
 * Usage: npm run verify:crm-ref-resolve
 */
import "./ensure-env";
import { query } from "../lib/db";
import {
  resolveCompanyRef,
  resolveCompanyRefToLegacy,
  resolveCompanyRefToV1,
  resolveContactRef,
  resolveContactRefToLegacy,
} from "../lib/crmRefResolve";
import { getImportObjectDefinition } from "../lib/import/objectRegistry";
import { IMPORT_OBJECT_TYPES } from "../lib/import/types";

async function assertCompanyRefs(): Promise<void> {
  const sample = await query<{ company_id: string; legacy_company_id: number | null }>(
    `SELECT company_id, legacy_company_id::int AS legacy_company_id
     FROM companies_v1 WHERE legacy_company_id IS NOT NULL LIMIT 1`,
  );
  if (!sample[0]?.company_id || sample[0].legacy_company_id == null) {
    console.log("SKIP company refs (no companies_v1 with legacy mapping)");
    return;
  }

  const { company_id: v1Id, legacy_company_id: legacyId } = sample[0];

  const fromV1 = await resolveCompanyRef(v1Id);
  if (fromV1.legacyId !== legacyId || fromV1.v1Id !== v1Id) {
    throw new Error(`COMP resolve failed: ${JSON.stringify(fromV1)}`);
  }

  const fromLegacy = await resolveCompanyRef(String(legacyId));
  if (fromLegacy.legacyId !== legacyId) {
    throw new Error(`numeric company resolve failed: ${JSON.stringify(fromLegacy)}`);
  }

  if ((await resolveCompanyRefToLegacy(v1Id)) !== legacyId) {
    throw new Error("resolveCompanyRefToLegacy(COMP) failed");
  }
  if ((await resolveCompanyRefToV1(String(legacyId))) !== v1Id) {
    throw new Error("resolveCompanyRefToV1(numeric) failed");
  }

  console.log(`OK  company refs (${v1Id} ↔ ${legacyId})`);
}

async function assertContactRefs(): Promise<void> {
  const sample = await query<{ contact_id: string; legacy_contact_id: number | null }>(
    `SELECT contact_id, legacy_contact_id::int AS legacy_contact_id
     FROM contacts_v1 WHERE legacy_contact_id IS NOT NULL LIMIT 1`,
  );
  if (!sample[0]?.contact_id || sample[0].legacy_contact_id == null) {
    console.log("SKIP contact refs (no contacts_v1 with legacy mapping)");
    return;
  }

  const { contact_id: v1Id, legacy_contact_id: legacyId } = sample[0];

  const fromV1 = await resolveContactRef(v1Id);
  if (fromV1.legacyId !== legacyId || fromV1.v1Id !== v1Id) {
    throw new Error(`CONT resolve failed: ${JSON.stringify(fromV1)}`);
  }

  if ((await resolveContactRefToLegacy(v1Id)) !== legacyId) {
    throw new Error("resolveContactRefToLegacy(CONT) failed");
  }

  console.log(`OK  contact refs (${v1Id} ↔ ${legacyId})`);
}

async function assertExports(): Promise<void> {
  const critical: typeof IMPORT_OBJECT_TYPES[number][] = [
    "companies",
    "contacts",
    "buildings",
    "premises",
    "relationships",
    "opportunities",
    "activities",
  ];

  for (const objectType of critical) {
    const def = getImportObjectDefinition(objectType);
    if (!def.exportRows) continue;
    await def.exportRows();
    console.log(`OK  export ${objectType}`);
  }
}

async function assertMixedJoinQueries(): Promise<void> {
  await query(`SELECT COUNT(*)::int AS n FROM properties_v1 p
    LEFT JOIN companies_v1 c ON c.company_id = p.operator_company_id::text
    LIMIT 1`);
  await query(`SELECT COUNT(*)::int AS n FROM premises_v1 pm
    LEFT JOIN companies_v1 c ON c.company_id = pm.operator_company_id::text
    LIMIT 1`);
  console.log("OK  mixed-ref v1 company joins");
}

async function main(): Promise<void> {
  await assertCompanyRefs();
  await assertContactRefs();
  await assertMixedJoinQueries();
  await assertExports();
  console.log("\nCRM reference resolution verified.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
