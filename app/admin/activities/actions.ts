"use server";

import { revalidatePath } from "next/cache";
import { isActivityType, type SiteTourCheckpointMode } from "@/lib/activityValues";
import {
  createActivity,
  createSiteTourActivities,
  deleteActivity,
  duplicateActivity,
  getActivity,
  listActivityPremisesIds,
  searchActivityCompanies,
  searchActivityContacts,
  searchActivityOpportunities,
  searchActivityPremises,
  syncActivityPremises,
  updateActivity,
  type ActivityInput,
} from "@/lib/repos/activities";

function parseOptionalString(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

function parseOptionalId(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parsePremisesIds(formData: FormData): string[] {
  const raw = String(formData.get("premises_ids") ?? "").trim();
  if (!raw) return [];
  return [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))];
}

function parseCheckpointMode(formData: FormData): SiteTourCheckpointMode {
  return formData.get("checkpoint_mode") === "combined" ? "combined" : "split";
}

function activityInputFromForm(formData: FormData): ActivityInput {
  const activityType = String(formData.get("activity_type") ?? "").trim();
  if (!isActivityType(activityType)) {
    throw new Error("Invalid activity type");
  }
  return {
    activity_date: String(formData.get("activity_date") ?? "").trim(),
    activity_time: parseOptionalString(formData.get("activity_time")),
    activity_type: activityType,
    subject: null,
    notes: parseOptionalString(formData.get("notes")),
    company_id: parseOptionalId(formData.get("company_id")),
    contact_id: parseOptionalId(formData.get("contact_id")),
    opportunity_id: parseOptionalId(formData.get("opportunity_id")),
    premises_id: parseOptionalString(formData.get("premises_id")),
    owner: parseOptionalString(formData.get("owner")),
  };
}

function revalidateActivityPaths(input: ActivityInput) {
  revalidatePath("/admin/activities");
  revalidatePath("/admin/companies");
  revalidatePath("/admin/contacts");
  revalidatePath("/admin/opportunities");
  revalidatePath("/admin/properties");
  if (input.company_id) revalidatePath(`/admin/companies?company=${input.company_id}`);
  if (input.contact_id) revalidatePath(`/admin/contacts?contact=${input.contact_id}`);
  if (input.opportunity_id) revalidatePath(`/admin/opportunities/${input.opportunity_id}`);
}

export type ActivityActionResult =
  | { ok: true; activity_id: string; created_count?: number }
  | { ok: false; error: string };

export async function createActivityAction(formData: FormData): Promise<ActivityActionResult> {
  try {
    const input = activityInputFromForm(formData);
    const premisesIds = parsePremisesIds(formData);
    const isSiteTour = input.activity_type === "Site Tour" || input.activity_type === "Site Inspection";

    if (isSiteTour && premisesIds.length > 0) {
      const ids = await createSiteTourActivities(input, premisesIds, parseCheckpointMode(formData));
      revalidateActivityPaths(input);
      return { ok: true, activity_id: ids[0]!, created_count: ids.length };
    }

    const activity_id = await createActivity(input);
    revalidateActivityPaths(input);
    return { ok: true, activity_id, created_count: 1 };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to create activity" };
  }
}

export async function updateActivityAction(
  activityId: string,
  formData: FormData,
): Promise<ActivityActionResult> {
  try {
    const input = activityInputFromForm(formData);
    const premisesIds = parsePremisesIds(formData);
    await updateActivity(activityId, input);
    if (premisesIds.length > 0) {
      await syncActivityPremises(activityId, premisesIds);
    } else {
      await syncActivityPremises(activityId, input.premises_id ? [input.premises_id] : []);
    }
    revalidateActivityPaths(input);
    return { ok: true, activity_id: activityId, created_count: 1 };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update activity" };
  }
}

export async function duplicateActivityAction(activityId: string): Promise<ActivityActionResult> {
  try {
    const newId = await duplicateActivity(activityId);
    const row = await getActivity(newId);
    if (row) {
      revalidateActivityPaths({
        activity_date: row.activity_date,
        activity_type: row.activity_type,
        company_id: row.company_id,
        contact_id: row.contact_id,
        opportunity_id: row.opportunity_id,
        premises_id: row.premises_id,
      });
    } else {
      revalidatePath("/admin/activities");
    }
    return { ok: true, activity_id: newId, created_count: 1 };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to duplicate activity" };
  }
}

export async function getActivityPremisesIdsAction(activityId: string): Promise<string[]> {
  return listActivityPremisesIds(activityId);
}

export async function deleteActivityAction(activityId: string): Promise<void> {
  await deleteActivity(activityId);
  revalidatePath("/admin/activities");
  revalidatePath("/admin/companies");
  revalidatePath("/admin/contacts");
  revalidatePath("/admin/opportunities");
  revalidatePath("/admin/properties");
}

export async function bulkDeleteActivitiesAction(formData: FormData): Promise<void> {
  const raw = String(formData.get("activity_ids") ?? "").trim();
  const ids = raw ? raw.split(",").map((id) => id.trim()).filter(Boolean) : [];
  for (const id of ids) {
    await deleteActivity(id);
  }
  revalidatePath("/admin/activities");
  revalidatePath("/admin/companies");
  revalidatePath("/admin/contacts");
  revalidatePath("/admin/opportunities");
  revalidatePath("/admin/properties");
}

export async function bulkDuplicateActivitiesAction(formData: FormData): Promise<ActivityActionResult> {
  try {
    const raw = String(formData.get("activity_ids") ?? "").trim();
    const ids = raw ? raw.split(",").map((id) => id.trim()).filter(Boolean) : [];
    if (ids.length === 0) return { ok: false, error: "No activities selected" };

    const created: string[] = [];
    for (const id of ids) {
      created.push(await duplicateActivity(id));
    }

    revalidatePath("/admin/activities");
    revalidatePath("/admin/companies");
    revalidatePath("/admin/contacts");
    revalidatePath("/admin/opportunities");
    revalidatePath("/admin/properties");

    return { ok: true, activity_id: created[0]!, created_count: created.length };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to copy activities" };
  }
}

export async function searchActivityLinkAction(
  entityType: "company" | "contact" | "opportunity" | "premises",
  query: string,
  limit?: number,
) {
  switch (entityType) {
    case "company":
      return searchActivityCompanies(query, limit);
    case "contact":
      return searchActivityContacts(query, limit);
    case "opportunity":
      return searchActivityOpportunities(query, limit);
    case "premises":
      return searchActivityPremises(query, limit ?? 25);
  }
}
