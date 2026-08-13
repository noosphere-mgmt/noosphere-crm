import { getContactTab } from "@/lib/contactDetailTab";

export const CONTACT_WORKSPACE_TABS = [
  { id: "overview", label: "Overview" },
  { id: "company", label: "Company" },
  { id: "relationships", label: "Relationships" },
  { id: "activities", label: "Activities" },
  { id: "premises", label: "Properties" },
  { id: "opportunities", label: "Opportunities" },
] as const;

export type ContactWorkspaceTabId = (typeof CONTACT_WORKSPACE_TABS)[number]["id"];

/** Align workspace tabs with drawer/detail tabs (Overview → Opportunities). */
export function normalizeContactWorkspaceTab(tab?: string | null): ContactWorkspaceTabId {
  const normalized = getContactTab({ tab: tab ?? undefined });
  if (normalized === "notes") return "activities";
  return normalized as ContactWorkspaceTabId;
}

export function getContactWorkspaceTab(searchParams: { tab?: string | null }): ContactWorkspaceTabId {
  return normalizeContactWorkspaceTab(searchParams.tab);
}
