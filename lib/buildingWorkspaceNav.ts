import { buildingFullPageHref } from "@/lib/crmDetailNav";
import type { BuildingWorkspaceTabId } from "@/lib/buildingWorkspaceTab";

type BuildingRef = {
  property_id: string;
  business_id?: string | null;
};

export function buildingWorkspaceHref(
  property: BuildingRef,
  tab: BuildingWorkspaceTabId = "overview",
  mode?: "edit",
): string {
  const businessId = property.business_id?.trim() || property.property_id;
  const href = buildingFullPageHref(businessId, { tab: tab === "overview" ? undefined : tab, mode });
  return href ?? `/admin/properties/buildings/${encodeURIComponent(businessId)}`;
}
