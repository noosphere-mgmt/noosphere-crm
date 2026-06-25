/**
 * Populate permanent business IDs and crosswalk for all existing records.
 * Idempotent: skips rows that already have business_id.
 * Usage: npm run db:populate-business-ids
 */
import "./ensure-env";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { query, withTransaction } from "../lib/db";
import { formatBusinessId, BUSINESS_ID_PREFIX, type BusinessEntityType } from "../lib/businessIds";
import { registerBusinessId } from "../lib/businessIdResolve";

async function nextSeq(entityType: BusinessEntityType, start: number): Promise<number> {
  const rows = await query<{ business_id: string }>(
    `SELECT business_id FROM business_id_crosswalk WHERE entity_type = $1 ORDER BY business_id DESC LIMIT 1`,
    [entityType],
  );
  if (!rows[0]?.business_id) return start;
  const prefix = BUSINESS_ID_PREFIX[entityType].prefix;
  const n = Number.parseInt(rows[0].business_id.slice(prefix.length), 10);
  return Number.isFinite(n) ? n + 1 : start;
}

async function syncLegacyCompanyBusinessIds(): Promise<void> {
  await query(
    `UPDATE companies c
     SET business_id = cv.business_id
     FROM companies_v1 cv
     WHERE cv.legacy_company_id = c.id
       AND cv.business_id IS NOT NULL
       AND c.business_id IS DISTINCT FROM cv.business_id`,
  );
}

async function assignCompanyBusinessIds(): Promise<void> {
  const rows = await query<{
    company_id: string;
    legacy_company_id: number | null;
    business_id: string | null;
  }>(
    `SELECT company_id, legacy_company_id::int AS legacy_company_id, business_id
     FROM companies_v1
     ORDER BY company_id ASC`,
  );
  let seq = await nextSeq("company", 100001);
  for (const row of rows) {
    if (row.business_id) continue;
    const businessId = formatBusinessId("company", seq++);
    await query(`UPDATE companies_v1 SET business_id = $1 WHERE company_id = $2`, [businessId, row.company_id]);
    if (row.legacy_company_id != null) {
      await query(`UPDATE companies SET business_id = $1 WHERE id = $2`, [businessId, row.legacy_company_id]);
    }
    await registerBusinessId({
      entityType: "company",
      businessId,
      primaryRef: row.company_id,
      deprecatedRef: row.company_id,
      legacyNumeric: row.legacy_company_id,
    });
  }
}

async function assignBuildingBusinessIds(): Promise<void> {
  const rows = await query<{ property_id: string; business_id: string | null }>(
    `SELECT property_id, business_id FROM properties_v1 ORDER BY property_id ASC`,
  );
  let seq = await nextSeq("building", 100001);
  for (const row of rows) {
    if (row.business_id) continue;
    const businessId = formatBusinessId("building", seq++);
    await query(`UPDATE properties_v1 SET business_id = $1 WHERE property_id = $2`, [businessId, row.property_id]);
    await registerBusinessId({
      entityType: "building",
      businessId,
      primaryRef: row.property_id,
      deprecatedRef: row.property_id,
    });
  }
}

async function assignPremiseBusinessIds(): Promise<void> {
  const rows = await query<{ premises_id: string; business_id: string | null }>(
    `SELECT premises_id, business_id FROM premises_v1 ORDER BY premises_id ASC`,
  );
  let seq = await nextSeq("premise", 100001);
  for (const row of rows) {
    if (row.business_id) continue;
    const businessId = formatBusinessId("premise", seq++);
    await query(`UPDATE premises_v1 SET business_id = $1 WHERE premises_id = $2`, [businessId, row.premises_id]);
    await registerBusinessId({
      entityType: "premise",
      businessId,
      primaryRef: row.premises_id,
      deprecatedRef: row.premises_id,
    });
  }
}

async function assignContactBusinessIds(): Promise<void> {
  const rows = await query<{
    id: string;
    business_id: string | null;
  }>(`SELECT id::text, business_id FROM contacts ORDER BY id ASC`);
  let seq = await nextSeq("contact", 100001);
  for (const row of rows) {
    if (row.business_id) continue;
    const businessId = formatBusinessId("contact", seq++);
    const legacyId = Number.parseInt(row.id, 10);
    await query(`UPDATE contacts SET business_id = $1 WHERE id = $2`, [businessId, legacyId]);
    await registerBusinessId({
      entityType: "contact",
      businessId,
      primaryRef: row.id,
      legacyNumeric: legacyId,
    });
  }
}

async function assignOpportunityBusinessIds(): Promise<void> {
  const rows = await query<{ id: string; business_id: string | null }>(
    `SELECT id::text, business_id FROM opportunities ORDER BY id ASC`,
  );
  let seq = await nextSeq("opportunity", 100001);
  for (const row of rows) {
    if (row.business_id) continue;
    const businessId = formatBusinessId("opportunity", seq++);
    const legacyId = Number.parseInt(row.id, 10);
    await query(`UPDATE opportunities SET business_id = $1 WHERE id = $2`, [businessId, legacyId]);
    await registerBusinessId({
      entityType: "opportunity",
      businessId,
      primaryRef: row.id,
      legacyNumeric: legacyId,
    });
  }
}

