import { formatOpportunityActionDate, OPPORTUNITY_STATUS_LABELS } from "@/lib/lookups";
import { formatOpportunityMoneyCompact, parseOpportunityMoney } from "@/lib/opportunityFinancials";
import type { DashboardReferrerPerformanceRow } from "@/lib/repos/dashboard";
import type { Opportunity } from "@/lib/types/entities";

export type DashboardInsightKind = "priority" | "pipeline" | "channel";

export type DashboardInsight = {
  kind: DashboardInsightKind;
  label: string;
  text: string;
};

export type DashboardInsights = {
  priority: DashboardInsight;
  pipeline: DashboardInsight;
  channel: DashboardInsight;
};

type InsightDeal = Pick<
  Opportunity,
  | "id"
  | "client_name"
  | "status"
  | "commission_income"
  | "expected_close_date"
  | "last_activity_date"
  | "created_at"
  | "linked_company_name"
  | "company_name"
>;

function daysBetween(dateText: string | null | undefined, now: Date): number | null {
  if (!dateText) return null;
  const parsed = Date.parse(dateText.length === 10 ? `${dateText}T12:00:00` : dateText);
  if (!Number.isFinite(parsed)) return null;
  return Math.round((now.getTime() - parsed) / 86_400_000);
}

function dealValue(deal: InsightDeal): number {
  return parseOpportunityMoney(deal.commission_income) ?? 0;
}

function dealName(deal: InsightDeal): string {
  return deal.client_name.trim() || "This opportunity";
}

function quietDays(deal: InsightDeal, now: Date): number | null {
  return daysBetween(deal.last_activity_date ?? deal.created_at, now);
}

function daysUntil(dateText: string | null | undefined, now: Date): number | null {
  const elapsed = daysBetween(dateText, now);
  return elapsed == null ? null : -elapsed;
}

function isOpen(deal: InsightDeal): boolean {
  return deal.status !== "closed_won" && deal.status !== "closed_lost";
}

function insight(kind: DashboardInsightKind, label: string, text: string): DashboardInsight {
  return { kind, label, text };
}

function buildPriorityInsight(open: InsightDeal[], now: Date): DashboardInsight {
  const quietFollowUps = open
    .map((deal) => ({ deal, quiet: quietDays(deal, now), value: dealValue(deal) }))
    .filter((row) => row.quiet != null && row.quiet >= 14)
    .sort((a, b) => b.value - a.value || (b.quiet ?? 0) - (a.quiet ?? 0));

  const overdueClose = open
    .map((deal) => ({ deal, until: daysUntil(deal.expected_close_date, now), value: dealValue(deal) }))
    .filter((row) => row.until != null && row.until <= 0)
    .sort((a, b) => b.value - a.value || (a.until ?? 0) - (b.until ?? 0));

  const approaching = open
    .map((deal) => ({ deal, until: daysUntil(deal.expected_close_date, now), value: dealValue(deal) }))
    .filter((row) => row.until != null && row.until > 0 && row.until <= 21)
    .sort((a, b) => a.until! - b.until! || b.value - a.value);

  if (quietFollowUps[0] && quietFollowUps[0].value > 0) {
    const row = quietFollowUps[0];
    return insight(
      "priority",
      "Priority Action",
      `${dealName(row.deal)} (${formatOpportunityMoneyCompact(row.value)}) has had no recorded activity for ${row.quiet} days.`,
    );
  }

  if (overdueClose[0]) {
    const row = overdueClose[0];
    return insight(
      "priority",
      "Priority Action",
      `${dealName(row.deal)} is still open after its expected close on ${formatOpportunityActionDate(row.deal.expected_close_date)}.`,
    );
  }

  if (approaching[0]) {
    const row = approaching[0];
    return insight(
      "priority",
      "Priority Action",
      `${dealName(row.deal)} is due to close in ${row.until} day${row.until === 1 ? "" : "s"} (${formatOpportunityActionDate(row.deal.expected_close_date)}).`,
    );
  }

  if (quietFollowUps[0]) {
    const row = quietFollowUps[0];
    return insight(
      "priority",
      "Priority Action",
      `${dealName(row.deal)} has had no recorded activity for ${row.quiet} days.`,
    );
  }

  if (open.length === 0) {
    return insight("priority", "Priority Action", "There are no active opportunities requiring follow-up.");
  }

  return insight("priority", "Priority Action", "No overdue follow-ups or close dates need attention right now.");
}

