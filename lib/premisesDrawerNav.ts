import type { PremisesDetailTabId } from "@/lib/premisesDetailTab";

export function buildPremisesReturnTo(
  searchParams: URLSearchParams,
  basePath = "/admin/properties",
): string {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("premises");
  params.delete("tab");
  params.delete("mode");
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function premisesDrawerHref(
  searchParams: URLSearchParams,
  premisesId: string,
  tab: PremisesDetailTabId = "overview",
  mode?: "edit" | "view",
  basePath = "/admin/properties",
): string {
  const params = new URLSearchParams(searchParams.toString());
  params.set("premises", premisesId);
  if (tab === "overview") params.delete("tab");
  else params.set("tab", tab);
  if (mode === "edit") params.set("mode", "edit");
  else params.delete("mode");
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Building detail page with premises drawer context (explicit full-page navigation). */
export function premisesFullPageHref(
  propertyId: string,
  premisesId: string,
  tab: PremisesDetailTabId = "overview",
): string {
  const params = new URLSearchParams();
  params.set("premises", premisesId);
  if (tab !== "overview") params.set("tab", tab);
  params.set("mode", "view");
  const qs = params.toString();
  return `/admin/properties/${encodeURIComponent(propertyId)}?${qs}`;
}