async function assignActivityBusinessIds(): Promise<void> {
  const rows = await query<{ id: string; activity_id: string; business_id: string | null }>(
    `SELECT id::text, activity_id, business_id FROM activities ORDER BY id ASC`,
  );
  let seq = await nextSeq("activity", 100001);
  for (const row of rows) {
    if (row.business_id) continue;
    const businessId = formatBusinessId("activity", seq++);
    await query(`UPDATE activities SET business_id = $1 WHERE id = $2`, [businessId, Number.parseInt(row.id, 10)]);
    await registerBusinessId({
      entityType: "activity",
      businessId,
      primaryRef: row.activity_id,
      deprecatedRef: row.activity_id,
      legacyNumeric: Number.parseInt(row.id, 10),
    });
  }
}

async function rewriteCompanyFkColumns(): Promise<void> {
  const propertyCols = [
    "management_company_id",
    "operator_company_id",
    "owner_company_id",
    "current_tenant_company_id",
  ] as const;
  const premiseCols = [
    "owner_company_id",
    "landlord_company_id",
    "current_tenant_company_id",
    "operator_company_id",
    "source_company_id",
  ] as const;

  for (const col of propertyCols) {
    await query(
      `UPDATE properties_v1 p
       SET ${col} = cv.business_id
       FROM companies_v1 cv
       WHERE p.${col} IS NOT NULL
         AND cv.business_id IS NOT NULL
         AND (p.${col} = cv.company_id OR p.${col} = cv.business_id OR p.${col} = cv.legacy_company_id::text)`,
    );
  }

  for (const col of premiseCols) {
    await query(
      `UPDATE premises_v1 pm
       SET ${col} = cv.business_id
       FROM companies_v1 cv
       WHERE pm.${col} IS NOT NULL
         AND cv.business_id IS NOT NULL
         AND (pm.${col} = cv.company_id OR pm.${col} = cv.business_id OR pm.${col} = cv.legacy_company_id::text)`,
    );
  }

  await query(
    `UPDATE premises_v1 pm
     SET source_contact_id = ct.business_id
     FROM contacts ct
     WHERE pm.source_contact_id IS NOT NULL
       AND ct.business_id IS NOT NULL
       AND (pm.source_contact_id = ct.id::text OR pm.source_contact_id = ct.business_id)`,
  );
}

async function dropOldCompanyFkConstraints(): Promise<void> {
  const businessFk = await query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM pg_constraint WHERE conname LIKE '%_business_fkey'`,
  );
  if (Number.parseInt(businessFk[0]?.n ?? "0", 10) > 0) {
    return;
  }

  const tables = ["properties_v1", "premises_v1"] as const;
  const cols = [
    "management_company_id",
    "operator_company_id",
    "owner_company_id",
    "current_tenant_company_id",
    "landlord_company_id",
    "source_company_id",
  ];
  for (const table of tables) {
    for (const col of cols) {
      await query(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${table}_${col}_fkey`);
    }
  }
}

async function addBusinessIdFkConstraints(): Promise<void> {
  await query(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_v1_business_id
     ON companies_v1 (business_id) WHERE business_id IS NOT NULL`,
  );

  const pairs: Array<[string, string]> = [
    ["properties_v1", "management_company_id"],
    ["properties_v1", "operator_company_id"],
    ["properties_v1", "owner_company_id"],
    ["properties_v1", "current_tenant_company_id"],
  ];
  for (const [table, col] of pairs) {
    const constraint = `${table}_${col}_business_fkey`;
    const exists = await query<{ n: string }>(
      `SELECT COUNT(*)::text AS n FROM pg_constraint WHERE conname = $1`,
      [constraint],
    );
    if (exists[0]?.n !== "0") continue;
    await query(
      `ALTER TABLE ${table}
       ADD CONSTRAINT ${constraint}
       FOREIGN KEY (${col}) REFERENCES companies_v1(business_id)
       ON DELETE SET NULL
       NOT VALID`,
    );
  }
}

async function main(): Promise<void> {
  await runPopulateBusinessIds();
}

export async function runPopulateBusinessIds(): Promise<void> {
  const phase34 = await readFile(
    path.join(__dirname, "schema-migrate-phase34-business-ids.sql"),
    "utf8",
  );
  await query(phase34);

  await withTransaction(async () => {
    await assignCompanyBusinessIds();
    await syncLegacyCompanyBusinessIds();
    await assignBuildingBusinessIds();
    await assignPremiseBusinessIds();
    await assignContactBusinessIds();
    await assignOpportunityBusinessIds();
    await assignActivityBusinessIds();
    await dropOldCompanyFkConstraints();
    await rewriteCompanyFkColumns();
    await addBusinessIdFkConstraints();
  });

  const counts = await query<{ entity_type: string; n: string }>(
    `SELECT entity_type, COUNT(*)::text AS n FROM business_id_crosswalk GROUP BY entity_type ORDER BY entity_type`,
  );
  console.log("business_id_crosswalk:");
  for (const row of counts) console.log(`  ${row.entity_type}: ${row.n}`);
  console.log("populate-business-ids: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
