export const BUILDING_WORKSPACE_TABS = [
  { id: "overview", label: "Overview" },
  { id: "premises", label: "Premises" },
  { id: "proposal", label: "Proposal Content" },
  { id: "activities", label: "Activities" },
] as const;

export type BuildingWorkspaceTabId = (typeof BUILDING_WORKSPACE_TABS)[number]["id"];

export function getBuildingWorkspaceTab(searchParams: { tab?: string | null }): BuildingWorkspaceTabId {
  const tab = searchParams.tab?.trim();
  if (tab === "location") return "overview";
  // Preserve old bookmarks while consolidating dated notes into Activities.
  if (tab === "notes") return "activities";
  if (tab === "premises" || tab === "proposal" || tab === "activities") {
    return tab;
  }
  return "overview";
}
