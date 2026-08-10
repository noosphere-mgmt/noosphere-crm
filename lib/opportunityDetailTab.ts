export type OpportunityWorkspaceTabId = "overview" | "parties" | "proposed" | "timeline" | "documents";

/** @deprecated Legacy tab ids — mapped to workspace tabs in getOpportunityTab */
export type OpportunityDetailTabId =
  | OpportunityWorkspaceTabId
  | "brief"
  | "matches"
  | "shortlist"
  | "parties"
  | "proposals"
  | "premises"
  | "fees"
  | "activities"
  | "notes";

export const OPPORTUNITY_WORKSPACE_TABS: { id: OpportunityWorkspaceTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "parties", label: "Parties" },
  { id: "proposed", label: "Proposed" },
  { id: "timeline", label: "Activity" },
  { id: "documents", label: "Documents" },
];

/** @deprecated Use OPPORTUNITY_WORKSPACE_TABS */
export const OPPORTUNITY_DETAIL_TABS = OPPORTUNITY_WORKSPACE_TABS;

const LEGACY_TAB_ALIASES: Record<string, OpportunityWorkspaceTabId> = {
  brief: "overview",
  overview: "overview",
  matches: "proposed",
  shortlist: "proposed",
  premises: "proposed",
  parties: "parties",
  fees: "overview",
  proposals: "documents",
  activities: "timeline",
  notes: "timeline",
};

const VALID_TABS = new Set<string>(OPPORTUNITY_WORKSPACE_TABS.map((t) => t.id));

export function normalizeOpportunityTab(tab?: string | null): OpportunityWorkspaceTabId {
  const raw = tab?.trim();
  if (!raw) return "overview";
  if (VALID_TABS.has(raw)) return raw as OpportunityWorkspaceTabId;
  return LEGACY_TAB_ALIASES[raw] ?? "overview";
}

export function getOpportunityTab(input: { tab?: string | null }): OpportunityWorkspaceTabId {
  return normalizeOpportunityTab(input.tab);
}

export const PROF_SERVICE_HIDDEN_WORKSPACE_TABS = new Set<OpportunityWorkspaceTabId>();
