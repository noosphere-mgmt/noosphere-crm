/**
 * Agency links and opportunity contact eligibility.
 * One agent contact can cover every company that agency is attached to.
 * Run: npm run verify:contact-related-companies
 */
import "./ensure-env";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { formatPrimeContactOptionLabel } from "../lib/crmSelectOptions";
import { primeContactsForOpportunityCompany } from "../lib/contactCompanyFilter";
import {
  contactEligibleAsPrimeContact,
  primeContactContext,
  primeContactSaveDecision,
} from "../lib/contactRelatedCompanies";
import { query } from "../lib/db";
import { opportunityToInput } from "../lib/inlineRecordMerge";
import { createContact, getContact, listContactOptions } from "../lib/repos/contacts";
import { createOpportunity, deleteOpportunity, getOpportunity, updateOpportunity } from "../lib/repos/opportunities";
import { createRelationship, deleteRelationship } from "../lib/repos/relationships";
import type { ContactOption } from "../lib/repos/contacts";

function option(partial: Partial<ContactOption> & Pick<ContactOption, "id" | "contact_name">): ContactOption {
  return { company_id: null, is_primary: false, is_active: true, ...partial };
}

function testDecisions(): void {
  const kept = primeContactSaveDecision({
    nextCompanyId: 2,
    nextContactId: 9,
    previousCompanyId: 2,
    previousContactId: 9,
    eligible: false,
  });
  assert.equal("contactId" in kept ? kept.contactId : null, 9, "unchanged historical prime contact stays");

  const cleared = primeContactSaveDecision({
    nextCompanyId: 3,
    nextContactId: 9,
    previousCompanyId: 2,
    previousContactId: 9,
    eligible: false,
  });
  assert.equal("contactId" in cleared ? cleared.contactId : null, null, "company change clears an ineligible contact");

  const john = option({
    id: 1,
    contact_name: "John Chan",
    company_id: 1,
    primary_company_name: "ABC Agency",
    linked_company_ids: [2],
  });
  const mary = option({
    id: 2,
    contact_name: "Mary Wong",
    company_id: 2,
    primary_company_name: "XYZ Client Ltd",
    linked_company_ids: [1],
  });
  const stranger = option({ id: 3, contact_name: "Stranger", company_id: 9, linked_company_ids: [] });
  assert.equal(contactEligibleAsPrimeContact(mary, 2), true);
  assert.equal(contactEligibleAsPrimeContact(john, 2), true, "a related contact is eligible for the company");
  assert.equal(contactEligibleAsPrimeContact(mary, 1), true, "a contact related back to the company is eligible");
  assert.equal(contactEligibleAsPrimeContact(stranger, 2), false);

  const companies = [
    { id: 1, company_name: "ABC Agency" },
    { id: 2, company_name: "XYZ Client Ltd" },
  ];
  const choices = primeContactsForOpportunityCompany([stranger, john, mary], 2, companies);
  assert.deepEqual(choices.map((row) => row.id), [2, 1]);
  assert.match(formatPrimeContactOptionLabel(john, 2, companies), /John Chan — ABC Agency/);
  assert.equal(primeContactContext(john, 2, companies), "ABC Agency");
  assert.match(formatPrimeContactOptionLabel(mary, 1, companies), /Mary Wong — XYZ Client Ltd/);
}

