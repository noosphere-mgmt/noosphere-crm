export const COMPANY_WORKSPACE_TABS = [
  { id: "profile", label: "Profile" },
  { id: "contacts", label: "Contacts" },
  { id: "deals", label: "Deals" },
  { id: "supply", label: "Supply" },
  { id: "activities", label: "Activities" },
  { id: "fees", label: "Fees" },
] as const;

export type CompanyWorkspaceTabId = (typeof COMPANY_WORKSPACE_TABS)[number]["id"];

/** Map legacy drawer/detail tab ids to workspace tabs. */
export function normalizeCompanyWorkspaceTab(tab?: string | null): CompanyWorkspaceTabId {
  const t = tab?.trim();
  if (t === "profile" || t === "overview") return "profile";
  if (t === "contacts") return "contacts";
  if (t === "deals" || t === "opportunities") return "deals";
  if (t === "supply" || t === "premises" || t === "relationships") return "supply";
  if (t === "activities" || t === "timeline") return "activities";
  if (t === "fees") return "fees";
  // Preserve old bookmarks while consolidating dated notes into Activities.
  if (t === "notes") return "activities";
  return "profile";
}

export function getCompanyWorkspaceTab(searchParams: { tab?: string | null }): CompanyWorkspaceTabId {
  return normalizeCompanyWorkspaceTab(searchParams.tab);
}
