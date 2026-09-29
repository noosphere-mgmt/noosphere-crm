/**
 * Opportunity Start Date, current-pipeline, listing-window, and owner-default checks.
 * Usage: npm run verify:opportunity-start-date
 */
import assert from "node:assert/strict";
import {
  OPPORTUNITY_DEFAULT_OWNER_NAME,
  pickCrmOwnerByDisplayName,
  pickDefaultCrmOwner,
  resolveRecordOwner,
} from "../lib/crmOwner";
import { summariseEstimatedPipelineFinancials, summariseWonOpportunityFinancials } from "../lib/opportunityFinancials";
import {
  addCalendarMonths,
  isActiveOpportunityStart,
  opportunityMatchesDateWindow,
  pipelinePointInHorizon,
} from "../lib/opportunityStartDate";
import type { Opportunity } from "../lib/types/entities";

const TODAY = "2026-09-28";

function deal(overrides: Partial<Opportunity> = {}): Opportunity {
  return {
    id: 1,
    client_name: "Test opportunity",
    lead_type: "direct_client",
    company_name: null,
    company_id: null,
    primary_contact_id: null,
    referrer_company_id: null,
    referrer_contact_id: null,
    sales_role: "others",
    lease_term: null,
    expected_close_date: null,
    start_date: null,
    lost_reason: null,
    relationship_owner: null,
    budget_min: null,
    budget_max: null,
    required_area_sqft: null,
    required_capacity_pax: null,
    district_preference: null,
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
    commission_income: "1000",
    related_costs: null,
    created_at: "2026-09-28T00:00:00.000Z",
    updated_at: "2026-09-28T00:00:00.000Z",
    ...overrides,
  };
}

function testActiveRule(): void {
  assert.equal(isActiveOpportunityStart(null, TODAY), true, "NULL remains active");
  assert.equal(isActiveOpportunityStart(TODAY, TODAY), true, "today is active");
  assert.equal(isActiveOpportunityStart("2026-09-29", TODAY), false, "tomorrow is future");
}

function testCalendarWindows(): void {
  const inTwoMonths = addCalendarMonths(TODAY, 2);
  const inFiveMonths = addCalendarMonths(TODAY, 5);
  const inEightMonths = addCalendarMonths(TODAY, 8);

  const activeFutureClose = { start_date: null, expected_close_date: inTwoMonths };
  assert.equal(opportunityMatchesDateWindow(activeFutureClose, "active", TODAY), true);
  assert.equal(opportunityMatchesDateWindow(activeFutureClose, "next_3_months", TODAY), true);
  assert.equal(opportunityMatchesDateWindow(activeFutureClose, "next_6_months", TODAY), true);

  const closesInFiveMonths = { start_date: "2999-01-01", expected_close_date: inFiveMonths };
  assert.equal(opportunityMatchesDateWindow(closesInFiveMonths, "active", TODAY), false);
  assert.equal(opportunityMatchesDateWindow(closesInFiveMonths, "next_3_months", TODAY), false);
  assert.equal(opportunityMatchesDateWindow(closesInFiveMonths, "next_6_months", TODAY), true);

  const closesInEightMonths = { start_date: "2999-01-01", expected_close_date: inEightMonths };
  assert.equal(opportunityMatchesDateWindow(closesInEightMonths, "active", TODAY), false);
  assert.equal(opportunityMatchesDateWindow(closesInEightMonths, "next_3_months", TODAY), false);
  assert.equal(opportunityMatchesDateWindow(closesInEightMonths, "next_6_months", TODAY), false);
  assert.equal(opportunityMatchesDateWindow(closesInEightMonths, "all", TODAY), true);

  assert.equal(addCalendarMonths("2027-01-31", 1), "2027-02-28", "calendar-month end clamps");

  const closingSoon = { expectedClose: inTwoMonths };
  const closingLater = { expectedClose: inEightMonths };
  const unscheduled = { expectedClose: null };
  assert.equal(pipelinePointInHorizon(closingSoon, "next_3_months", TODAY), true);
  assert.equal(pipelinePointInHorizon(closingLater, "next_3_months", TODAY), false);
  assert.equal(pipelinePointInHorizon({ expectedClose: inFiveMonths }, "next_3_months", TODAY), false);
  assert.equal(pipelinePointInHorizon(closingSoon, "next_6_months", TODAY), true);
  assert.equal(pipelinePointInHorizon(closingLater, "next_6_months", TODAY), false);
  assert.equal(pipelinePointInHorizon(unscheduled, "next_6_months", TODAY), false);
  assert.equal(pipelinePointInHorizon(closingLater, "all", TODAY), true);
  assert.equal(pipelinePointInHorizon(unscheduled, "all", TODAY), true);
}

function testPipelineAndHistory(): void {
  const rows = [
    deal({ id: 1, start_date: null, commission_income: "1000" }),
    deal({ id: 2, start_date: TODAY, commission_income: "2000" }),
    deal({ id: 3, start_date: "2999-01-01", commission_income: "4000" }),
    deal({ id: 4, status: "closed_won", start_date: "2999-01-01", commission_income: "8000" }),
  ];

  // The far-future row is deterministic regardless of when this verification runs.
  const pipeline = summariseEstimatedPipelineFinancials(rows);
  assert.equal(pipeline.opp_count, 2);
  assert.equal(pipeline.commission_income, 3000);

  const won = summariseWonOpportunityFinancials(rows);
  assert.equal(won.opp_count, 1, "completed reporting remains historical");
  assert.equal(won.commission_income, 8000);
}

function testOwnerDefault(): void {
  const teresa = {
    id: 42,
    display_name: "Teresa Cheuk",
    user_type: "human",
    login_enabled: true,
    is_active: true,
  };
  const other = {
    id: 7,
    display_name: "Future User",
    user_type: "human",
    login_enabled: false,
    is_active: true,
  };
  const resolved = pickDefaultCrmOwner([other, teresa]);
  assert.equal(resolved?.id, 42, "generic default still comes from the login-enabled CRM record");
  assert.equal(resolveRecordOwner(null, resolved?.display_name), "Teresa Cheuk");
  assert.equal(resolveRecordOwner("Explicit Owner", resolved?.display_name), "Explicit Owner");

  const earlierLogin = {
    id: 3,
    display_name: "Earlier Login",
    user_type: "human",
    login_enabled: true,
    is_active: true,
  };
  const named = pickCrmOwnerByDisplayName([earlierLogin, other, teresa], OPPORTUNITY_DEFAULT_OWNER_NAME);
  assert.equal(named?.id, 42, "new opportunity owner resolves the existing Teresa Cheuk record");
  assert.equal(named?.display_name, "Teresa Cheuk");
  assert.equal(pickCrmOwnerByDisplayName([earlierLogin], OPPORTUNITY_DEFAULT_OWNER_NAME), null);
  assert.equal(resolveRecordOwner("Explicit Owner", named?.display_name), "Explicit Owner");
  assert.equal(resolveRecordOwner(null, named?.display_name), named?.display_name);
  assert.equal(resolveRecordOwner("  ", named?.display_name), named?.display_name);
}

testActiveRule();
testCalendarWindows();
testPipelineAndHistory();
testOwnerDefault();
console.log("OK  opportunity start date, pipeline, calendar windows, history, and owner defaults");
