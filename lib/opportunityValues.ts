/** Opportunity workspace list values */

export const PROPOSED_PREMISES_STATUSES = [
  "shortlisted",
  "viewing",
  "negotiation",
  "selected",
  "rejected",
] as const;

export type ProposedPremisesStatus = (typeof PROPOSED_PREMISES_STATUSES)[number];

export const PROPOSED_PREMISES_STATUS_LABELS: Record<ProposedPremisesStatus, string> = {
  shortlisted: "Reviewing",
  viewing: "Inspected",
  negotiation: "Negotiating",
  selected: "Selected",
  rejected: "Rejected",
};

/** Converts historic line stages into the simplified operator workflow. */
export function normalizeProposedPremisesStatus(value: string): ProposedPremisesStatus {
  if (value === "proposed" || value === "presented" || value === "shortlisted") return "shortlisted";
  if (value === "viewing") return "viewing";
  if (value === "negotiation") return "negotiation";
  if (value === "selected" || value === "won") return "selected";
  return "rejected";
}

export const PROPOSED_PREMISES_PREFERENCES = ["high", "medium", "low"] as const;
export type ProposedPremisesPreference = (typeof PROPOSED_PREMISES_PREFERENCES)[number];

export const PROPOSED_PREMISES_PREFERENCE_LABELS: Record<ProposedPremisesPreference, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

/** Primary party roles for opportunity workspace */
export const OPPORTUNITY_PARTY_ROLES = [
  "agent",
  "operator",
  "landlord",
  "building_management",
] as const;

export type OpportunityPartyRole = (typeof OPPORTUNITY_PARTY_ROLES)[number];

export const OPPORTUNITY_PARTY_ROLE_LABELS: Record<string, string> = {
  end_user: "End User",
  agent: "Agent",
  referring_agent: "Referring Agent",
  co_broker: "Agent",
  referrer: "Referrer",
  operator: "Operator",
  landlord: "Landlord",
  building_management: "Bldg Mgmt",
  investor: "Investor",
  other: "Other",
};

/** Roles shown in overview parties summary */
export const OPPORTUNITY_PARTY_SUMMARY_SLOTS: { role: string; label: string; aliases?: string[] }[] = [
  { role: "agent", label: "Agent", aliases: ["co_broker"] },
  { role: "operator", label: "Operator" },
  { role: "landlord", label: "Landlord" },
];

export const OPPORTUNITY_PARTNERSHIP_MODES = [
  "direct",
  "co_broker",
  "operator_direct",
  "landlord_direct",
  "no_fee",
  "other",
] as const;

export type OpportunityPartnershipMode = (typeof OPPORTUNITY_PARTNERSHIP_MODES)[number];

export const OPPORTUNITY_PARTNERSHIP_MODE_LABELS: Record<OpportunityPartnershipMode, string> = {
  direct: "Direct relationship",
  co_broker: "Co-broker",
  operator_direct: "Direct operator relationship",
  landlord_direct: "Direct landlord relationship",
  no_fee: "Participant — no referral fee",
  other: "Other",
};

export const FEE_STATUSES = [
  "expected",
  "confirmed",
  "invoiced",
  "paid",
  "waived",
  "not_applicable",
] as const;

export type FeeStatus = (typeof FEE_STATUSES)[number];

export const FEE_STATUS_LABELS: Record<FeeStatus, string> = {
  expected: "Expected",
  confirmed: "Confirmed",
  invoiced: "Invoiced",
  paid: "Paid",
  waived: "Waived",
  not_applicable: "Not Applicable",
};

export const OPPORTUNITY_SALES_ROLES = ["to_lease", "to_buy", "to_sell", "prof_service"] as const;
export type OpportunitySalesRole = (typeof OPPORTUNITY_SALES_ROLES)[number];

export const OPPORTUNITY_SALES_ROLE_LABELS: Record<OpportunitySalesRole, string> = {
  to_lease: "Lease",
  to_buy: "Buy / Acquisition",
  to_sell: "Sell / Disposal",
  prof_service: "Corporate Service",
};

export function isProfServiceSalesRole(
  role: OpportunitySalesRole | string | null | undefined,
): boolean {
  return role === "prof_service";
}

export const OPPORTUNITY_FUNDING_STATUSES = [
  "cash",
  "loan_approved",
  "pre_approved",
  "seeking_financing",
  "undisclosed",
] as const;

export type OpportunityFundingStatus = (typeof OPPORTUNITY_FUNDING_STATUSES)[number];

export const OPPORTUNITY_FUNDING_STATUS_LABELS: Record<OpportunityFundingStatus, string> = {
  cash: "Cash",
  loan_approved: "Loan Approved",
  pre_approved: "Pre-approved",
  seeking_financing: "Seeking Financing",
  undisclosed: "Undisclosed",
};
