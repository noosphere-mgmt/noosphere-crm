export type OpportunityDetailTabId =
  | "overview"
  | "premises"
  | "parties"
  | "proposals"
  | "fees"
  | "activities"
  | "notes";

export const OPPORTUNITY_DETAIL_TABS: { id: OpportunityDetailTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "premises", label: "Proposed Premises" },
  { id: "parties", label: "Parties" },
  { id: "proposals", label: "Proposals" },
  { id: "fees", label: "Fees" },
  { id: "activities", label: "Activities" },
  { id: "notes", label: "Notes" },
];

const VALID_TABS = new Set<string>(OPPORTUNITY_DETAIL_TABS.map((t) => t.id));

export function getOpportunityTab(input: { tab?: string | null }): OpportunityDetailTabId {
  const tab = input.tab?.trim();
  if (tab && VALID_TABS.has(tab)) return tab as OpportunityDetailTabId;
  return "overview";
}
