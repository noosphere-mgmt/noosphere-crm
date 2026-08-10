/** Canonical opportunity status model — customer expectation stages. */

export const OPPORTUNITY_STATUSES = [
  "qualifying",
  "sourcing",
  "proposal_reviewing",
  "negotiating",
  "closed_won",
  "closed_lost",
] as const;

export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export const OPPORTUNITY_STATUS_LABELS: Record<OpportunityStatus, string> = {
  qualifying: "Qualifying",
  sourcing: "Sourcing",
  proposal_reviewing: "Proposal Reviewing",
  negotiating: "Negotiating",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

/** Rough win probability for header display (no dedicated DB field). */
export const OPPORTUNITY_STATUS_PROBABILITY: Record<OpportunityStatus, number | null> = {
  qualifying: 10,
  sourcing: 25,
  proposal_reviewing: 50,
  negotiating: 70,
  closed_won: 100,
  closed_lost: 0,
};

/** Legacy pipeline + phase-45 statuses → current model. */
export const LEGACY_OPPORTUNITY_STATUS_MAP: Record<string, OpportunityStatus> = {
  new: "qualifying",
  new_lead: "qualifying",
  sourcing: "sourcing",
  active_sourcing: "sourcing",
  proposal_review: "proposal_reviewing",
  client_reviewing_options: "proposal_reviewing",
  proposal_preparing: "proposal_reviewing",
  proposal_sent: "proposal_reviewing",
  awaiting_client_feedback: "proposal_reviewing",
  refining_requirement: "proposal_reviewing",
  awaiting_client_decision: "proposal_reviewing",
  pending_approval: "negotiating",
  contracting: "negotiating",
  awaiting_approval: "negotiating",
};

export const ACTIVE_OPPORTUNITY_STATUSES = OPPORTUNITY_STATUSES.filter(
  (s) => s !== "closed_won" && s !== "closed_lost",
);

/** Statuses where the client is reviewing options or feedback. */
export const CLIENT_REVIEW_OPPORTUNITY_STATUSES: OpportunityStatus[] = [
  "proposal_reviewing",
];

export function normalizeOpportunityStatus(value: string): OpportunityStatus {
  const trimmed = value.trim();
  if ((OPPORTUNITY_STATUSES as readonly string[]).includes(trimmed)) {
    return trimmed as OpportunityStatus;
  }
  return LEGACY_OPPORTUNITY_STATUS_MAP[trimmed] ?? "qualifying";
}

export function isOpportunityStatusValue(value: string): value is OpportunityStatus {
  return (OPPORTUNITY_STATUSES as readonly string[]).includes(value);
}

export function formatOpportunityActionDate(value: string | null | undefined): string {
  if (!value?.trim()) return "—";
  const d = new Date(value.slice(0, 10));
  if (Number.isNaN(d.getTime())) return value.slice(0, 10);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** @deprecated Operational fields removed from header; kept for DB compatibility. */
export function defaultWaitingFor(_status: OpportunityStatus): string | null {
  return null;
}
