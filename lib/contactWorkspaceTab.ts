export const CONTACT_WORKSPACE_TABS = [
  { id: "profile", label: "Profile" },
  { id: "affiliations", label: "Affiliations" },
  { id: "deals", label: "Deals" },
  { id: "activities", label: "Activities" },
] as const;

export type ContactWorkspaceTabId = (typeof CONTACT_WORKSPACE_TABS)[number]["id"];

export function normalizeContactWorkspaceTab(tab?: string | null): ContactWorkspaceTabId {
  const t = tab?.trim();
  if (t === "profile" || t === "overview") return "profile";
  if (t === "affiliations" || t === "company") return "affiliations";
  if (t === "deals" || t === "opportunities") return "deals";
  if (t === "activities" || t === "timeline") return "activities";
  // Preserve old bookmarks while consolidating dated notes into Activities.
  if (t === "notes") return "activities";
  if (t === "relationships" || t === "premises") return "profile";
  return "profile";
}

export function getContactWorkspaceTab(searchParams: { tab?: string | null }): ContactWorkspaceTabId {
  return normalizeContactWorkspaceTab(searchParams.tab);
}
