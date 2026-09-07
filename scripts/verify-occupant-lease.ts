/**
 * Occupant lease: term helpers, relationship-line save/sync, expiry filter, matching.
 * Usage: npm run verify:occupant-lease
 *
 * Creates temporary building/premises rows and deletes them. Does not touch production contacts.
 */
import assert from "node:assert/strict";
import "./ensure-env";
import { query } from "../lib/db";
import {
  formatLeaseTermFromDates,
  leaseExpiryWithinMonths,
  resolveOccupantLeaseTerm,
} from "../lib/occupantLease";
import {
  matchPremisesForRequirement,
  scorePremisesMatch,
  type PremisesCandidateRow,
} from "../lib/matchPremises";
import { buildPremisesRelationshipLinesPatch } from "../lib/premisesRelationshipPatch";
import {
  createPremisesV1,
  deletePremisesV1,
  getPremisesV1,
  listPremisesFlat,
  updatePremisesV1,
} from "../lib/repos/premisesV1";
import { createPropertyV1, deletePropertiesV1 } from "../lib/repos/propertiesV1";
import type { Opportunity } from "../lib/types/entities";
import type { PremisesRelationshipLine } from "../lib/v1ListValues";

function isoDatePlusMonths(months: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

function occupantLine(overrides: Partial<PremisesRelationshipLine> = {}): PremisesRelationshipLine {
  return {
    relationship_type: "Current Occupant",
    company_id: null,
    contact_id: null,
    contact_role: null,
    partnership_mode: null,
    source_url: null,
    source_file: null,
    remarks: null,
    lease_commencement: "2024-01-01",
    lease_expiry: "2027-01-01",
    lease_term: null,
    ...overrides,
  };
}

function testTermHelpers(): void {
  assert.equal(formatLeaseTermFromDates("2023-01-01", "2026-01-01"), "3 years");
  assert.equal(formatLeaseTermFromDates("2024-01-01", "2025-07-01"), "18 months");
  assert.equal(formatLeaseTermFromDates("2024-01-01", "2024-02-01"), "1 month");
  assert.equal(resolveOccupantLeaseTerm("2023-01-01", "2026-01-01", "fixed 2 years"), "fixed 2 years");
  assert.equal(resolveOccupantLeaseTerm("2023-01-01", "2026-01-01", "  "), "3 years");
  assert.equal(leaseExpiryWithinMonths(isoDatePlusMonths(3), 6), true);
  assert.equal(leaseExpiryWithinMonths(isoDatePlusMonths(18), 6), false);
  assert.equal(leaseExpiryWithinMonths("1999-01-01", 12), false);
  console.log("OK  lease commencement / expiry / term helpers");
}

function baseOpportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: 1,
    client_name: "Lease Match",
    lead_type: "direct_client",
    company_name: null,
    company_id: null,
    primary_contact_id: null,
    referrer_company_id: null,
    referrer_contact_id: null,
    sales_role: "to_lease",
    lease_term: null,
    expected_close_date: null,
    lost_reason: null,
    relationship_owner: null,
    budget_min: null,
    budget_max: "50000",
    required_area_sqft: "1000",
    required_capacity_pax: 10,
    district_preference: "Kwun Tong",
    workspace_type: null,
    property_type: null,
    property_category_preference: null,
    property_type_preference: null,
    target_yield: null,
    funding_status: null,
    move_in_date: null,
    status: "qualifying",
    waiting_for: null,
    next_action: null,
    next_action_date: null,
    requirement_summary: null,
    remarks: null,
    commission_income: null,
    related_costs: null,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function testUpcomingVacancyScoring(): void {
  const base: PremisesCandidateRow = {
    premises_id: "INV-LEASE-NEAR",
    premises_business_id: "P100999",
    floor: "8",
    unit: "A",
    office_name: null,
    property_category: "Office",
    space_form: "Unit",
    listing_intent: "lease",
    operating_model: "Conventional",
    area_sqft: "1200",
    capacity_pax: 20,
    building_name: "Lease Tower",
    building_district: "Kwun Tong",
    monthly_rent: "23500",
    asking_sale_price: null,
    available_date: null,
    inventory_status: null,
    offer_status: "Leased",
    occupant_lease_expiry: isoDatePlusMonths(6),
  };
  const near = scorePremisesMatch(baseOpportunity(), base);
  assert.ok(
    near.match_reasons.some((reason) => reason.startsWith("Upcoming vacancy")),
    "leased premises approaching expiry should score as upcoming vacancy",
  );
  const far = scorePremisesMatch(baseOpportunity(), { ...base, premises_id: "INV-LEASE-FAR", occupant_lease_expiry: isoDatePlusMonths(36) });
  assert.ok(
    !far.match_reasons.some((reason) => reason.startsWith("Upcoming vacancy")),
    "leased premises beyond 24 months should not score as upcoming vacancy",
  );
  console.log("OK  matching scores upcoming vacancy for leased premises near expiry");
}

async function ensureLeaseColumns(): Promise<void> {
  const cols = await query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = 'premises_v1'
        AND column_name IN ('occupant_lease_commencement', 'occupant_lease_expiry', 'occupant_lease_term')`,
  );
  if (cols.length === 3) return;
  throw new Error("Phase 79 occupant lease columns are missing. Run npm run db:migrate.");
}

async function testSaveSyncAndFilter(): Promise<void> {
  const marker = `__verify_occupant_lease_${Date.now()}`;
  const nearExpiry = isoDatePlusMonths(4);
  const farExpiry = isoDatePlusMonths(18);
  const propertyId = await createPropertyV1({
    bldg_name_en: marker,
    district_en: "Kwun Tong",
  });
  const premisesIds: string[] = [];
  try {
    const nearId = await createPremisesV1(propertyId, {
      floor: "VL1",
      unit: marker.slice(-6),
      offer_status: "Leased",
      listing_intent: "lease",
      property_category: "Office",
      monthly_rent: 23500,
      gross_area_sqft: 1200,
    });
    premisesIds.push(nearId);
    const farId = await createPremisesV1(propertyId, {
      floor: "VL2",
      unit: `${marker.slice(-6)}F`,
      offer_status: "Leased",
      listing_intent: "lease",
      property_category: "Office",
      monthly_rent: 23500,
      gross_area_sqft: 1200,
    });
    premisesIds.push(farId);

    await updatePremisesV1(nearId, await buildPremisesRelationshipLinesPatch([occupantLine({ lease_expiry: nearExpiry })]));
    await updatePremisesV1(
      farId,
      await buildPremisesRelationshipLinesPatch([
        occupantLine({ lease_commencement: "2020-01-01", lease_expiry: farExpiry, lease_term: "custom term" }),
      ]),
    );

    const near = await getPremisesV1(nearId);
    assert.ok(near, "near-expiry premises missing after save");
    assert.equal((near!.occupant_lease_commencement ?? "").slice(0, 10), "2024-01-01");
    assert.equal((near!.occupant_lease_expiry ?? "").slice(0, 10), nearExpiry);
    assert.equal(near!.occupant_lease_term, formatLeaseTermFromDates("2024-01-01", nearExpiry));
    const storedLine = (near!.relationship_lines ?? []).find((line) => line.relationship_type === "Current Occupant");
    assert.equal((storedLine?.lease_expiry ?? "").slice(0, 10), nearExpiry);

    const far = await getPremisesV1(farId);
    assert.equal((far?.occupant_lease_expiry ?? "").slice(0, 10), farExpiry);
    assert.equal(far?.occupant_lease_term, "custom term");
    console.log("OK  save/sync lease dates onto premises_v1");

    const within6 = await listPremisesFlat({ lease_expiry_within_months: "6", q: marker });
    const within6Ids = new Set(within6.map((row) => row.premises_id));
    assert.ok(within6Ids.has(nearId), "expiry-within-6-months filter should include the near lease");
    assert.ok(!within6Ids.has(farId), "expiry-within-6-months filter should exclude the far lease");

    const within24 = await listPremisesFlat({ lease_expiry_within_months: "24", q: marker });
    const within24Ids = new Set(within24.map((row) => row.premises_id));
    assert.ok(within24Ids.has(nearId) && within24Ids.has(farId), "24-month filter should include both test leases");
    console.log("OK  expiry-within-N-months filtering");

    const matched = await matchPremisesForRequirement(baseOpportunity({ client_name: marker }));
    const matchedIds = new Set(matched.map((row) => row.premises_id));
    assert.ok(matchedIds.has(nearId), "match engine should include leased premises approaching expiry");
    const nearMatch = matched.find((row) => row.premises_id === nearId);
    assert.ok(
      nearMatch?.match_reasons.some((reason) => reason.startsWith("Upcoming vacancy")),
      "matched leased premises should explain upcoming vacancy",
    );
    console.log("OK  matching includes leased premises approaching expiry");
  } finally {
    if (premisesIds.length > 0) await deletePremisesV1(premisesIds);
    await deletePropertiesV1([propertyId]);
  }
}

async function main(): Promise<void> {
  testTermHelpers();
  testUpcomingVacancyScoring();
  await ensureLeaseColumns();
  await testSaveSyncAndFilter();
  console.log("\nOccupant lease verification passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
