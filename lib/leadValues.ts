import {
  OPPORTUNITY_SOURCES,
  normalizeOpportunitySource,
  type OpportunitySource,
} from "@/lib/opportunitySourceValues";

/** Lead Source — same values as Opportunity Lead/Opp Source. */
export const LEAD_SOURCES = OPPORTUNITY_SOURCES;
export type LeadSource = OpportunitySource;

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  direct: "Direct",
  partner_agents: "Partner Agent",
  emarketing: "eMarketing",
};

export function normalizeLeadSource(value: unknown): LeadSource {
  return normalizeOpportunitySource(value);
}

export const LEAD_STATUSES = [
  "new",
  "reviewing",
  "qualified",
  "converted",
  "nurture",
  "disqualified",
  "duplicate",
] as const;

export type LeadStatusValue = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatusValue, string> = {
  new: "New",
  reviewing: "Reviewing",
  qualified: "Qualified",
  converted: "Converted",
  nurture: "Nurture",
  disqualified: "Disqualified",
  duplicate: "Duplicate",
};
