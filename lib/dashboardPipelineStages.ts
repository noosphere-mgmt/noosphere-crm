import type { OpportunityStatus } from "@/lib/types/entities";
import { opportunitiesHref } from "@/lib/dashboardLinks";

export type DashboardPipelineStage = {
  id: string;
  label: string;
  statuses: OpportunityStatus[];
};

/** Dashboard pipeline cards — each links to filtered opportunity list. */
export const DASHBOARD_PIPELINE_STAGES: DashboardPipelineStage[] = [
  { id: "qualifying", label: "Qualifying", statuses: ["qualifying"] },
  { id: "sourcing", label: "Sourcing", statuses: ["sourcing"] },
  { id: "proposal_reviewing", label: "Proposal Reviewing", statuses: ["proposal_reviewing"] },
  { id: "negotiating", label: "Negotiating", statuses: ["negotiating"] },
  { id: "closed_won", label: "Closed Won", statuses: ["closed_won"] },
];

export function countDealsByPipelineStage(
  deals: { status: OpportunityStatus }[],
  stage: DashboardPipelineStage,
): number {
  return deals.filter((d) => stage.statuses.includes(d.status)).length;
}

export function pipelineStageHref(stage: DashboardPipelineStage): string {
  return opportunitiesHref({ status: stage.statuses.join(",") });
}

export function countOpenDeals(deals: { status: OpportunityStatus }[]): number {
  return deals.filter((d) => d.status !== "closed_won" && d.status !== "closed_lost").length;
}
