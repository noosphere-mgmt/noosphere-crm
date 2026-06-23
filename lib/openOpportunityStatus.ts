/** Opportunity statuses treated as closed (excluded from open counts). */
export const CLOSED_OPPORTUNITY_STATUSES = ["closed_won", "closed_lost"] as const;

export type ClosedOpportunityStatus = (typeof CLOSED_OPPORTUNITY_STATUSES)[number];

export function isClosedOpportunityStatus(status: string): status is ClosedOpportunityStatus {
  return (CLOSED_OPPORTUNITY_STATUSES as readonly string[]).includes(status);
}

export function isOpenOpportunityStatus(status: string): boolean {
  return !isClosedOpportunityStatus(status);
}

export function closedOutcomeReasonLabel(status: string): string {
  if (status === "closed_won") return "Won reason";
  if (status === "closed_lost") return "Lost reason";
  return "Won/Lost reason";
}

export const OPEN_OPPORTUNITY_STATUS_SQL = `('closed_won', 'closed_lost')`;
