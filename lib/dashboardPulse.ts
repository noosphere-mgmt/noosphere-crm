import type { Opportunity } from "@/lib/types/entities";
import {
  parseOpportunityMoney,
  summariseEstimatedPipelineFinancials,
  summariseWonOpportunityFinancials,
} from "@/lib/opportunityFinancials";

function monthKey(dateText: string | null | undefined): string | null {
  if (!dateText) return null;
  return dateText.slice(0, 7);
}

function currentMonthKey(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export type DashboardPulseMetrics = {
  new_this_month: number;
  won_this_month: number;
  win_rate: number | null;
  avg_won_deal_size: number | null;
  won_revenue: number;
  won_count: number;
  lost_count: number;
  active_count: number;
  pipeline_value: number;
  avg_days_in_pipeline: number | null;
  stale_over_60: number;
};

/** Snapshot metrics from already-loaded opportunities. No invented trends. */
function daysBetween(dateText: string | null | undefined, now: Date): number | null {
  if (!dateText) return null;
  const parsed = Date.parse(dateText.length === 10 ? `${dateText}T12:00:00` : dateText);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.round((now.getTime() - parsed) / 86_400_000));
}

export function buildDashboardPulseMetrics(
  deals: Array<
    Pick<
      Opportunity,
      | "status"
      | "created_at"
      | "updated_at"
      | "commission_income"
      | "related_costs"
      | "net_profit"
      | "id"
      | "last_activity_date"
    >
  >,
  now = new Date(),
): DashboardPulseMetrics {
  const month = currentMonthKey(now);
  const newThisMonth = deals.filter((deal) => monthKey(deal.created_at) === month).length;
  const wonThisMonth = deals.filter(
    (deal) => deal.status === "closed_won" && monthKey(deal.updated_at) === month,
  ).length;
  const won = deals.filter((deal) => deal.status === "closed_won");
  const lost = deals.filter((deal) => deal.status === "closed_lost");
  const open = deals.filter((deal) => deal.status !== "closed_won" && deal.status !== "closed_lost");
  const closed = won.length + lost.length;
  const wonFinancials = summariseWonOpportunityFinancials(deals);
  const avgWon =
    wonFinancials.opp_count > 0 ? wonFinancials.commission_income / wonFinancials.opp_count : null;
  const ages = open
    .map((deal) => daysBetween(deal.created_at, now))
    .filter((days): days is number => days != null);
  const stale = open.filter((deal) => {
    const quiet = daysBetween(deal.last_activity_date ?? deal.created_at, now);
    return quiet != null && quiet > 60;
  }).length;
  return {
    new_this_month: newThisMonth,
    won_this_month: wonThisMonth,
    win_rate: closed > 0 ? Math.round((won.length / closed) * 100) : null,
    avg_won_deal_size: avgWon == null ? null : Math.round(avgWon * 100) / 100,
    won_revenue: wonFinancials.commission_income,
    won_count: won.length,
    lost_count: lost.length,
    active_count: open.length,
    pipeline_value: summariseEstimatedPipelineFinancials(deals).commission_income ?? 0,
    avg_days_in_pipeline: ages.length ? Math.round(ages.reduce((sum, days) => sum + days, 0) / ages.length) : null,
    stale_over_60: stale,
  };
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function firstNameFromDisplayName(displayName: string): string {
  const trimmed = displayName.trim();
  return trimmed.split(/\s+/)[0] || trimmed;
}

export function dealPotential(deal: Pick<Opportunity, "commission_income">): number {
  return parseOpportunityMoney(deal.commission_income) ?? 0;
}
