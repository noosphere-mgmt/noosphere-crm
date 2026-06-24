/**
 * Verify relationship_lines coercion and countPremisesRelationships safety.
 * Run: npm run db:verify-relationship-lines
 */
import assert from "node:assert/strict";
import { asArray } from "../lib/asArray";
import { countPremisesRelationships, normalizePremisesRelationshipLines } from "../lib/premisesRelationships";
import { normalizePremisesV1Client } from "../lib/premisesClientData";
import type { PremisesV1 } from "../lib/repos/premisesV1";

function basePremises(overrides: Partial<PremisesV1> = {}): PremisesV1 {
  return {
    premises_id: "INV-2026-0007",
    business_id: null,
    property_id: "BLDG-2026-0007",
    property_name_en: null,
    property_name_zh: null,
    property_type: null,
    centre_type: null,
    inventory_status: null,
    ownership_type: null,
    floor: "12",
    unit: "A",
    workstation_count: null,
    office_name: null,
    office_type: null,
    gross_area_sqft: null,
    net_area_sqft: null,
    view_type: null,
    windows: null,
    management_fee: null,
    government_rates: null,
    remarks: null,
    owner_company_id: null,
    landlord_company_id: null,
    current_tenant_company_id: null,
    operator_company_id: null,
    source_company_id: null,
    source_contact_id: null,
    source_contact_role: null,
    offer_type: null,
    offer_status: null,
    capacity_pax: null,
    monthly_rent: null,
    rent_psf: null,
    deposit_months: null,
    rent_free_period: null,
    contract_term_months: null,
    available_date: null,
    commission_rate: null,
    currency: "HKD",
    asking_sale_price: null,
    sale_price_psf: null,
    negotiable_sale_price: null,
    negotiable_sale_price_psf: null,
    expected_commission: null,
    payout_commission: null,
    commission_remarks: null,
    source_file: null,
    source_url: null,
    operating_model: null,
    fit_out_condition: null,
    relationship_lines: null,
    last_verified_date: null,
    listing_remarks: null,
    updated_at: "",
    ...overrides,
  };
}

function testAsArray() {
  assert.deepEqual(asArray(null), []);
  assert.deepEqual(asArray(undefined), []);
  assert.deepEqual(asArray(""), []);
  assert.deepEqual(asArray("[]"), []);
  assert.deepEqual(asArray("  []  "), []);
  assert.deepEqual(asArray("{}"), []);
  assert.deepEqual(asArray({}), []);
  assert.deepEqual(asArray("not-json"), []);
  assert.deepEqual(asArray('[{"relationship_type":"Owner"}]'), [{ relationship_type: "Owner" }]);
  assert.deepEqual(asArray([1, 2]), [1, 2]);
}

function testProductionCrashCase() {
  const raw = basePremises({
    relationship_lines: "[]" as unknown as PremisesV1["relationship_lines"],
  });

  const normalized = normalizePremisesV1Client(raw);
  assert.ok(Array.isArray(normalized.relationship_lines));
  assert.equal(normalized.relationship_lines.length, 0);

  assert.doesNotThrow(() => countPremisesRelationships(raw));
  assert.doesNotThrow(() => countPremisesRelationships(normalized));

  const lines = normalizePremisesRelationshipLines("[]");
  assert.ok(Array.isArray(lines));
  assert.equal(typeof (lines as unknown as { filter?: unknown }).filter, "function");
  lines.filter(() => true);
}

async function testDatabaseIfAvailable() {
  try {
    const { query } = await import("../lib/db");
    const bad = await query<{ n: string }>(
      `SELECT COUNT(*)::text AS n
       FROM premises_v1
       WHERE relationship_lines IS NOT NULL
         AND jsonb_typeof(relationship_lines) IS DISTINCT FROM 'array'`,
    );
    const count = Number.parseInt(bad[0]?.n ?? "0", 10);
    if (count > 0) {
      console.warn(`Database has ${count} premise(s) with non-array relationship_lines — run db:fix-relationship-lines`);
    } else {
      console.log("Database relationship_lines types: ok");
    }
  } catch {
    console.log("Database check skipped (no connection)");
  }
}

async function main() {
  testAsArray();
  testProductionCrashCase();
  await testDatabaseIfAvailable();
  console.log("verify-premises-relationship-lines: passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
