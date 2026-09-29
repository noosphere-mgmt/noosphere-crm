/**
 * Home dashboard pipeline value, pulse metrics, and per-opportunity bubbles.
 * Usage: npm run verify:dashboard-home
 */
import assert from "node:assert/strict";
import { layoutPipelineOpportunityChart } from "../lib/dashboardPipelineChart";
import {
  buildDashboardPipelineBlocks,
  buildPipelineOpportunityPoints,
  DASHBOARD_PIPELINE_STAGES,
  sumUnweightedPipelineValue,
} from "../lib/dashboardPipelineStages";
import { buildDashboardInsights } from "../lib/dashboardInsights";
import { buildDashboardPulseMetrics, firstNameFromDisplayName, greetingForHour } from "../lib/dashboardPulse";
import { OPPORTUNITY_STATUS_PROBABILITY } from "../lib/lookups";
import { pipelinePointInHorizon } from "../lib/opportunityStartDate";
import {
  formatOpportunityMoneyCompact,
  summariseEstimatedPipelineFinancials,
} from "../lib/opportunityFinancials";
import type { Opportunity } from "../lib/types/entities";

function deal(overrides: Partial<Opportunity> & Pick<Opportunity, "id" | "client_name" | "status">): Opportunity {
  return {
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

function testPipelineValueIsNotProbabilityWeighted(): void {
  const qualifying = DASHBOARD_PIPELINE_STAGES.find((stage) => stage.id === "qualifying");
  const negotiating = DASHBOARD_PIPELINE_STAGES.find((stage) => stage.id === "negotiating");
  assert.ok(qualifying && negotiating);
  const deals = [
    deal({ id: 1, client_name: "Low-probability potential", status: "qualifying", commission_income: "10000" }),
    deal({ id: 2, client_name: "Negotiating", status: "negotiating", commission_income: "4000" }),
    deal({ id: 3, client_name: "Won — excluded from pipeline value", status: "closed_won", commission_income: "8000" }),
  ];

  const qualifyingValue = sumUnweightedPipelineValue(deals, qualifying);
  const negotiatingValue = sumUnweightedPipelineValue(deals, negotiating);
  const pipeline = summariseEstimatedPipelineFinancials(deals);
  const weightedIfConfusedWithStatus =
    10000 * ((OPPORTUNITY_STATUS_PROBABILITY.qualifying ?? 0) / 100) +
    4000 * ((OPPORTUNITY_STATUS_PROBABILITY.negotiating ?? 0) / 100);

  assert.equal(qualifyingValue, 10000);
  assert.equal(negotiatingValue, 4000);
  assert.equal(pipeline.commission_income, 14000);
  assert.notEqual(pipeline.commission_income, weightedIfConfusedWithStatus);
  console.log("OK  pipeline value is unweighted potential, including low-probability status");
}

function testActivePipelineBubblesExcludeClosed(): void {
  const deals = [
    deal({ id: 1, client_name: "Q", status: "qualifying", commission_income: "1000" }),
    deal({ id: 2, client_name: "S", status: "sourcing", commission_income: "2000", has_viewing_premises: true }),
    deal({ id: 3, client_name: "N", status: "negotiating", commission_income: "3000" }),
    deal({ id: 4, client_name: "Won", status: "closed_won", commission_income: "9000" }),
    deal({ id: 5, client_name: "Lost", status: "closed_lost", commission_income: "500" }),
  ];
  const blocks = buildDashboardPipelineBlocks(deals);
  assert.ok(!blocks.some((block) => block.id === "closed_won" || block.id === "closed_lost"));
  const points = buildPipelineOpportunityPoints(deals);
  assert.equal(points.length, 3);
  assert.ok(points.every((point) => point.status !== "closed_won" && point.status !== "closed_lost"));
  assert.equal(points.find((point) => point.status === "qualifying")?.chance, OPPORTUNITY_STATUS_PROBABILITY.qualifying);
  assert.equal(points.find((point) => point.status === "sourcing")?.chance, OPPORTUNITY_STATUS_PROBABILITY.sourcing);
  const pipeline = summariseEstimatedPipelineFinancials(deals);
  assert.equal(pipeline.commission_income, 6000);
  console.log("OK  one bubble per open opportunity; closed outcomes excluded");
}

function testPerOpportunityChartUsesDateAndChance(): void {
  const deals = [
    deal({
      id: 1,
      client_name: "Kingenta",
      status: "sourcing",
      commission_income: "420000",
      expected_close_date: "2026-09-30",
      company_name: "Kingenta Co",
    }),
    deal({
      id: 2,
      client_name: "Unscheduled",
      status: "qualifying",
      commission_income: "10000",
      expected_close_date: null,
    }),
    deal({
      id: 3,
      client_name: "Won",
      status: "closed_won",
      commission_income: "8000",
      expected_close_date: "2026-09-01",
    }),
  ];
  const points = buildPipelineOpportunityPoints(deals);
  const layout = layoutPipelineOpportunityChart(points, new Date("2026-09-11T04:00:00"));
  assert.equal(layout.bubbles.length, 2);
  assert.equal(layout.unscheduledCount, 1);
  const scheduled = layout.bubbles.find((bubble) => bubble.id === 1);
  const unscheduled = layout.bubbles.find((bubble) => bubble.id === 2);
  assert.ok(scheduled && unscheduled);
  assert.equal(scheduled.scheduled, true);
  assert.equal(unscheduled.scheduled, false);
  assert.ok(scheduled.x > unscheduled.x);
  assert.ok(scheduled.r > unscheduled.r);
  assert.ok(scheduled.y < unscheduled.y);
  assert.equal(scheduled.chance, 25);
  assert.equal(unscheduled.chance, 10);
  assert.ok(layout.gridX.some((tick) => /Sep 26/i.test(tick.label)));
  console.log("OK  bubble chart uses expected close date, existing chance, and value size");
}

function testBusinessPulse(): void {
  const now = new Date("2026-09-11T04:00:00Z");
  const deals = [
    deal({ id: 1, client_name: "New", status: "qualifying", commission_income: "1000", created_at: "2026-09-02", updated_at: "2026-09-02" }),
    deal({ id: 2, client_name: "Old", status: "sourcing", commission_income: "2000", created_at: "2026-08-01", updated_at: "2026-08-01" }),
    deal({
      id: 6,
      client_name: "Stale",
      status: "qualifying",
      commission_income: "500",
      created_at: "2026-06-01",
      updated_at: "2026-06-01",
      last_activity_date: "2026-06-01",
    }),
    deal({ id: 3, client_name: "Won month", status: "closed_won", commission_income: "8000", created_at: "2026-07-01", updated_at: "2026-09-05" }),
    deal({ id: 4, client_name: "Won earlier", status: "closed_won", commission_income: "2000", created_at: "2026-01-01", updated_at: "2026-01-20" }),
    deal({ id: 5, client_name: "Lost", status: "closed_lost", commission_income: "0", created_at: "2026-02-01", updated_at: "2026-02-01" }),
  ];
  const pulse = buildDashboardPulseMetrics(deals, now);
  assert.equal(pulse.new_this_month, 1);
  assert.equal(pulse.won_this_month, 1);
  assert.equal(pulse.won_count, 2);
  assert.equal(pulse.lost_count, 1);
  assert.equal(pulse.win_rate, 67);
  assert.equal(pulse.avg_won_deal_size, 5000);
  assert.equal(pulse.won_revenue, 10000);
  assert.equal(pulse.active_count, 3);
  assert.equal(pulse.pipeline_value, 3500);
  assert.equal(pulse.stale_over_60, 1);
  assert.ok(pulse.avg_days_in_pipeline != null && pulse.avg_days_in_pipeline > 0);
  assert.equal(firstNameFromDisplayName("Teresa Cheuk"), "Teresa");
  assert.equal(greetingForHour(9), "Good morning");
  assert.equal(greetingForHour(15), "Good afternoon");
  console.log("OK  business pulse uses live counts without invented trends");
}

function testDashboardInsights(): void {
  const now = new Date("2026-09-11T04:00:00Z");
  const deals = [
    deal({
      id: 1,
      client_name: "Kingenta",
      status: "sourcing",
      commission_income: "9000",
      expected_close_date: "2026-08-12",
      last_activity_date: "2026-07-01",
      created_at: "2026-06-01",
    }),
    deal({
      id: 2,
      client_name: "Amazon Address",
      status: "qualifying",
      commission_income: "1000",
      expected_close_date: "2026-10-30",
      last_activity_date: "2026-09-10",
      created_at: "2026-09-01",
    }),
    deal({
      id: 3,
      client_name: "Won",
      status: "closed_won",
      commission_income: "8000",
      created_at: "2026-01-01",
    }),
  ];
  const insights = buildDashboardInsights(
    deals,
    [
      { entity_key: "c1", entity_type: "company", entity_id: 1, business_id: "C100009", party_name: "Kammy Cui Company", total_opps: 2, active_opps: 1, won_opps: 0 },
      { entity_key: "c2", entity_type: "company", entity_id: 2, business_id: "C100010", party_name: "Quiet Referrer", total_opps: 2, active_opps: 0, won_opps: 2 },
    ],
    now,
  );
  assert.match(insights.priority.text, /Kingenta/);
  assert.match(insights.priority.text, /no recorded activity/);
  assert.match(insights.pipeline.text, /90%/);
  assert.match(insights.pipeline.text, /Kingenta/);
  assert.doesNotMatch(insights.pipeline.text, /Pipeline value is HK\$/);
  assert.match(insights.channel.text, /Quiet Referrer/);
  assert.match(insights.channel.text, /reconnect/i);

  const empty = buildDashboardInsights([], [], now);
  assert.match(empty.priority.text, /no active opportunities/i);
  assert.match(empty.pipeline.text, /no active opportunities/i);
  assert.match(empty.channel.text, /No referring parties/);
  console.log("OK  dashboard insights are rule-based and not KPI repeats");
}

function testFutureStartIsOutsideCurrentPipeline(): void {
  const deals = [
    deal({ id: 1, client_name: "Already active", status: "qualifying", commission_income: "1000", start_date: null }),
    deal({ id: 2, client_name: "Starts today", status: "sourcing", commission_income: "2000", start_date: "2026-09-28" }),
    deal({ id: 3, client_name: "Future renewal", status: "qualifying", commission_income: "9000", start_date: "2027-07-24" }),
    deal({ id: 4, client_name: "Won earlier", status: "closed_won", commission_income: "4000", start_date: "2027-01-01" }),
  ];
  const now = new Date(2026, 8, 28, 12, 0, 0);
  const pipeline = summariseEstimatedPipelineFinancials(deals);
  const pulse = buildDashboardPulseMetrics(deals, now);
  const points = buildPipelineOpportunityPoints(deals);
  const insights = buildDashboardInsights(deals, [], now);
  assert.equal(pipeline.commission_income, 3000);
  assert.equal(pipeline.opp_count, 2);
  assert.equal(pulse.pipeline_value, 3000);
  assert.equal(pulse.active_count, 2);
  assert.equal(pulse.won_count, 1);
  assert.equal(points.length, 3);
  assert.ok(points.some((point) => point.name === "Future renewal"));
  assert.ok(points.every((point) => point.status !== "closed_won"));
  assert.doesNotMatch(insights.pipeline.text, /Future renewal/);
  console.log("OK  future start stays out of pulse and value; Pipeline Analysis All still includes it");
}

function testPipelineAllIncludesFutureStart(): void {
  const today = "2026-09-29";
  const deals = [
    deal({
      id: 1,
      client_name: "Currently active",
      status: "sourcing",
      commission_income: "1000",
      start_date: "2026-09-01",
      expected_close_date: "2026-11-15",
    }),
    deal({
      id: 2,
      client_name: "Future start A",
      status: "qualifying",
      commission_income: "2000",
      start_date: "2027-01-15",
      expected_close_date: "2027-02-01",
    }),
    deal({
      id: 3,
      client_name: "Future start B",
      status: "negotiating",
      commission_income: "3000",
      start_date: "2026-12-01",
      expected_close_date: null,
    }),
    deal({
      id: 4,
      client_name: "Won",
      status: "closed_won",
      commission_income: "8000",
      start_date: "2027-02-01",
      expected_close_date: "2026-10-01",
    }),
    deal({
      id: 5,
      client_name: "Lost",
      status: "closed_lost",
      commission_income: "500",
      start_date: null,
      expected_close_date: "2026-10-20",
    }),
  ];
  const points = buildPipelineOpportunityPoints(deals);
  assert.deepEqual(
    points.map((point) => point.name).sort(),
    ["Currently active", "Future start A", "Future start B"],
  );

  const all = points.filter((point) => pipelinePointInHorizon(point, "all", today));
  assert.equal(all.length, 3);
  assert.equal(
    all.reduce((sum, point) => sum + point.value, 0),
    6000,
  );

  const next3 = points.filter((point) => pipelinePointInHorizon(point, "next_3_months", today));
  assert.deepEqual(
    next3.map((point) => point.name),
    ["Currently active"],
  );

  const next6 = points.filter((point) => pipelinePointInHorizon(point, "next_6_months", today));
  assert.deepEqual(
    next6.map((point) => point.name).sort(),
    ["Currently active", "Future start A"],
  );

  const layout = layoutPipelineOpportunityChart(all, new Date(2026, 8, 29, 12, 0, 0));
  assert.equal(layout.bubbles.length, 3);
  assert.equal(layout.unscheduledCount, 1);
  assert.ok(layout.bubbles.every((bubble) => Number.isFinite(bubble.x) && Number.isFinite(bubble.y) && bubble.r > 0));
  const unscheduled = layout.bubbles.find((bubble) => bubble.name === "Future start B");
  const scheduled = layout.bubbles.find((bubble) => bubble.name === "Future start A");
  assert.ok(unscheduled && scheduled);
  assert.equal(unscheduled.scheduled, false);
  assert.equal(scheduled.scheduled, true);
  assert.ok(scheduled.x > unscheduled.x);
  console.log("OK  Pipeline Analysis All includes future starts; horizons use expected close date");
}

function testCompactMoney(): void {
  assert.equal(formatOpportunityMoneyCompact(null), "—");
  assert.equal(formatOpportunityMoneyCompact(950), "HK$950");
  assert.equal(formatOpportunityMoneyCompact(420_000), "HK$420K");
  assert.equal(formatOpportunityMoneyCompact(4_200_000), "HK$4.2M");
  assert.equal(formatOpportunityMoneyCompact(12_500_000), "HK$12.5M");
  console.log("OK  compact money formatting");
}

function main(): void {
  testPipelineValueIsNotProbabilityWeighted();
  testActivePipelineBubblesExcludeClosed();
  testPerOpportunityChartUsesDateAndChance();
  testBusinessPulse();
  testDashboardInsights();
  testFutureStartIsOutsideCurrentPipeline();
  testPipelineAllIncludesFutureStart();
  testCompactMoney();
}

main();
