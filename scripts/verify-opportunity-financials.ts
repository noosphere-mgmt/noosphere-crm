/**
 * Opportunity financials persistence and Won revenue reporting.
 * Usage: npm run verify:opportunity-financials
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import "./ensure-env";
import { query } from "../lib/db";
import { applyOpportunityPatch, opportunityToInput } from "../lib/inlineRecordMerge";
import {
  formatOpportunityMoney,
  isRealisedWonRevenue,
  opportunityFinancials,
  opportunityNetProfit,
  parseOpportunityMoney,
  summariseEstimatedPipelineFinancials,
  summariseWonOpportunityFinancials,
} from "../lib/opportunityFinancials";
import {
  occupiedPipelineStageCount,
  pipelineValueSegments,
  wonCostsRatio,
  wonCostsRecordCount,
  wonProfitMargin,
  wonRevenueAverage,
  wonRevenueSparkline,
} from "../lib/opportunityKpiVisuals";
import {
  nextOpportunitiesJourneyFilter,
  opportunitiesViewScopeFromFilter,
} from "../lib/opportunitiesList";
import {
  createOpportunity,
  deleteOpportunity,
  getOpportunity,
  updateOpportunity,
  type OpportunityInput,
} from "../lib/repos/opportunities";
import type { Opportunity } from "../lib/types/entities";

function moneyEq(actual: string | null | undefined, expected: number | null): void {
  assert.equal(parseOpportunityMoney(actual), expected);
}

function testUnitCalculations(): void {
  assert.equal(parseOpportunityMoney(""), null);
  assert.equal(parseOpportunityMoney(null), null);
  assert.equal(parseOpportunityMoney("0"), 0);
  assert.equal(parseOpportunityMoney(0), 0);
  assert.equal(parseOpportunityMoney("1,234.56"), 1234.56);
  assert.equal(parseOpportunityMoney("100.5"), 100.5);
  assert.equal(opportunityNetProfit(null, null), null);
  assert.equal(opportunityNetProfit(1000, null), 1000);
  assert.equal(opportunityNetProfit(null, 250), -250);
  assert.equal(opportunityNetProfit(1000, 250), 750);
  assert.equal(opportunityNetProfit(1000, 0), 1000);
  assert.equal(isRealisedWonRevenue("closed_won"), true);
  assert.equal(isRealisedWonRevenue("qualifying"), false);
  assert.equal(isRealisedWonRevenue("negotiating"), false);

  const rows: Opportunity[] = [
    {
      id: 1,
      client_name: "Won A",
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
      status: "closed_won",
      waiting_for: null,
      next_action: null,
      next_action_date: null,
      requirement_summary: null,
      remarks: null,
      commission_income: "1000.00",
      related_costs: "200.50",
      net_profit: "799.50",
      created_at: "",
      updated_at: "",
    },
    {
      id: 2,
      client_name: "Pipeline",
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
      status: "qualifying",
      waiting_for: null,
      next_action: null,
      next_action_date: null,
      requirement_summary: null,
      remarks: null,
      commission_income: "5000",
      related_costs: "100",
      created_at: "",
      updated_at: "",
    },
  ];
  const won = summariseWonOpportunityFinancials(rows);
  assert.equal(won.opp_count, 1);
  assert.equal(won.commission_income, 1000);
  assert.equal(won.related_costs, 200.5);
  assert.equal(won.net_profit, 799.5);
  assert.equal(won.per_opportunity[0]?.id, 1);
  const pipeline = summariseEstimatedPipelineFinancials(rows);
  assert.equal(pipeline.commission_income, 5000);
  assert.equal(pipeline.related_costs, 100);
  assert.equal(pipeline.net_profit, 4900);
  const formatted = formatOpportunityMoney(1234.5);
  assert.match(formatted, /1,234\.50/);
  assert.ok(formatted.includes("HK$") || formatted.includes("HKD"));
  console.log("OK  unit: parse, net profit, won vs pipeline reporting");

  const kpiNow = new Date("2026-09-11T00:00:00");
  const sparkRows = [
    { ...rows[0], updated_at: "2026-07-04T00:00:00Z", commission_income: "1000" },
    { ...rows[0], id: 3, updated_at: "2026-08-20T00:00:00Z", commission_income: "3000" },
  ] as Opportunity[];
  const spark = wonRevenueSparkline(sparkRows, kpiNow);
  assert.ok(spark);
  assert.equal(spark.length, 6);
  assert.equal(spark[3], 1000);
  assert.equal(spark[4], 3000);
  assert.equal(wonRevenueSparkline([sparkRows[0]], kpiNow), null);
  assert.equal(wonCostsRatio(rows), 0.2005);
  assert.equal(wonProfitMargin(rows), 0.7995);
  assert.equal(wonCostsRecordCount(rows), 1);
  assert.equal(wonRevenueAverage(rows), 1000);
  assert.equal(wonCostsRatio([{ ...rows[0], status: "qualifying" } as Opportunity]), null);

  const segmentRows = [
    { ...rows[1], status: "qualifying", commission_income: "2000" },
    { ...rows[1], id: 4, status: "sourcing", commission_income: "8000" },
    { ...rows[1], id: 5, status: "proposal_reviewing", commission_income: "0" },
  ] as Opportunity[];
  const segments = pipelineValueSegments(segmentRows);
  assert.equal(segments.map((segment) => segment.label).join("/"), "Qualifying/Sourcing/Considering/Negotiating");
  assert.equal(segments.find((segment) => segment.status === "sourcing")?.share, 0.8);
  assert.equal(segments.find((segment) => segment.status === "qualifying")?.count, 1);
  assert.equal(occupiedPipelineStageCount(segmentRows), 3);
  console.log("OK  unit: KPI sparkline, ratios, and pipeline value segments");
}

function testJourneyMeterFilters(): void {
  assert.equal(nextOpportunitiesJourneyFilter("active", "qualifying"), "qualifying");
  assert.equal(nextOpportunitiesJourneyFilter("qualifying", "qualifying"), "active");
  assert.equal(nextOpportunitiesJourneyFilter("sourcing", "negotiating"), "negotiating");
  assert.equal(opportunitiesViewScopeFromFilter("qualifying"), "active");
  assert.equal(opportunitiesViewScopeFromFilter("closed"), null);
  assert.equal(opportunitiesViewScopeFromFilter("active"), "active");
  assert.equal(opportunitiesViewScopeFromFilter("won"), "won");
  assert.equal(opportunitiesViewScopeFromFilter("lost"), "lost");
  assert.equal(opportunitiesViewScopeFromFilter("all"), "all");
  console.log("OK  unit: operation status meter toggle and view scope");
}

async function ensureFinancialColumns(): Promise<void> {
  const cols = await query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = 'opportunities'
        AND column_name IN ('commission_income', 'related_costs', 'net_profit')`,
  );
  const names = new Set(cols.map((c) => c.column_name));
  if (names.has("commission_income") && names.has("related_costs") && names.has("net_profit")) {
    return;
  }
  const sqlPath = path.resolve(__dirname, "schema-migrate-phase80-opportunity-financials.sql");
  const sql = await readFile(sqlPath, "utf8");
  await query(sql);
}

function baseInput(overrides: Partial<OpportunityInput> = {}): OpportunityInput {
  return {
    client_name: `Verify Financials ${Date.now()} ${Math.random().toString(16).slice(2)}`,
    lead_type: "direct_client",
    sales_role: "to_lease",
    status: "qualifying",
    ...overrides,
  };
}

async function assertReload(
  id: number,
  expected: { income: number | null; costs: number | null; profit: number | null },
): Promise<Opportunity> {
  const reloaded = await getOpportunity(id);
  assert.ok(reloaded, "opportunity missing after save");
  moneyEq(reloaded.commission_income, expected.income);
  moneyEq(reloaded.related_costs, expected.costs);
  moneyEq(reloaded.net_profit, expected.profit);
  const financials = opportunityFinancials(reloaded);
  assert.equal(financials.commission_income, expected.income);
  assert.equal(financials.related_costs, expected.costs);
  assert.equal(financials.net_profit, expected.profit);
  return reloaded;
}

async function saveViaUpdate(id: number, patch: Partial<OpportunityInput>): Promise<void> {
  const existing = await getOpportunity(id);
  assert.ok(existing);
  await updateOpportunity(id, { ...opportunityToInput(existing), ...patch });
}

async function saveViaPatch(id: number, field: "commission_income" | "related_costs", value: unknown): Promise<void> {
  const existing = await getOpportunity(id);
  assert.ok(existing);
  const merged = applyOpportunityPatch(existing, field, value);
  if ("error" in merged) throw new Error(merged.error);
  await updateOpportunity(id, merged);
}

async function testPersistence(): Promise<void> {
  const created: number[] = [];
  try {
    const commissionOnlyId = await createOpportunity(baseInput({ commission_income: 1500 }));
    created.push(commissionOnlyId);
    await assertReload(commissionOnlyId, { income: 1500, costs: null, profit: 1500 });
    const sidecarTable = await query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables
          WHERE table_schema = current_schema() AND table_name = 'opportunity_commissions'
       ) AS exists`,
    );
    if (sidecarTable[0]?.exists) {
      const sidecarAfterWrite = await query<{ n: string }>(
        `SELECT COUNT(*)::text AS n FROM opportunity_commissions WHERE opportunity_id = $1`,
        [commissionOnlyId],
      );
      assert.equal(Number.parseInt(sidecarAfterWrite[0]?.n ?? "1", 10), 0, "phase-80 writes must not insert sidecar rows");
    }
    console.log("OK  save commission only");

    const costsOnlyId = await createOpportunity(baseInput({ related_costs: 275.25 }));
    created.push(costsOnlyId);
    await assertReload(costsOnlyId, { income: null, costs: 275.25, profit: -275.25 });
    console.log("OK  save costs only");

    const bothId = await createOpportunity(
      baseInput({ commission_income: 10000, related_costs: 1234.56 }),
    );
    created.push(bothId);
    await assertReload(bothId, { income: 10000, costs: 1234.56, profit: 8765.44 });
    console.log("OK  save both values");

    await saveViaUpdate(bothId, { commission_income: 12000, related_costs: 500 });
    await assertReload(bothId, { income: 12000, costs: 500, profit: 11500 });
    console.log("OK  update existing values");

    await saveViaPatch(bothId, "commission_income", "0");
    await assertReload(bothId, { income: 0, costs: 500, profit: -500 });
    await saveViaPatch(bothId, "related_costs", 0);
    await assertReload(bothId, { income: 0, costs: 0, profit: 0 });
    console.log("OK  zero values");

    await saveViaPatch(bothId, "commission_income", "99.99");
    await saveViaPatch(bothId, "related_costs", "10.10");
    const decimalReload = await assertReload(bothId, { income: 99.99, costs: 10.1, profit: 89.89 });
    assert.equal(decimalReload.id, bothId);
    console.log("OK  decimal/currency values + reload persistence");

    const wonId = await createOpportunity(
      baseInput({
        status: "closed_won",
        commission_income: 8000,
        related_costs: 1500,
      }),
    );
    created.push(wonId);
    const pipelineId = await createOpportunity(
      baseInput({
        status: "negotiating",
        commission_income: 99999,
        related_costs: 1,
      }),
    );
    created.push(pipelineId);

    const wonRow = await getOpportunity(wonId);
    const pipelineRow = await getOpportunity(pipelineId);
    assert.ok(wonRow && pipelineRow);
    const summary = summariseWonOpportunityFinancials([wonRow, pipelineRow]);
    assert.equal(summary.opp_count, 1);
    assert.equal(summary.commission_income, 8000);
    assert.equal(summary.related_costs, 1500);
    assert.equal(summary.net_profit, 6500);
    assert.equal(isRealisedWonRevenue(pipelineRow.status), false);
    assert.equal(isRealisedWonRevenue(wonRow.status), true);

    const sqlWon = await query<{
      commission_income: string;
      related_costs: string;
      net_profit: string;
    }>(
      `SELECT commission_income::text, related_costs::text, net_profit::text
         FROM opportunities WHERE id = $1`,
      [wonId],
    );
    moneyEq(sqlWon[0]?.commission_income, 8000);
    moneyEq(sqlWon[0]?.related_costs, 1500);
    moneyEq(sqlWon[0]?.net_profit, 6500);
    console.log("OK  Won Opportunity revenue / net-profit calculation");
  } finally {
    for (const id of created.reverse()) {
      await deleteOpportunity(id);
    }
  }
}

async function inspectExistingSchema(): Promise<void> {
  const oppCols = await query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name = 'opportunities'
        AND column_name IN ('commission_income', 'related_costs', 'net_profit')
      ORDER BY column_name`,
  );
  const sidecar = await query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
        WHERE table_schema = current_schema() AND table_name = 'opportunity_commissions'
     ) AS exists`,
  );
  console.log(
    `Schema: opportunities financial columns = ${oppCols.map((c) => c.column_name).join(", ") || "(none)"}`,
  );
  console.log(`Schema: opportunity_commissions table exists = ${sidecar[0]?.exists === true} (historical; not written)`);
}

async function main(): Promise<void> {
  testUnitCalculations();
  testJourneyMeterFilters();
  await ensureFinancialColumns();
  await inspectExistingSchema();
  await testPersistence();
  console.log("\nOpportunity financials verification passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
