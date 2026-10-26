import { OPPORTUNITY_STATUSES, OPPORTUNITY_STATUS_LABELS, normalizeOpportunityStatus } from "../lib/opportunityStatusModel";
import { opportunityMatchesListStatusFilter, opportunityMatchesListQuickFilter } from "../lib/opportunitiesList";
import { isOpportunityOverdue } from "../lib/opportunityStartDate";
import { buildDashboardPipelineBlocks } from "../lib/dashboardPipelineStages";
import assert from "node:assert/strict";
import { parseOpportunityProbability, defaultOpportunityProbability } from "../lib/opportunityProbability";
import { applyOpportunityPatch } from "../lib/inlineRecordMerge";
import { buildPipelineOpportunityPoints } from "../lib/dashboardPipelineStages";
import { layoutPipelineOpportunityChart } from "../lib/dashboardPipelineChart";
import type { Opportunity } from "../lib/types/entities";

const deal = { id: 1, client_name: "Probability regression", status: "sourcing", probability: 37,
  commission_income: "5000", expected_close_date: "2026-11-10", company_name: null,
} as Opportunity;
for (let value = 0; value <= 100; value++) {
  assert.equal(parseOpportunityProbability(String(value)), value);
  const patched = applyOpportunityPatch(deal, "probability", value);
  assert.ok(!("error" in patched));
  assert.equal(patched.probability, value);
  assert.equal(patched.status, "sourcing");
  const point = buildPipelineOpportunityPoints([{ ...deal, probability: value }])[0];
  assert.equal(point.chance, value);
  assert.equal(point.colour, buildPipelineOpportunityPoints([deal])[0].colour);
  assert.equal(point.value, 5000);
}
for (const value of [-1, 101, 1.5, "", null, true, "abc", Infinity]) {
  assert.throws(() => parseOpportunityProbability(value));
  assert.ok("error" in applyOpportunityPatch(deal, "probability", value));
}
for (const status of ["qualifying", "sourcing", "proposal_reviewing", "negotiating", "contracting", "await_payment", "closed_won", "closed_lost"]) {
  const patched = applyOpportunityPatch(deal, "status", status);
  assert.ok(!("error" in patched));
  assert.equal(patched.probability, 37);
}
assert.equal(defaultOpportunityProbability("sourcing"), 25);
const low = layoutPipelineOpportunityChart(buildPipelineOpportunityPoints([{ ...deal, probability: 0 }]));
const high = layoutPipelineOpportunityChart(buildPipelineOpportunityPoints([{ ...deal, probability: 100 }]));
assert.ok(low.bubbles[0].y > high.bubbles[0].y);
assert.equal(low.bubbles[0].r, high.bubbles[0].r);
console.log("OK: every integer 0–100, invalid values, status independence, saved chart position, colour and sizing");

assert.deepEqual(OPPORTUNITY_STATUSES.map((status) => OPPORTUNITY_STATUS_LABELS[status]), [
  "Qualifying", "Sourcing", "Considering", "Negotiating", "Contracting", "Await Payment", "Closed Won", "Closed Lost",
]);
for (const status of ["contracting", "await_payment"] as const) {
  assert.equal(normalizeOpportunityStatus(status), status);
  const row = { ...deal, status, start_date: "2026-01-01", expected_close_date: "2026-01-02" };
  assert.equal(opportunityMatchesListStatusFilter(row, status), true);
  assert.equal(opportunityMatchesListQuickFilter(row, "active", "2026-10-26"), true);
  assert.equal(isOpportunityOverdue(row, "2026-10-26"), true);
  assert.equal(buildPipelineOpportunityPoints([row])[0].chance, 37);
  const block = buildDashboardPipelineBlocks([row]).find((item) => item.id === status);
  assert.equal(block?.count, 1);
  assert.equal(block?.value, 5000);
}
console.log("OK eight stages in order; Contracting and Await Payment retain probability, remain open, count in pipeline, and support overdue");
