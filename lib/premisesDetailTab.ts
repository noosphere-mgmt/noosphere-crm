export const PREMISES_DETAIL_TABS = [
  "overview",
  "relationships",
  "opportunities",
  "fees",
  "activities",
  "notes",
] as const;

export type PremisesDetailTabId = (typeof PREMISES_DETAIL_TABS)[number];

export function getPremisesTab(searchParams: { tab?: string | null }): PremisesDetailTabId {
  const tab = searchParams.tab?.trim();
  if (
    tab === "relationships" ||
    tab === "opportunities" ||
    tab === "fees" ||
    tab === "activities" ||
    tab === "notes"
  ) {
    return tab;
  }
  return "overview";
}
