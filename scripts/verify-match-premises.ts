/**
 * R2 verification: premises matching engine (Phase 42).
 */
import assert from "node:assert/strict";
import "./ensure-env";
import {
  MATCH_SCORE_THRESHOLD,
  passesPremisesHardFilter,
  rankPremisesMatches,
  scorePremisesMatch,
  type PremisesCandidateRow,
} from "../lib/matchPremises";
import { matchPremisesForRequirement } from "../lib/matchPremises";
import type { Opportunity } from "../lib/types/entities";

function baseCandidate(overrides: Partial<PremisesCandidateRow> = {}): PremisesCandidateRow {
  return {
    premises_id: "INV-2026-0002",
    premises_business_id: "P100001",
    floor: "25",
    unit: "2502",
    office_name: null,
    property_category: "Office",
    space_form: "Unit",
    listing_intent: "lease",
    operating_model: "Conventional",
    area_sqft: "1200",
    capacity_pax: 20,
    building_name: "APM Tower",
    building_district: "Kwun Tong",
    monthly_rent: "23500",
    asking_sale_price: null,
    available_date: "2026-06-01",
    inventory_status: "For Lease",
    offer_status: "Available",
    ...overrides,
  };
}

function baseOpportunity(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: 1,
    client_name: "Test Client",
    lead_type: "direct_client",
    company_name: null,
    company_id: null,
    primary_contact_id: null,
    referrer_company_id: null,
    referrer_contact_id: null,
    sales_role: "to_lease",
    lease_term: null,
    expected_close_date: "2026-07-01",
    lost_reason: null,
    relationship_owner: null,
    budget_min: null,
    budget_max: "50000",
    required_area_sqft: "1000",
    required_capacity_pax: 15,
    district_preference: "Kwun Tong",
    workspace_type: null,
    property_type: null,
    property_category_preference: "Office",
    property_type_preference: "Unit",
    target_yield: null,
    funding_status: null,
    move_in_date: "2026-07-01",
    status: "qualifying",
    waiting_for: null,
    next_action: null,
    next_action_date: null,
    requirement_summary: null,
    remarks: null,
    created_at: "",
    updated_at: "",
    ...overrides,
  };
}

function testHardFilterCategory() {
  const opp = baseOpportunity({ property_category_preference: "Office" });
  assert.equal(passesPremisesHardFilter(opp, baseCandidate()), true);
  assert.equal(
    passesPremisesHardFilter(opp, baseCandidate({ property_category: "Retail" })),
    false,
  );
  assert.equal(
    passesPremisesHardFilter(
      baseOpportunity({ property_category_preference: null }),
      baseCandidate({ property_category: "Retail" }),
    ),
    true,
  );
}

function testHardFilterSpaceForm() {
  const opp = baseOpportunity({ property_type_preference: "Whole Floor" });
  assert.equal(
    passesPremisesHardFilter(opp, baseCandidate({ space_form: "Whole Floor" })),
    true,
  );
  assert.equal(passesPremisesHardFilter(opp, baseCandidate({ space_form: "Unit" })), false);
}

function testHardFilterListingIntent() {
  const leaseOpp = baseOpportunity({ sales_role: "to_lease" });
  assert.equal(passesPremisesHardFilter(leaseOpp, baseCandidate({ listing_intent: "lease" })), true);
  assert.equal(passesPremisesHardFilter(leaseOpp, baseCandidate({ listing_intent: "sale" })), false);

  const buyOpp = baseOpportunity({ sales_role: "to_buy" });
  assert.equal(passesPremisesHardFilter(buyOpp, baseCandidate({ listing_intent: "sale" })), true);
  assert.equal(passesPremisesHardFilter(buyOpp, baseCandidate({ listing_intent: "lease" })), false);
}

function testScoreThreshold() {
  const opp = baseOpportunity();
  const good = scorePremisesMatch(opp, baseCandidate());
  assert.ok(good.match_score >= MATCH_SCORE_THRESHOLD, `expected score >= ${MATCH_SCORE_THRESHOLD}, got ${good.match_score}`);
  assert.ok(good.match_reasons.length > 0);
  assert.equal(good.premises_id, "INV-2026-0002");

  const weak = scorePremisesMatch(
    baseOpportunity({
      budget_max: "100",
      district_preference: "Central",
      required_area_sqft: "50000",
      required_capacity_pax: 500,
      move_in_date: "2020-01-01",
    }),
    baseCandidate({ available_date: "2030-01-01" }),
  );
  assert.ok(weak.match_score < good.match_score);
  assert.ok(weak.match_gaps.length > 0);
}

function testRankExcludesFiltered() {
  const opp = baseOpportunity({ property_category_preference: "Retail" });
  const ranked = rankPremisesMatches(opp, [
    baseCandidate({ property_category: "Office" }),
    baseCandidate({ premises_id: "INV-2", property_category: "Retail" }),
  ]);
  assert.equal(ranked.length, 1);
  assert.equal(ranked[0]!.premises_id, "INV-2");
}

async function testLiveMatchQuery() {
  const rows = await matchPremisesForRequirement(
    baseOpportunity({ property_category_preference: null, property_type_preference: null }),
  );
  console.log(`- live match query returned ${rows.length} ranked premises`);
  for (const row of rows.slice(0, 3)) {
    console.log(
      `  · ${row.premises_business_id ?? row.premises_id} score=${row.match_score} ${row.building_name} — ${row.display_label}`,
    );
  }
}

async function main(): Promise<void> {
  console.log("Match premises (Phase 42) verification:");
  testHardFilterCategory();
  testHardFilterSpaceForm();
  testHardFilterListingIntent();
  testScoreThreshold();
  testRankExcludesFiltered();
  await testLiveMatchQuery();
  console.log("OK: Phase 42 matching checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
