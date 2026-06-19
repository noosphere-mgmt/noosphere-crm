"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createBuilding, deleteBuilding, updateBuilding } from "@/lib/repos/buildings";
import type { PropertyStatus } from "@/lib/types/entities";

function parseOptionalId(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseOptionalInt(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function parseOptionalDecimal(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function parseOptionalString(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

function parseOptionalNumber(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function parseStatus(v: FormDataEntryValue | null): PropertyStatus {
  const s = String(v ?? "active");
  if (s === "inactive" || s === "archived") return s;
  return "active";
}

function buildingInputFromForm(formData: FormData) {
  return {
    property_id: parseOptionalId(formData.get("legacy_property_id")),
    name_en: String(formData.get("name_en") ?? ""),
    name_zh: parseOptionalString(formData.get("name_zh")),
    property_type: String(formData.get("property_type") ?? "") || "Commercial Building",
    centre_type: parseOptionalString(formData.get("centre_type")),
    status: parseStatus(formData.get("status")),
    country: String(formData.get("country") ?? "") || "Hong Kong",
    city: String(formData.get("city") ?? "") || "Hong Kong",
    district: String(formData.get("district") ?? ""),
    street_no: parseOptionalString(formData.get("street_no")),
    street_name_en: parseOptionalString(formData.get("street_name_en")),
    street_name_zh: parseOptionalString(formData.get("street_name_zh")),
    full_address_en: String(formData.get("full_address_en") ?? ""),
    full_address_zh: parseOptionalString(formData.get("full_address_zh")),
    lot_number: parseOptionalString(formData.get("lot_number")),
    land_use: parseOptionalString(formData.get("land_use")),
    ownership_type: parseOptionalString(formData.get("ownership_type")),
    source_url: parseOptionalString(formData.get("source_url")),
    last_verified_date: parseOptionalString(formData.get("last_verified_date")),
    latitude: parseOptionalNumber(formData.get("latitude")),
    longitude: parseOptionalNumber(formData.get("longitude")),
    tower_block: parseOptionalString(formData.get("tower_block")),
    floor_count: parseOptionalInt(formData.get("floor_count")),
    typical_floor_area_sqft: parseOptionalDecimal(formData.get("typical_floor_area_sqft")),
    year_built: parseOptionalInt(formData.get("year_built")),
    grade: parseOptionalString(formData.get("grade")),
    mtr_station: parseOptionalString(formData.get("mtr_station")),
    walking_minutes: parseOptionalInt(formData.get("walking_minutes")),
    facilities: parseOptionalString(formData.get("facilities")),
    green_certification: parseOptionalString(formData.get("green_certification")),
    remarks: parseOptionalString(formData.get("remarks")),
  };
}

export async function createBuildingAction(formData: FormData) {
  const id = await createBuilding(buildingInputFromForm(formData));
  revalidatePath("/admin/buildings");
  redirect(`/admin/buildings/${id}`);
}

export async function updateBuildingAction(id: number, formData: FormData) {
  await updateBuilding(id, buildingInputFromForm(formData));
  revalidatePath("/admin/buildings");
  redirect("/admin/buildings");
}

export async function deleteBuildingAction(id: number) {
  await deleteBuilding(id);
  revalidatePath("/admin/buildings");
  redirect("/admin/buildings");
}
