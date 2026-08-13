export const COMPANY_WORKSPACE_TABS = [
  { id: "overview", label: "Overview" },
  { id: "contacts", label: "Contacts" },
  { id: "relationships", label: "Relationships" },
  { id: "opportunities", label: "Opportunities" },
  { id: "activities", label: "Activities" },
  { id: "premises", label: "Properties" },
] as const;

export type CompanyWorkspaceTabId = (typeof COMPANY_WORKSPACE_TABS)[number]["id"];

/** Map legacy drawer/detail / renamed workspace tab ids. */
export function normalizeCompanyWorkspaceTab(tab?: string | null): CompanyWorkspaceTabId {
  const t = tab?.trim();
  if (t === "overview" || t === "profile") return "overview";
  if (t === "contacts") return "contacts";
  if (t === "relationships") return "relationships";
  if (t === "opportunities" || t === "deals") return "opportunities";
  if (t === "premises" || t === "supply" || t === "properties") return "premises";
  if (t === "activities" || t === "timeline") return "activities";
  // Fees removed from company workspace; old bookmarks land on Overview.
  if (t === "fees") return "overview";
  // Preserve old bookmarks while consolidating dated notes into Activities.
  if (t === "notes") return "activities";
  return "overview";
}

export function getCompanyWorkspaceTab(searchParams: { tab?: string | null }): CompanyWorkspaceTabId {
  return normalizeCompanyWorkspaceTab(searchParams.tab);
}
