import assert from "node:assert/strict";
import { hasOutstandingDelivery, isServiceDeliveryOverdue, parseServiceDeliveryStatus, parseServiceDueDate, todayServiceDate, serviceDateOnCompletion } from "../lib/opportunityDelivery";
import { opportunityMatchesListQuickFilter, opportunityMatchesListStatusFilter } from "../lib/opportunitiesList";
import { applyOpportunityPatch } from "../lib/inlineRecordMerge";
import { buildPipelineOpportunityPoints } from "../lib/dashboardPipelineStages";
import type { Opportunity } from "../lib/types/entities";
const today = "2026-10-26";
const row = { id: 1, client_name: "Delivery check", status: "closed_won", probability: 78,
  service_delivery_status: "in_progress", service_due_date: "2026-10-25", commission_income: "5000",
  start_date: "2027-01-01", expected_close_date: "2026-01-01",
} as Opportunity;
assert.equal(hasOutstandingDelivery(row), true);
assert.equal(opportunityMatchesListQuickFilter(row, "outstanding_delivery", today), true);
assert.equal(isServiceDeliveryOverdue(row, today), true);
assert.equal(buildPipelineOpportunityPoints([row]).length, 0, "Won delivery must stay outside sales pipeline");
for (const status of ["not_started", "in_progress", "completed"] as const) {
  const next = applyOpportunityPatch(row, "service_delivery_status", status);
  assert.ok(!("error" in next));
  assert.equal(next.status, "closed_won");
  assert.equal(next.probability, 78);
  assert.equal(next.service_due_date, status === "completed" ? todayServiceDate() : row.service_due_date);
  const updated = {...row, ...next};
  assert.equal(hasOutstandingDelivery(updated), status !== "completed");
  assert.equal(isServiceDeliveryOverdue(updated, today), status !== "completed");
  assert.equal(parseServiceDeliveryStatus(status), status);
}
for (const status of ["qualifying", "sourcing", "contracting", "await_payment", "closed_lost"] as const) {
  const next = applyOpportunityPatch(row, "status", status);
  assert.ok(!("error" in next));
  assert.equal(next.service_delivery_status, "not_started");
  assert.equal(next.service_due_date, row.service_due_date);
  assert.equal(hasOutstandingDelivery({...row, status}), false);
}
assert.equal(hasOutstandingDelivery({...row, service_delivery_status: undefined}), true, "Historical won deals require review");
for (const date of [today, "2026-10-27", null]) assert.equal(isServiceDeliveryOverdue({...row, service_due_date:date}, today), false);
for (const date of ["2026-02-30", "not a date", "2026-1-01", 42]) {
  assert.throws(()=>parseServiceDueDate(date));
  assert.ok("error" in applyOpportunityPatch(row, "service_due_date", date));
}
assert.equal(parseServiceDueDate("2028-02-29"), "2028-02-29");
const cleared = applyOpportunityPatch(row, "service_due_date", null);
assert.ok(!("error" in cleared));
assert.equal(cleared.service_due_date, null);
assert.equal(cleared.service_delivery_status, "in_progress");
assert.ok("error" in applyOpportunityPatch(row,"service_delivery_status","paid"));
console.log("OK independent delivery status and date; outstanding won deals, historical review, overdue boundaries, completion, validation, and sales pipeline exclusion");

assert.equal(todayServiceDate(new Date("2026-10-26T16:30:00Z")), "2026-10-27");
assert.equal(serviceDateOnCompletion("completed", "in_progress", "2026-10-25", "2026-10-25", today), today);
assert.equal(serviceDateOnCompletion("completed", "in_progress", "2026-10-20", "2026-10-25", today), "2026-10-20", "Explicit date override survives form save");
assert.equal(serviceDateOnCompletion("completed", "completed", "2026-10-20", "2026-10-25", today), "2026-10-20");
const completed = {...row, service_delivery_status: "completed" as const, service_due_date: today};
const adjusted = applyOpportunityPatch(completed, "service_due_date", "2026-10-20");
assert.ok(!("error" in adjusted));
assert.equal(adjusted.service_delivery_status, "completed");
assert.equal(adjusted.service_due_date, "2026-10-20");
const unrelated = applyOpportunityPatch({...completed, service_due_date:"2026-10-20"}, "probability", 64);
assert.ok(!("error" in unrelated));
assert.equal(unrelated.service_due_date,"2026-10-20");
console.log("OK completion defaults to Hong Kong today; manual date adjustments and unrelated saves preserve the chosen date");

for (const status of ["not_started", "in_progress", "completed"] as const) {
  const won = {...row, service_delivery_status: status};
  assert.equal(opportunityMatchesListStatusFilter(won, "active"), status !== "completed");
  assert.equal(opportunityMatchesListQuickFilter(won, "active", today), status !== "completed");
  assert.equal(opportunityMatchesListQuickFilter(won, "open", today), false);
  const lost = {...won, status:"closed_lost" as const};
  assert.equal(opportunityMatchesListStatusFilter(lost, "active"), false);
  assert.equal(opportunityMatchesListQuickFilter(lost, "active", today), false);
}
console.log("OK Active listing includes unfinished won delivery and excludes completed won and lost deals");

assert.equal(parseServiceDeliveryStatus("N/A"), "not_started");
for (const stage of ["qualifying", "sourcing", "proposal_reviewing", "negotiating", "contracting", "await_payment", "closed_lost"] as const) {
  const nonWon = {...row, status:stage};
  assert.ok("error" in applyOpportunityPatch(nonWon,"service_delivery_status","completed"));
  assert.ok("error" in applyOpportunityPatch(nonWon,"service_due_date",today));
  assert.equal(isServiceDeliveryOverdue(nonWon,today),false);
}
console.log("OK service delivery applies only to Closed Won; non-won stages display N/A and cannot edit delivery");
