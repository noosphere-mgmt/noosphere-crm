/** Opportunity statuses treated as closed (excluded from open counts). */
export const CLOSED_OPPORTUNITY_STATUSES = ["closed_won", "closed_lost"] as const;

export function isOpenOpportunityStatus(status: string): boolean {
  return !(CLOSED_OPPORTUNITY_STATUSES as readonly string[]).includes(status);
}

export const OPEN_OPPORTUNITY_STATUS_SQL = `('closed_won', 'closed_lost')`;