async function testDatabase(): Promise<void> {
  const sql = await readFile(path.join(__dirname, "schema-migrate-phase86-company-agencies.sql"), "utf8");
  assert.equal(/INSERT\s+INTO\s+contacts/i.test(sql), false, "migration must not copy contacts");
  await query(sql);

  const stamp = `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  const companyIds: number[] = [];
  const contactIds: number[] = [];
  const opportunityIds: number[] = [];

  async function company(name: string, role: string): Promise<number> {
    const rows = await query<{ id: string }>(
      `INSERT INTO companies (company_name, roles, is_active)
       VALUES ($1, ARRAY[$2]::text[], TRUE)
       RETURNING id::text AS id`,
      [`${stamp} ${name}`, role],
    );
    const id = Number.parseInt(rows[0]!.id, 10);
    companyIds.push(id);
    return id;
  }
  async function contact(name: string, companyId: number): Promise<number> {
    const id = await createContact({
      contact_name: `${stamp} ${name}`,
      display_name: `${stamp} ${name}`,
      company_id: companyId,
    });
    contactIds.push(id);
    return id;
  }

  try {
    const abc = await company("ABC Agency", "agency");
    const xyz = await company("XYZ Client Ltd", "client");
    const strangerCompany = await company("Unrelated Ltd", "client");
    const john = await contact("John Chan", abc);
    const mary = await contact("Mary Wong", xyz);
    const stranger = await contact("Stranger", strangerCompany);
    const relationshipId = await createRelationship({
      from_entity_type: "company",
      from_entity_id: String(xyz),
      to_entity_type: "contact",
      to_entity_id: String(john),
      relationship_type: "Represents",
    });
    assert.equal(Number((await getContact(john))?.company_id), abc, "a related contact keeps their own company");

    const options = await listContactOptions([john, mary, stranger]);
    const companies = [
      { id: abc, company_name: "ABC Agency" },
      { id: xyz, company_name: "XYZ Client Ltd" },
    ];
    const xyzChoices = primeContactsForOpportunityCompany(options, xyz, companies).map((row) => row.id);
    assert.equal(xyzChoices.includes(mary), true, "the company's own contact stays listed");
    assert.equal(xyzChoices.includes(john), true, "a related contact is listed");
    assert.equal(xyzChoices.includes(stranger), false, "an unrelated contact is not listed");
    assert.equal(xyzChoices[0], mary, "the company's own contacts are listed first");

    const savedId = await createOpportunity({
      client_name: `${stamp} XYZ opportunity`,
      company_id: xyz,
      primary_contact_id: john,
      sales_role: "to_lease",
      status: "qualifying",
    });
    opportunityIds.push(savedId);
    const saved = await getOpportunity(savedId);
    assert.equal(Number(saved?.company_id), xyz);
    assert.equal(Number(saved?.primary_contact_id), john);

    await assert.rejects(
      () =>
        createOpportunity({
          client_name: `${stamp} invalid`,
          company_id: xyz,
          primary_contact_id: stranger,
          sales_role: "to_lease",
          status: "qualifying",
        }),
      /related contact/i,
    );

    await deleteRelationship(relationshipId);
    const historical = await getOpportunity(savedId);
    assert.equal(Number(historical?.primary_contact_id), john, "removing the relationship does not delete the opportunity contact");
    const keptInput = opportunityToInput(historical!);
    keptInput.waiting_for = "Still the same prime contact";
    await updateOpportunity(savedId, keptInput);
    assert.equal(
      Number((await getOpportunity(savedId))?.primary_contact_id),
      john,
      "resaving without a company change keeps the historical prime contact",
    );
    await assert.rejects(
      () =>
        createOpportunity({
          client_name: `${stamp} XYZ after removal`,
          company_id: xyz,
          primary_contact_id: john,
          sales_role: "to_lease",
          status: "qualifying",
        }),
      /related contact/i,
    );

    const movedInput = opportunityToInput((await getOpportunity(savedId))!);
    movedInput.company_id = strangerCompany;
    await updateOpportunity(savedId, movedInput);
    const moved = await getOpportunity(savedId);
    assert.ok(moved, "opportunity remains after the company change");
    assert.equal(Number(moved?.company_id), strangerCompany);
    assert.equal(moved?.primary_contact_id, null, "ineligible prime contact is cleared when the company changes");
    assert.equal(Number((await getContact(john))?.company_id), abc);
  } finally {
    for (const id of opportunityIds) await deleteOpportunity(id).catch(() => undefined);
    if (contactIds.length > 0) {
      await query(`DELETE FROM contacts WHERE id = ANY($1::bigint[])`, [contactIds]);
    }
    if (companyIds.length > 0) {
      await query(`DELETE FROM companies WHERE id = ANY($1::bigint[])`, [companyIds]);
    }
    await query(`DELETE FROM companies WHERE company_name LIKE $1`, [`${stamp} %`]);
  }
}

async function main(): Promise<void> {
  testDecisions();
  await testDatabase();
  console.log("OK  opportunity contact lists company contacts and related contacts");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
