/**
 * Opportunity Contact selector: visibility vs Contact list, historical links, sort, search.
 * Run: npm run verify:opportunity-contact-select
 */
import "./ensure-env";
import {
  contactMatchesSelectSearch,
  contactsForCompany,
  selectableContactsForCompany,
  sortContactsAlphabetically,
} from "../lib/contactCompanyFilter";
import { isSelectableContact } from "../lib/contactVisibility";
import {
  formatContactOptionLabel,
  formatLabelWithBusinessId,
  toLegacyContactSelectOptions,
} from "../lib/crmSelectOptions";
import { query } from "../lib/db";
import {
  createContact,
  deleteContact,
  listContactOptions,
  listContacts,
  listVisibleContactOptions,
  type ContactOption,
} from "../lib/repos/contacts";
import { createOpportunity, deleteOpportunity, getOpportunity } from "../lib/repos/opportunities";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertArrayEqual(actual: string[], expected: string[], label: string): void {
  assertEqual(actual.join("|"), expected.join("|"), label);
}

function contact(partial: Partial<ContactOption> & Pick<ContactOption, "id" | "contact_name">): ContactOption {
  return {
    company_id: null,
    is_primary: false,
    is_active: true,
    ...partial,
  };
}

const companies = [
  { id: 1, company_name: "Acme", business_id: "C100001" },
  { id: 2, company_name: "Other Co", business_id: "C100002" },
];

const contacts: ContactOption[] = [
  contact({
    id: 10,
    company_id: 1,
    contact_name: "zeta",
    business_id: "D100010",
  }),
  contact({
    id: 11,
    company_id: 1,
    contact_name: "Alpha",
    business_id: "D100011",
    chinese_name: "甲",
  }),
  contact({
    id: 12,
    company_id: 2,
    contact_name: "Beta Other Co",
    business_id: "D100012",
  }),
  contact({
    id: 13,
    company_id: null,
    contact_name: "karis",
    business_id: "D100013",
    chinese_name: "嘉莉",
  }),
  contact({
    id: 14,
    company_id: 1,
    contact_name: "alpha",
    business_id: "D100014",
  }),
  contact({
    id: 15,
    company_id: 1,
    contact_name: "Hidden Twin",
    business_id: "D100015",
    is_active: false,
  }),
];

function ids(list: ContactOption[]): string[] {
  return list.map((row) => row.business_id ?? String(row.id));
}

function searchHits(query: string, pool: ContactOption[] = contacts): string[] {
  const options = toLegacyContactSelectOptions(pool);
  const optionByValue = new Map(options.map((option) => [option.value, option]));
  return pool
    .filter((row) => contactMatchesSelectSearch(row, query, optionByValue.get(row.business_id ?? "")))
    .map((row) => row.business_id ?? String(row.id));
}

function testUnitVisibilityAndUsability(): void {
  const selectable = contacts.filter(isSelectableContact);
  assert(!ids(selectable).includes("D100015"), "inactive/hidden contact is not selectable");
  assert(ids(selectable).includes("D100011"), "active contact remains selectable");

  const sortedAll = sortContactsAlphabetically(selectable);
  assertArrayEqual(
    ids(sortedAll),
    ["D100011", "D100014", "D100012", "D100013", "D100010"],
    "case-insensitive A–Z by display name, then business ID",
  );
  assertArrayEqual(
    ids(sortContactsAlphabetically(selectable)),
    ids(sortContactsAlphabetically([...selectable].reverse())),
    "sort is deterministic regardless of input order",
  );

  const options = toLegacyContactSelectOptions(selectable);
  assertArrayEqual(
    options.map((option) => option.label),
    [
      formatLabelWithBusinessId("Alpha", "D100011"),
      formatLabelWithBusinessId("alpha", "D100014"),
      formatLabelWithBusinessId("Beta Other Co", "D100012"),
      formatLabelWithBusinessId("karis", "D100013"),
      formatLabelWithBusinessId("zeta", "D100010"),
    ],
    "option labels keep Name (D######) and sort A–Z",
  );

  const historicalLabel = formatContactOptionLabel("Hidden Twin", "D100015", false);
  assertEqual(historicalLabel, "Hidden Twin (D100015) · Inactive", "historical inactive label");

  const withCompany = selectableContactsForCompany(contacts, "C100001", companies);
  assertArrayEqual(
    ids(withCompany),
    ["D100011", "D100014", "D100010", "D100013"],
    "company selected → that company's active contacts A–Z, then unaffiliated A–Z",
  );
  assert(!ids(withCompany).includes("D100015"), "inactive company contact is not a selectable option");
  assert(!ids(withCompany).includes("D100012"), "other-company contacts stay excluded when a company is selected");
  assert(ids(withCompany).includes("D100013"), "unaffiliated active contacts remain selectable");

  const sameName = [
    contact({ id: 21, contact_name: "Karis", business_id: "D100021" }),
    contact({ id: 22, contact_name: "Karis", business_id: "D100022" }),
  ];
  assertArrayEqual(
    ids(sortContactsAlphabetically(sameName)),
    ["D100021", "D100022"],
    "same display name: both active records stay distinct, ordered by contact ID",
  );

  assertArrayEqual(searchHits("ALPHA", selectable), ["D100011", "D100014"], "search matches English/display name");
  assertArrayEqual(searchHits("嘉莉", selectable), ["D100013"], "search matches Chinese name");
  assertArrayEqual(searchHits("d100012", selectable), ["D100012"], "search matches contact ID");
}