function buildPipelineInsight(open: InsightDeal[], now: Date): DashboardInsight {
  const total = open.reduce((sum, deal) => sum + dealValue(deal), 0);
  const ranked = [...open].sort((a, b) => dealValue(b) - dealValue(a));
  const top = ranked[0];

  if (top && total > 0) {
    const share = Math.round((dealValue(top) / total) * 100);
    if (share >= 50) {
      return insight(
        "pipeline",
        "Pipeline Movement",
        `${share}% of current pipeline value is concentrated in ${dealName(top)}.`,
      );
    }
  }

  const stale = open.filter((deal) => {
    const quiet = quietDays(deal, now);
    return quiet != null && quiet > 60;
  });
  if (stale.length > 0) {
    return insight(
      "pipeline",
      "Pipeline Movement",
      `${stale.length} active ${stale.length === 1 ? "opportunity has" : "opportunities have"} had no recorded activity for more than 60 days.`,
    );
  }

  const byStatus = new Map<string, number>();
  for (const deal of open) {
    byStatus.set(deal.status, (byStatus.get(deal.status) ?? 0) + 1);
  }
  const statusLead = [...byStatus.entries()].sort((a, b) => b[1] - a[1])[0];
  if (statusLead && open.length >= 2 && statusLead[1] / open.length >= 0.6) {
    const label = OPPORTUNITY_STATUS_LABELS[statusLead[0] as keyof typeof OPPORTUNITY_STATUS_LABELS] ?? statusLead[0];
    return insight(
      "pipeline",
      "Pipeline Movement",
      `${statusLead[1]} of ${open.length} active opportunities are in ${label}.`,
    );
  }

  if (open.length === 0) {
    return insight("pipeline", "Pipeline Movement", "There are no active opportunities in the pipeline.");
  }

  return insight(
    "pipeline",
    "Pipeline Movement",
    `${open.length} active ${open.length === 1 ? "opportunity is" : "opportunities are"} currently open across the pipeline.`,
  );
}

function buildChannelInsight(referrers: DashboardReferrerPerformanceRow[]): DashboardInsight {
  const rows = referrers.filter((row) => row.total_opps > 0);
  if (rows.length === 0) {
    return insight("channel", "Channel Action", "No referring parties are linked to opportunities yet.");
  }

  const reconnect = [...rows]
    .filter((row) => row.won_opps > 0 && row.active_opps === 0)
    .sort((a, b) => b.won_opps - a.won_opps || b.total_opps - a.total_opps);
  if (reconnect[0]) {
    return insight(
      "channel",
      "Channel Action",
      `${reconnect[0].party_name} has ${reconnect[0].won_opps} won ${reconnect[0].won_opps === 1 ? "opportunity" : "opportunities"} and no active ones — worth reconnecting.`,
    );
  }

  const activeLead = [...rows].sort((a, b) => b.active_opps - a.active_opps || b.total_opps - a.total_opps)[0];
  if (activeLead.active_opps > 0) {
    return insight(
      "channel",
      "Channel Action",
      `${activeLead.party_name} is the most active referral source, with ${activeLead.active_opps} active ${activeLead.active_opps === 1 ? "opportunity" : "opportunities"}.`,
    );
  }

  const top = [...rows].sort((a, b) => b.total_opps - a.total_opps)[0];
  return insight(
    "channel",
    "Channel Action",
    `${top.party_name} is linked to ${top.total_opps} ${top.total_opps === 1 ? "opportunity" : "opportunities"} in the current book.`,
  );
}

/** Deterministic Home insights from live CRM records. Not an LLM. */
export function buildDashboardInsights(
  deals: InsightDeal[],
  referrers: DashboardReferrerPerformanceRow[],
  now = new Date(),
): DashboardInsights {
  const open = deals.filter(isOpen);
  return {
    priority: buildPriorityInsight(open, now),
    pipeline: buildPipelineInsight(open, now),
    channel: buildChannelInsight(referrers),
  };
}
