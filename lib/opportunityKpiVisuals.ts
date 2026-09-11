import { parseOpportunityMoney, summariseWonOpportunityFinancials } from "@/lib/opportunityFinancials";
import { OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import { OPPORTUNITY_STATUS_COLORS } from "@/lib/opportunityStatusTheme";
import type { Opportunity, OpportunityStatus } from "@/lib/types/entities";

const PIPELINE_STATUSES: OpportunityStatus[] = ["qualifying", "sourcing", "proposal_reviewing", "negotiating"];

function monthKey(dateText: string | null | undefined): string | null {
  if (!dateText) return null;
  return dateText.slice(0, 7);
}

function currentMonthKey(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month: string, delta: number): string {
  const [year, mon] = month.split("-").map(Number);
  const date = new Date(year, mon - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Last 6 months of realised won revenue by `updated_at`. Null if a trend is not reliable. */
export function wonRevenueSparkline(rows: Opportunity[], now = new Date()): number[] | null {
  const won = rows.filter((row) => row.status === "closed_won");
  if (won.length < 2) return null;
  const end = currentMonthKey(now);
  const keys = Array.from({ length: 6 }, (_, index) => shiftMonth(end, index - 5));
  const buckets = new Map(keys.map((key) => [key, 0]));
  for (const row of won) {
    const key = monthKey(row.updated_at);
    if (!key || !buckets.has(key)) continue;
    buckets.set(key, (buckets.get(key) ?? 0) + (parseOpportunityMoney(row.commission_income) ?? 0));
  }
  const values = keys.map((key) => buckets.get(key) ?? 0);
  const activeMonths = values.filter((value) => value > 0).length;
  if (activeMonths < 2) return null;
  return values;
}

export function wonCostsRatio(rows: Opportunity[]): number | null {
  const won = summariseWonOpportunityFinancials(rows);
  if (won.commission_income <= 0) return null;
  return won.related_costs / won.commission_income;
}

export function wonProfitMargin(rows: Opportunity[]): number | null {
  const won = summariseWonOpportunityFinancials(rows);
  if (won.commission_income <= 0) return null;
  return won.net_profit / won.commission_income;
}

export function wonCostsRecordCount(rows: Opportunity[]): number {
  return rows.filter((row) => row.status === "closed_won" && parseOpportunityMoney(row.related_costs) != null).length;
}

export function wonRevenueAverage(rows: Opportunity[]): number | null {
  const won = summariseWonOpportunityFinancials(rows);
  if (won.opp_count <= 0) return null;
  return won.commission_income / won.opp_count;
}

export function occupiedPipelineStageCount(rows: Opportunity[]): number {
  return pipelineValueSegments(rows).filter((segment) => segment.count > 0).length;
}

export type PipelineValueSegment = {
  status: OpportunityStatus;
  label: string;
  color: string;
  value: number;
  count: number;
  share: number;
};

export function pipelineValueSegments(rows: Opportunity[]): PipelineValueSegment[] {
  const open = rows.filter((row) => row.status !== "closed_won" && row.status !== "closed_lost");
  const total = open.reduce((sum, row) => sum + (parseOpportunityMoney(row.commission_income) ?? 0), 0);
  return PIPELINE_STATUSES.map((status) => {
    const matches = open.filter((row) => row.status === status);
    const value = matches.reduce((sum, row) => sum + (parseOpportunityMoney(row.commission_income) ?? 0), 0);
    return {
      status,
      label: OPPORTUNITY_STATUS_LABELS[status],
      color: OPPORTUNITY_STATUS_COLORS[status],
      value,
      count: matches.length,
      share: total > 0 ? value / total : 0,
    };
  });
}
