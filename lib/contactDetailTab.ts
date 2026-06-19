export const CONTACT_DETAIL_TABS = [
  "overview",
  "company",
  "relationships",
  "activities",
  "premises",
  "opportunities",
  "notes",
] as const;

export type ContactDetailTabId = (typeof CONTACT_DETAIL_TABS)[number];

export function getContactTab(searchParams: { tab?: string }): ContactDetailTabId {
  const tab = searchParams.tab;
  if (tab === "timeline") return "activities";
  if (
    tab === "company" ||
    tab === "relationships" ||
    tab === "activities" ||
    tab === "opportunities" ||
    tab === "premises" ||
    tab === "notes"
  ) {
    return tab;
  }
  return "overview";
}
