/**
 * Canonical full-page detail URLs using business IDs (C/D/B/P/M/A######).
 * Drawers stay on list+query; Full page / pen always navigate here.
 */

export type DetailMode = "view" | "edit";

function withDetailQs(
  path: string,
  opts?: { tab?: string; mode?: DetailMode },
): string {
  const params = new URLSearchParams();
  if (opts?.tab && opts.tab !== "overview") params.set("tab", opts.tab);
  if (opts?.mode === "edit") params.set("mode", "edit");
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

function encodeRef(ref: string | number | null | undefined): string | null {
  const s = String(ref ?? "").trim();
  return s || null;
}

/** /admin/companies/C100001 */
export function companyFullPageHref(
  businessId: string | number | null | undefined,
  opts?: { tab?: string; mode?: DetailMode },
): string | null {
  const id = encodeRef(businessId);
  if (!id) return null;
  return withDetailQs(`/admin/companies/${encodeURIComponent(id)}`, opts);
}

/** /admin/contacts/D100001 */
export function contactFullPageHref(
  businessId: string | number | null | undefined,
  opts?: { tab?: string; mode?: DetailMode },
): string | null {
  const id = encodeRef(businessId);
  if (!id) return null;
  return withDetailQs(`/admin/contacts/${encodeURIComponent(id)}`, opts);
}

/** /admin/properties/buildings/B100001 */
export function buildingFullPageHref(
  businessId: string | number | null | undefined,
  opts?: { tab?: string; mode?: DetailMode },
): string | null {
  const id = encodeRef(businessId);
  if (!id) return null;
  return withDetailQs(`/admin/properties/buildings/${encodeURIComponent(id)}`, opts);
}

/** /admin/properties/premises/P100001 */
export function premisesFullPageHref(
  businessId: string | number | null | undefined,
  opts?: { tab?: string; mode?: DetailMode },
): string | null {
  const id = encodeRef(businessId);
  if (!id) return null;
  return withDetailQs(`/admin/properties/premises/${encodeURIComponent(id)}`, opts);
}

/** /admin/opportunities/M100001 */
export function opportunityFullPageHref(
  businessId: string | number | null | undefined,
  opts?: { tab?: string; mode?: DetailMode },
): string | null {
  const id = encodeRef(businessId);
  if (!id) return null;
  return withDetailQs(`/admin/opportunities/${encodeURIComponent(id)}`, opts);
}

/** /admin/activities/A100001 */
export function activityFullPageHref(
  businessId: string | number | null | undefined,
  opts?: { mode?: DetailMode },
): string | null {
  const id = encodeRef(businessId);
  if (!id) return null;
  return withDetailQs(`/admin/activities/${encodeURIComponent(id)}`, opts);
}

/** /admin/leads?lead=123 — leads use list selection, not a dedicated workspace route. */
export function leadFullPageHref(leadId: string | number | null | undefined): string | null {
  const id = encodeRef(leadId);
  if (!id) return null;
  return `/admin/leads?lead=${encodeURIComponent(id)}`;
}
