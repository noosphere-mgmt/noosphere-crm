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
  if (tab === "timeline" || tab === "activities") return "activities";
  if (tab === "notes") return "activities";
  if (tab === "profile") return "overview";
  if (tab === "affiliations") return "company";
  if (tab === "deals") return "opportunities";
  if (
    tab === "company" ||
    tab === "relationships" ||
    tab === "activities" ||
    tab === "opportunities" ||
    tab === "premises"
  ) {
    return tab;
  }
  return "overview";
}
