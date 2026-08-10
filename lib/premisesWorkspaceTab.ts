export const PREMISES_WORKSPACE_TABS = [
  { id: "overview", label: "Overview" },
  { id: "relationships", label: "Relationships" },
  { id: "deals", label: "Opportunities" },
  { id: "activities", label: "Activities" },
] as const;

export type PremisesWorkspaceTabId = (typeof PREMISES_WORKSPACE_TABS)[number]["id"];

export function getPremisesWorkspaceTab(searchParams: { tab?: string | null }): PremisesWorkspaceTabId {
  const tab = searchParams.tab?.trim();
  // Preserve old bookmarked timeline URLs after combining Timeline into Activity.
  if (tab === "timeline") return "activities";
  if (tab === "availability") return "overview";
  if (tab === "building") return "overview";
  if (tab === "commercial") return "overview";
  // Preserve old bookmarks while consolidating dated notes into Activities.
  if (tab === "notes") return "activities";
  if (
    tab === "relationships" ||
    tab === "deals" ||
    tab === "activities"
  ) {
    return tab;
  }
  return "overview";
}
