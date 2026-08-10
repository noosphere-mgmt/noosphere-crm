export const OPPORTUNITY_SOURCES = ["direct", "partner_agents", "emarketing"] as const;
export type OpportunitySource = (typeof OPPORTUNITY_SOURCES)[number];

export const OPPORTUNITY_SOURCE_LABELS: Record<OpportunitySource, string> = {
  direct: "Direct",
  partner_agents: "Partner Agents",
  emarketing: "eMarketing",
};

export function normalizeOpportunitySource(value: unknown): OpportunitySource {
  const source = String(value ?? "").trim().toLowerCase().replace(/[ -]+/g, "_");
  if (source === "partner_agent" || source === "partner_agents" || source === "referral") return "partner_agents";
  if (source === "emarketing" || source === "e_marketing" || source === "email" || source === "email_marketing") return "emarketing";
  return "direct";
}
