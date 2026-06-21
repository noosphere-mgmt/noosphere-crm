/**
 * Verify import/export lookup columns: present, lookupOnly, and adjacent to ID.
 * Run: npm run verify:import-lookup-fields
 */
import assert from "node:assert/strict";
import { getImportObjectDefinition, listExportFields } from "../lib/import/objectRegistry";
import type { ImportObjectType } from "../lib/import/types";
import { buildNaturalKeyParts, splitNaturalKeyParts } from "../lib/import/matchRecord";

type ObjectType = ImportObjectType;

function assertAdjacentLookup(objectType: ObjectType, pairs: [string, string][]) {
  const fields = listExportFields(objectType);
  const keys = fields.map((f) => f.key);
  const fieldByKey = new Map(getImportObjectDefinition(objectType).fields.map((f) => [f.key, f]));

  for (const [idField, nameField] of pairs) {
    assert.ok(keys.includes(idField), `${objectType}: export missing ${idField}`);
    assert.ok(keys.includes(nameField), `${objectType}: export missing ${nameField}`);

    const nameDef = fieldByKey.get(nameField);
    assert.equal(nameDef?.lookupOnly, true, `${objectType}: ${nameField} must be lookupOnly`);

    const idIndex = keys.indexOf(idField);
    const nameIndex = keys.indexOf(nameField);
    assert.equal(
      nameIndex,
      idIndex + 1,
      `${objectType}: ${nameField} must immediately follow ${idField} (got indices ${idIndex}, ${nameIndex})`,
    );
  }
}

const ALL_LOOKUPS: Record<ObjectType, [string, string][]> = {
  contacts: [["company_id", "company_name_en"]],
  buildings: [
    ["management_company_id", "management_company_name_en"],
    ["operator_company_id", "operator_company_name_en"],
    ["owner_company_id", "owner_company_name_en"],
  ],
  premises: [
    ["building_id", "building_name_en"],
    ["operator_company_id", "operator_company_name_en"],
    ["owner_company_id", "owner_company_name_en"],
  ],
  opportunities: [
    ["company_id", "company_name_en"],
    ["assigned_contact_id", "assigned_contact_name"],
  ],
  activities: [
    ["company_id", "company_name_en"],
    ["contact_id", "contact_name"],
    ["opportunity_id", "opportunity_name"],
    ["premises_id", "premises_name"],
  ],
  activity_premises: [
    ["activity_id", "activity_name"],
    ["premises_id", "premises_name"],
  ],
  opportunity_parties: [
    ["opportunity_id", "opportunity_name"],
    ["company_id", "company_name_en"],
    ["contact_id", "contact_name"],
  ],
  opportunity_proposed_premises: [
    ["opportunity_id", "opportunity_name"],
    ["premises_id", "premises_name"],
  ],
  relationships: [
    ["from_entity_id", "from_entity_name"],
    ["to_entity_id", "to_entity_name"],
  ],
  companies: [],
};

function main() {
  for (const [objectType, pairs] of Object.entries(ALL_LOOKUPS) as [ObjectType, [string, string][]][]) {
    assertAdjacentLookup(objectType, pairs);
  }

  const key = buildNaturalKeyParts(["Anson Tong | 唐卓越", "8"]);
  const parts = splitNaturalKeyParts(key, 2);
  assert.deepEqual(parts, ["anson tong | 唐卓越", "8"]);

  console.log("verify-import-lookup-fields: OK");
}

main();
