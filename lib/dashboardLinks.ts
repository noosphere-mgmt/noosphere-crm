/** Drill-down links from dashboard cards to filtered module listings. */

import { isV1CompanyRef, isV1ContactRef } from "@/lib/entityRefGuards";

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

export function companyHref(id: number | string): string {
  const ref = String(id).trim();
  if (isV1ContactRef(ref)) {
    return `/admin/contacts?contact=${encodeURIComponent(ref)}`;
  }
  return `/admin/companies?company=${encodeURIComponent(ref)}`;
}

export function contactHref(id: number | string): string {
  const ref = String(id).trim();
  if (isV1CompanyRef(ref)) {
    return `/admin/companies?company=${encodeURIComponent(ref)}`;
  }
  return `/admin/contacts?contact=${encodeURIComponent(ref)}`;
}

export function partyHref(companyId: number | string, contactId: number | string | null): string {
  if (contactId != null && String(contactId).trim()) {
    const contactRef = String(contactId).trim();
    if (!isV1CompanyRef(contactRef)) {
      return contactHref(contactRef);
    }
  }
  return companyHref(companyId);
}

export function premisesHref(premisesId: string): string {
  return `/admin/properties?premises=${encodeURIComponent(premisesId)}`;
}
