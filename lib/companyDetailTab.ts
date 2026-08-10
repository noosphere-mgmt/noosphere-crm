export const COMPANY_DETAIL_TABS = [
  "overview",
  "contacts",
  "relationships",
  "opportunities",
  "activities",
  "premises",
  "notes",
] as const;

export type CompanyDetailTabId = (typeof COMPANY_DETAIL_TABS)[number];

export function getCompanyTab(searchParams: { tab?: string }): CompanyDetailTabId {
  const tab = searchParams.tab;
  if (tab === "timeline" || tab === "activities") return "activities";
  if (tab === "notes") return "activities";
  if (tab === "profile") return "overview";
  if (tab === "deals") return "opportunities";
  if (tab === "supply" || tab === "fees") return "premises";
  if (
    tab === "contacts" ||
    tab === "relationships" ||
    tab === "opportunities" ||
    tab === "activities" ||
    tab === "premises"
  ) {
    return tab;
  }
  return "overview";
}
