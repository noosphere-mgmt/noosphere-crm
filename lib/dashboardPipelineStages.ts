import { dealWorkspaceHref, opportunitiesHref } from "@/lib/dashboardLinks";
import { isActiveOpportunityStart } from "@/lib/opportunityStartDate";
import { OPPORTUNITY_STATUS_LABELS, OPPORTUNITY_STATUS_PROBABILITY } from "@/lib/lookups";
import { parseOpportunityMoney } from "@/lib/opportunityFinancials";
import type { Opportunity, OpportunityStatus } from "@/lib/types/entities";

export type DashboardPipelineStage = {
  id: string;
  label: string;
  statuses: OpportunityStatus[];
};

/** Dashboard pipeline cards — each links to filtered opportunity list. */
export const DASHBOARD_PIPELINE_STAGES: DashboardPipelineStage[] = [
  { id: "qualifying", label: "Qualifying", statuses: ["qualifying"] },
  { id: "sourcing", label: "Sourcing", statuses: ["sourcing"] },
  { id: "proposal_reviewing", label: OPPORTUNITY_STATUS_LABELS.proposal_reviewing, statuses: ["proposal_reviewing"] },
  { id: "negotiating", label: "Negotiating", statuses: ["negotiating"] },
  { id: "closed_won", label: "Closed Won", statuses: ["closed_won"] },
];

export function countDealsByPipelineStage(
  deals: Array<{ status: OpportunityStatus; start_date?: string | null }>,
  stage: DashboardPipelineStage,
): number {
  return deals.filter(
    (deal) => stage.statuses.includes(deal.status) && isActiveOpportunityStart(deal.start_date),
  ).length;
}

/** Unweighted potential for deals in a stage. Status is not a probability. */
export function sumUnweightedPipelineValue(
  deals: Array<{
    status: OpportunityStatus;
    commission_income?: string | number | null;
    start_date?: string | null;
  }>,
  stage: DashboardPipelineStage,
): number {
  return deals
    .filter(
      (deal) => stage.statuses.includes(deal.status) && isActiveOpportunityStart(deal.start_date),
    )
    .reduce((sum, deal) => sum + (parseOpportunityMoney(deal.commission_income) ?? 0), 0);
}

export function pipelineStageHref(stage: DashboardPipelineStage): string {
  return opportunitiesHref({ status: stage.statuses.join(",") });
}

export function countOpenDeals(
  deals: Array<{ status: OpportunityStatus; start_date?: string | null }>,
): number {
  return deals.filter(
    (deal) =>
      deal.status !== "closed_won" &&
      deal.status !== "closed_lost" &&
      isActiveOpportunityStart(deal.start_date),
  ).length;
}

/** Open workflow statuses for the Home chevron row — excludes closed outcomes. */
export const DASHBOARD_ACTIVE_PIPELINE_STAGES = DASHBOARD_PIPELINE_STAGES.filter(
  (stage) => stage.id !== "closed_won",
);

export type DashboardPipelineBlock = {
  id: string;
  label: string;
  href: string;
  count: number;
  value: number;
  colour: string;
};

export const PIPELINE_STATUS_COLOURS: Record<string, string> = {
  qualifying: "#059669",
  sourcing: "#0284c7",
  proposal_reviewing: "#7c3aed",
  viewing: "#ea580c",
  negotiating: "#db2777",
};

/**
 * Equal-weight status blocks for Home. Viewing uses the existing premises
 * viewing flag; it is not a win-probability and does not replace status.
 */
export function buildDashboardPipelineBlocks(
  deals: Array<Pick<Opportunity, "status" | "commission_income" | "has_viewing_premises" | "start_date">>,
): DashboardPipelineBlock[] {
  const current = deals.filter((deal) => isActiveOpportunityStart(deal.start_date));
  const open = current.filter((deal) => deal.status !== "closed_won" && deal.status !== "closed_lost");
  const viewingDeals = open.filter((deal) => deal.has_viewing_premises);
  const viewing: DashboardPipelineBlock = {
    id: "viewing",
    label: "Viewing",
    href: opportunitiesHref({ status: "active", stage: "viewing" }),
    count: viewingDeals.length,
    value: viewingDeals.reduce((sum, deal) => sum + (parseOpportunityMoney(deal.commission_income) ?? 0), 0),
    colour: PIPELINE_STATUS_COLOURS.viewing,
  };

  const blocks: DashboardPipelineBlock[] = [];
  for (const stage of DASHBOARD_ACTIVE_PIPELINE_STAGES) {
    if (stage.id === "negotiating") blocks.push(viewing);
    blocks.push({
      id: stage.id,
      label: stage.label,
      href: pipelineStageHref(stage),
      count: countDealsByPipelineStage(current, stage),
      value: sumUnweightedPipelineValue(current, stage),
      colour: PIPELINE_STATUS_COLOURS[stage.id] ?? "#64748b",
    });
  }
  return blocks;
}

export type PipelineOpportunityPoint = {
  id: number;
  name: string;
  company: string | null;
  status: OpportunityStatus;
  statusLabel: string;
  colour: string;
  value: number;
  chance: number | null;
  expectedClose: string | null;
  href: string;
};

/** One plotted bubble per active opportunity. Chance is the existing CRM lookup, not a new model. */
export function buildPipelineOpportunityPoints(
  deals: Array<
    Pick<
      Opportunity,
      | "id"
      | "client_name"
      | "status"
      | "commission_income"
      | "expected_close_date"
      | "linked_company_name"
      | "company_name"
      | "business_id"
      | "start_date"
    >
  >,
): PipelineOpportunityPoint[] {
  return deals
    .filter(
      (deal) =>
        deal.status !== "closed_won" &&
        deal.status !== "closed_lost" &&
        isActiveOpportunityStart(deal.start_date),
    )
    .map((deal) => ({
      id: deal.id,
      name: deal.client_name,
      company: deal.linked_company_name ?? deal.company_name,
      status: deal.status,
      statusLabel: OPPORTUNITY_STATUS_LABELS[deal.status] ?? deal.status,
      colour: PIPELINE_STATUS_COLOURS[deal.status] ?? "#64748b",
      value: parseOpportunityMoney(deal.commission_income) ?? 0,
      chance: OPPORTUNITY_STATUS_PROBABILITY[deal.status] ?? null,
      expectedClose: deal.expected_close_date?.slice(0, 10) || null,
      href: dealWorkspaceHref(deal),
    }));
}
