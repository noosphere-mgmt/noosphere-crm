/**
 * Phase 36 affiliation primary uniqueness: preserve rows, at most one primary.
 * Usage: npm run verify:contact-affiliation-primary
 *
 * Creates temporary companies/contacts and deletes them. Does not edit production people.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "path";
import "./ensure-env";
import { query } from "../lib/db";

const INDEX_SQL = `CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_company_affiliations_one_primary
  ON contact_company_affiliations(contact_id)
  WHERE is_primary = TRUE`;

function extractNormalizeSql(phase36: string): string {
  const start = "-- BEGIN normalize-contact-affiliation-primary";
  const end = "-- END normalize-contact-affiliation-primary";
  const from = phase36.indexOf(start);
  const to = phase36.indexOf(end);
  assert.ok(from >= 0 && to > from, "phase 36 is missing the normalize-contact-affiliation-primary section");
  return phase36.slice(from, to + end.length);
}

async function affiliationCount(contactId: number): Promise<number> {
  const rows = await query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM contact_company_affiliations WHERE contact_id = $1`,
    [contactId],
  );
  return Number.parseInt(rows[0]?.n ?? "0", 10);
}

async function primaryIds(contactId: number): Promise<number[]> {
  const rows = await query<{ id: string }>(
    `SELECT id::text AS id FROM contact_company_affiliations
      WHERE contact_id = $1 AND is_primary = TRUE
      ORDER BY id ASC`,
    [contactId],
  );
  return rows.map((row) => Number.parseInt(row.id, 10));
}

async function insertAffiliation(
  contactId: number,
  companyId: number,
  isPrimary: boolean,
  endDate: string | null = null,
): Promise<number> {
  const rows = await query<{ id: string }>(
    `INSERT INTO contact_company_affiliations (contact_id, company_id, is_primary, end_date)
     VALUES ($1, $2, $3, $4::date)
     RETURNING id::text AS id`,
    [contactId, companyId, isPrimary, endDate],
  );
  return Number.parseInt(rows[0]!.id, 10);
}

async function duplicatePrimaryContacts(): Promise<number> {
  const rows = await query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM (
       SELECT contact_id FROM contact_company_affiliations
        WHERE is_primary = TRUE
        GROUP BY contact_id
       HAVING COUNT(*) > 1
     ) d`,
  );
  return Number.parseInt(rows[0]?.n ?? "0", 10);
}

async function indexExists(): Promise<boolean> {
  const rows = await query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM pg_indexes
        WHERE schemaname = current_schema()
          AND indexname = 'idx_contact_company_affiliations_one_primary'
     ) AS exists`,
  );
  return rows[0]?.exists === true;
}

async function insertCompany(name: string): Promise<number> {
  const rows = await query<{ id: string }>(
    `INSERT INTO companies (company_name, is_active) VALUES ($1, TRUE) RETURNING id::text AS id`,
    [name],
  );
  return Number.parseInt(rows[0]!.id, 10);
}

async function insertContact(name: string, companyId: number | null): Promise<number> {
  const rows = await query<{ id: string }>(
    `INSERT INTO contacts (company_id, contact_name, display_name, is_active)
     VALUES ($1, $2, $2, TRUE)
     RETURNING id::text AS id`,
    [companyId, name],
  );
  return Number.parseInt(rows[0]!.id, 10);
}

async function cleanup(contactIds: number[], companyIds: number[]): Promise<void> {
  if (contactIds.length > 0) {
    await query(`DELETE FROM contact_company_affiliations WHERE contact_id = ANY($1::bigint[])`, [contactIds]);
    await query(`DELETE FROM contacts WHERE id = ANY($1::bigint[])`, [contactIds]);
  }
  if (companyIds.length > 0) {
    await query(`DELETE FROM companies WHERE id = ANY($1::bigint[])`, [companyIds]);
  }
}

async function main(): Promise<void> {
  const phase36 = await readFile(
    path.join(__dirname, "schema-migrate-phase36-contact-company-affiliations.sql"),
    "utf8",
  );
  const normalizeSql = extractNormalizeSql(phase36);
  await query(phase36);
  assert.equal(await duplicatePrimaryContacts(), 0, "phase 36 must leave no duplicate primaries");

  const prefix = `__verify_aff_primary_${Date.now()}`;
  const companyIds: number[] = [];
  const contactIds: number[] = [];

  try {
    await query(`DROP INDEX IF EXISTS idx_contact_company_affiliations_one_primary`);

    const companyA = await insertCompany(`${prefix} A`);
    const companyB = await insertCompany(`${prefix} B`);
    const companyC = await insertCompany(`${prefix} C`);
    companyIds.push(companyA, companyB, companyC);

    const contactCanonical = await insertContact(`${prefix} canonical`, companyA);
    const contactOldest = await insertContact(`${prefix} oldest-primary`, null);
    const contactCurrent = await insertContact(`${prefix} current-primary`, null);
    const contactPromote = await insertContact(`${prefix} promote-canonical`, companyC);
    contactIds.push(contactCanonical, contactOldest, contactCurrent, contactPromote);

    const a1 = await insertAffiliation(contactCanonical, companyA, true);
    const a2 = await insertAffiliation(contactCanonical, companyB, true);
    const canonicalBefore = await affiliationCount(contactCanonical);

    const o1 = await insertAffiliation(contactOldest, companyA, true);
    await insertAffiliation(contactOldest, companyB, true);

    const ended = await insertAffiliation(contactCurrent, companyA, true, "2000-01-01");
    const current = await insertAffiliation(contactCurrent, companyB, true, null);

    const pA = await insertAffiliation(contactPromote, companyA, true);
    const pB = await insertAffiliation(contactPromote, companyB, true);
    const pC = await insertAffiliation(contactPromote, companyC, false);
    const promoteBefore = await affiliationCount(contactPromote);

    assert.equal((await primaryIds(contactCanonical)).length, 2);
    assert.equal((await primaryIds(contactPromote)).length, 2);

    await query(normalizeSql);
    await query(normalizeSql);
    assert.equal(await duplicatePrimaryContacts(), 0, "normalize must clear every duplicate-primary contact");

    assert.equal(await affiliationCount(contactCanonical), canonicalBefore, "canonical contact affiliations preserved");
    assert.deepEqual(await primaryIds(contactCanonical), [a1], "contacts.company_id affiliation stays primary");
    assert.equal(
      (
        await query<{ is_primary: boolean }>(`SELECT is_primary FROM contact_company_affiliations WHERE id = $1`, [a2])
      )[0]?.is_primary,
      false,
    );

    assert.deepEqual(await primaryIds(contactOldest), [o1], "without company_id, lowest-id current primary wins");
    assert.equal(await affiliationCount(contactOldest), 2);

    assert.deepEqual(
      await primaryIds(contactCurrent),
      [current],
      "without company_id, a current primary wins over an ended primary",
    );
    assert.notEqual(ended, current);
    assert.equal(await affiliationCount(contactCurrent), 2);

    assert.equal(await affiliationCount(contactPromote), promoteBefore, "promote-canonical affiliations preserved");
    assert.deepEqual(
      await primaryIds(contactPromote),
      [pC],
      "canonical company_id affiliation becomes primary even if it was not previously",
    );
    for (const id of [pA, pB]) {
      assert.equal(
        (
          await query<{ is_primary: boolean }>(`SELECT is_primary FROM contact_company_affiliations WHERE id = $1`, [id])
        )[0]?.is_primary,
        false,
      );
    }

    await query(INDEX_SQL);
    await query(INDEX_SQL);
    await query(normalizeSql);
    await query(phase36);
    assert.equal(await duplicatePrimaryContacts(), 0);
    assert.equal(await indexExists(), true, "unique primary index must exist after normalize");
  } finally {
    await cleanup(contactIds, companyIds);
    await query(INDEX_SQL);
  }

  console.log("Contact affiliation primary uniqueness verification passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
