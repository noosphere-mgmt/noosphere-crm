import type { ActivityListRow } from "@/lib/repos/activities";

export type ActivitiesQuickFilters = {
  activity_type: string;
  company_id: string;
  contact_id: string;
  opportunity_id: string;
  date_from: string;
  date_to: string;
};

export const EMPTY_ACTIVITIES_QUICK_FILTERS: ActivitiesQuickFilters = {
  activity_type: "",
  company_id: "",
  contact_id: "",
  opportunity_id: "",
  date_from: "",
  date_to: "",
};

export function activityMatchesQuickFilters(
  row: ActivityListRow,
  filters: ActivitiesQuickFilters,
): boolean {
  if (filters.activity_type && row.activity_type !== filters.activity_type) return false;
  if (filters.company_id && String(row.company_id ?? "") !== filters.company_id) return false;
  if (filters.contact_id && String(row.contact_id ?? "") !== filters.contact_id) return false;
  if (filters.opportunity_id && String(row.opportunity_id ?? "") !== filters.opportunity_id) return false;
  const date = row.activity_date.slice(0, 10);
  if (filters.date_from && date < filters.date_from) return false;
  if (filters.date_to && date > filters.date_to) return false;
  return true;
}

export function activityMatchesGlobalSearch(row: ActivityListRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    row.notes,
    row.activity_type,
    row.company_name,
    row.contact_name,
    row.opportunity_name,
    row.premises_label,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}
