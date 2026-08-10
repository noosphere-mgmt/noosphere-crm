import type { Opportunity, OpportunityProposal, OpportunityStatus } from "@/lib/types/entities";

export type PipelineStepId = "brief" | "sourcing" | "shortlist" | "proposal" | "close";

export type PipelineStep = {
  id: PipelineStepId;
  label: string;
};

/** @deprecated Pipeline stepper removed from workspace — retained for legacy helpers only. */
export const OPPORTUNITY_PIPELINE_STEPS: PipelineStep[] = [
  { id: "brief", label: "Brief" },
  { id: "sourcing", label: "Sourcing" },
  { id: "shortlist", label: "Shortlist" },
  { id: "proposal", label: "Proposal" },
  { id: "close", label: "Close" },
];

export type PipelineContext = {
  shortlistCount: number;
  hasSentProposal: boolean;
  hasDraftProposal: boolean;
};

function statusFloor(status: OpportunityStatus): PipelineStepId {
  if (status === "closed_won" || status === "closed_lost") return "close";
  if (status === "negotiating" || status === "proposal_reviewing") {
    return "proposal";
  }
  if (status === "sourcing") return "sourcing";
  if (status === "qualifying") return "brief";
  return "brief";
}

/** @deprecated Use OpportunityStatusSituation in workspace header instead. */
export function derivePipelineStepIndex(
  opportunity: Opportunity,
  ctx: PipelineContext,
): number {
  const floor = statusFloor(opportunity.status);
  let index = OPPORTUNITY_PIPELINE_STEPS.findIndex((s) => s.id === floor);

  if (ctx.hasSentProposal || ctx.hasDraftProposal) {
    index = Math.max(index, OPPORTUNITY_PIPELINE_STEPS.findIndex((s) => s.id === "proposal"));
  }
  if (ctx.shortlistCount > 0) {
    index = Math.max(index, OPPORTUNITY_PIPELINE_STEPS.findIndex((s) => s.id === "shortlist"));
  }
  if (opportunity.status === "sourcing") {
    index = Math.max(index, OPPORTUNITY_PIPELINE_STEPS.findIndex((s) => s.id === "sourcing"));
  }

  return Math.min(Math.max(index, 0), OPPORTUNITY_PIPELINE_STEPS.length - 1);
}

export function latestProposalSummary(proposals: OpportunityProposal[]): {
  label: string;
  status: string;
  version: number | null;
} | null {
  const active = proposals.filter((p) => p.status !== "superseded");
  const latest = active[0];
  if (!latest) return null;
  const statusLabels: Record<string, string> = {
    draft: "Draft",
    sent: "Sent",
    accepted: "Accepted",
    superseded: "Superseded",
  };
  return {
    label: latest.title,
    status: statusLabels[latest.status] ?? latest.status,
    version: latest.version_number,
  };
}