async function testRepositoryVisibility(): Promise<void> {
  const stamp = `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  const prefix = `__verify_contact_select_${stamp}`;
  const createdContactIds: number[] = [];
  const createdOpportunityIds: number[] = [];

  async function makeContact(name: string, isActive = true): Promise<number> {
    const id = await createContact({
      contact_name: `${prefix} ${name}`,
      display_name: `${prefix} ${name}`,
      is_active: isActive,
    });
    createdContactIds.push(id);
    return id;
  }

  try {
    const activeId = await makeContact("Active");
    const hiddenId = await makeContact("Hidden", false);
    const archivedId = await makeContact("Archived", false);
    const mergedId = await makeContact("Merged", false);
    const supersededId = await makeContact("Superseded", false);
    const laterDeletedId = await makeContact("SoftDeleted");

    const visibleOptions = await listVisibleContactOptions();
    const visibleIds = new Set(visibleOptions.map((row) => Number(row.id)));
    const listIds = new Set((await listContacts()).map((row) => Number(row.id)));

    assert(visibleIds.has(activeId), "active contact appears in Opportunity options");
    assert(listIds.has(activeId), "active contact appears on the Contact list");
    assert(!visibleIds.has(hiddenId), "hidden/inactive contact does not appear in Opportunity options");
    assert(!listIds.has(hiddenId), "hidden/inactive contact does not appear on the Contact list");
    assert(!visibleIds.has(archivedId), "archived contact does not appear in Opportunity options");
    assert(!listIds.has(archivedId), "archived contact does not appear on the Contact list");
    assert(!visibleIds.has(mergedId), "merged/superseded contact does not appear in Opportunity options");
    assert(!visibleIds.has(supersededId), "superseded contact does not appear in Opportunity options");

    await deleteContact(laterDeletedId);
    const remaining = await query<{ is_active: boolean | string }>(
      `SELECT is_active FROM contacts WHERE id = $1`,
      [laterDeletedId],
    );
    assert(remaining.length === 1, "Contact UI delete must keep the row (soft-delete)");
    assert(remaining[0]!.is_active === false || remaining[0]!.is_active === "f", "soft-delete sets is_active = FALSE");
    const afterDelete = await listVisibleContactOptions();
    assert(
      !afterDelete.some((row) => row.id === laterDeletedId),
      "soft-deleted contact does not appear among selectable options",
    );
    assert(
      !(await listContacts()).some((row) => Number(row.id) === laterDeletedId),
      "soft-deleted contact does not appear on the Contact list",
    );

    const opportunityId = await createOpportunity({
      client_name: `${prefix} opportunity`,
      lead_type: "direct_client",
      sales_role: "to_lease",
      status: "qualifying",
      primary_contact_id: archivedId,
    });
    createdOpportunityIds.push(opportunityId);

    const reloaded = await getOpportunity(opportunityId);
    assert(Boolean(reloaded), "opportunity missing after save");
    assertEqual(reloaded!.primary_contact_id, archivedId, "existing Opportunity keeps the archived contact link");
    assert(
      String(reloaded!.primary_contact_name ?? "").includes("Archived"),
      "existing Opportunity still displays the historical contact name",
    );
    assertEqual(reloaded!.primary_contact_is_active, false, "historical contact is flagged inactive");

    const withHistorical = await listContactOptions([archivedId]);
    assert(
      withHistorical.some((row) => row.id === archivedId && row.is_active === false),
      "historical includeIds returns the archived contact for display",
    );
    assert(
      !selectableContactsForCompany(withHistorical, "", []).some((row) => row.id === archivedId),
      "archived contact is not in the normal selectable picker list",
    );

    const activeRow = withHistorical.find((row) => row.id === activeId);
    assert(Boolean(activeRow), "active contact missing from options");
    const options = toLegacyContactSelectOptions([activeRow!]);
    assert(
      options[0]?.label.includes(`(${activeRow!.business_id})`),
      "selectable label preserves contact ID",
    );
    assert(
      contactMatchesSelectSearch(activeRow!, prefix, options[0]),
      "search matches the created active contact name",
    );
    assert(
      contactMatchesSelectSearch(activeRow!, activeRow!.business_id ?? "", options[0]),
      "search matches the created active contact ID",
    );

    console.log("Opportunity contact selector repository verification passed.");
  } finally {
    for (const id of createdOpportunityIds) {
      await deleteOpportunity(id).catch(() => undefined);
    }
    if (createdContactIds.length > 0) {
      await query(`DELETE FROM contacts WHERE id = ANY($1::bigint[])`, [createdContactIds]);
    }
  }
}

async function main(): Promise<void> {
  testUnitVisibilityAndUsability();
  console.log("Opportunity contact selector unit verification passed.");
  await testRepositoryVisibility();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
