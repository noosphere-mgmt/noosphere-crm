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
  if (tab === "timeline") return "activities";
  if (
    tab === "contacts" ||
    tab === "relationships" ||
    tab === "opportunities" ||
    tab === "activities" ||
    tab === "premises" ||
    tab === "notes"
  ) {
    return tab;
  }
  return "overview";
}
