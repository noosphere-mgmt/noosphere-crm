"use server";

import { revalidatePath } from "next/cache";
import { buildingWorkspaceHref } from "@/lib/buildingWorkspaceNav";
import { rethrowNextNavigation } from "@/lib/nextNavigation";
import {
  mergeBuildings,
  previewBuildingMerge,
  type BuildingMergePreview,
  type MergeBuildingsResult,
} from "@/lib/repos/buildingMerge";
import type { BuildingMergeFieldChoices } from "@/lib/buildingMergeFields";

export type BuildingMergeActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function previewBuildingMergeAction(
  propertyIds: string[],
): Promise<BuildingMergeActionResult<BuildingMergePreview>> {
  try {
    const data = await previewBuildingMerge(propertyIds);
    return { ok: true, data };
  } catch (err) {
    rethrowNextNavigation(err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to prepare building merge" };
  }
}

export async function mergeBuildingsAction(input: {
  propertyIds: string[];
  survivorPropertyId: string;
  fieldChoices?: BuildingMergeFieldChoices;
}): Promise<BuildingMergeActionResult<MergeBuildingsResult & { href: string }>> {
  try {
    const data = await mergeBuildings({
      propertyIds: input.propertyIds,
      survivorPropertyId: input.survivorPropertyId,
      fieldChoices: input.fieldChoices,
    });
    revalidatePath("/admin/properties");
    revalidatePath("/admin/properties/buildings");
    revalidatePath(`/admin/properties/${data.survivorPropertyId}`);
    revalidatePath(`/admin/properties/buildings/${data.survivorBusinessId ?? data.survivorPropertyId}`);
    const workspaceHref = buildingWorkspaceHref({
      property_id: data.survivorPropertyId,
      business_id: data.survivorBusinessId,
    });
    const join = workspaceHref.includes("?") ? "&" : "?";
    const href = `${workspaceHref}${join}merged=1&premises=${encodeURIComponent(String(data.premisesTransferred))}`;
    return { ok: true, data: { ...data, href } };
  } catch (err) {
    rethrowNextNavigation(err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to merge buildings" };
  }
}
