/** Drill-down links from dashboard cards to filtered module listings. */

export function opportunitiesHref(params?: {
  status?: string;
  stage?: "open" | "viewing" | "won_month";
}): string {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.stage) sp.set("stage", params.stage);
  const qs = sp.toString();
  return qs ? `/admin/opportunities?${qs}` : "/admin/opportunities";
}

export function opportunityHref(id: number): string {
  return `/admin/opportunities?opportunity=${id}`;
}

export function activityHref(activityId: string): string {
  return `/admin/activities?activity=${encodeURIComponent(activityId)}`;
}

export function companyHref(id: number): string {
  return `/admin/companies?company=${id}`;
}

export function contactHref(id: number): string {
  return `/admin/contacts?contact=${id}`;
}

export function premisesHref(premisesId: string): string {
  return `/admin/properties?premises=${encodeURIComponent(premisesId)}`;
}

export function partyHref(companyId: number, contactId: number | null): string {
  if (contactId) return contactHref(contactId);
  return companyHref(companyId);
}
