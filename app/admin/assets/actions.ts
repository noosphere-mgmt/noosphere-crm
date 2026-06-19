"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAsset, deleteAsset, updateAsset } from "@/lib/repos/assets";
import { getLegacySitePropertyIdForBuilding } from "@/lib/repos/buildings";
import type { AssetStatus, AssetType, WindowType } from "@/lib/types/entities";
import { ASSET_STATUSES, ASSET_TYPES, WINDOW_TYPES } from "@/lib/lookups";

function parseRequiredId(v: FormDataEntryValue | null, label: string): number {
  const n = Number.parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n) || n < 1) throw new Error(`Invalid ${label}`);
  return n;
}

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

function parseAssetType(v: FormDataEntryValue | null): AssetType {
  const s = String(v ?? "Unit");
  return (ASSET_TYPES as readonly string[]).includes(s) ? (s as AssetType) : "Unit";
}

function parseAssetStatus(v: FormDataEntryValue | null): AssetStatus {
  const s = String(v ?? "active");
  return (ASSET_STATUSES as readonly string[]).includes(s) ? (s as AssetStatus) : "active";
}

function parseWindows(v: FormDataEntryValue | null): WindowType | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  return (WINDOW_TYPES as readonly string[]).includes(s) ? (s as WindowType) : null;
}

async function spaceInputFromForm(formData: FormData) {
  const buildingId = parseRequiredId(formData.get("building_id"), "building");
  const legacyPropertyId = await getLegacySitePropertyIdForBuilding(buildingId);

  return {
    building_id: buildingId,
    property_id: legacyPropertyId,
    parent_asset_id: parseOptionalId(formData.get("parent_asset_id")),
    asset_type: parseAssetType(formData.get("asset_type")),
    asset_status: parseAssetStatus(formData.get("asset_status")),
    floor: parseOptionalString(formData.get("floor")),
    unit: parseOptionalString(formData.get("unit")),
    suite: parseOptionalString(formData.get("suite")),
    display_name_en: String(formData.get("display_name_en") ?? ""),
    display_name_zh: parseOptionalString(formData.get("display_name_zh")),
    office_name: parseOptionalString(formData.get("office_name")),
    gross_area_sqft: parseOptionalDecimal(formData.get("gross_area_sqft")),
    net_area_sqft: parseOptionalDecimal(formData.get("net_area_sqft")),
    capacity_pax: parseOptionalInt(formData.get("capacity_pax")),
    view_type: parseOptionalString(formData.get("view_type")),
    windows: parseWindows(formData.get("windows")),
    office_type: parseOptionalString(formData.get("office_type")),
    source_url: parseOptionalString(formData.get("source_url")),
    last_verified_date: parseOptionalString(formData.get("last_verified_date")),
    remarks: parseOptionalString(formData.get("remarks")),
    operator_company_id: parseOptionalId(formData.get("operator_company_id")),
    landlord_company_id: parseOptionalId(formData.get("landlord_company_id")),
    current_tenant_company_id: parseOptionalId(formData.get("current_tenant_company_id")),
  };
}

export async function createAssetAction(formData: FormData) {
  const id = await createAsset(await spaceInputFromForm(formData));
  revalidatePath("/admin/assets");
  revalidatePath("/admin/companies");
  redirect(`/admin/assets/${id}`);
}

export async function updateAssetAction(id: number, formData: FormData) {
  await updateAsset(id, await spaceInputFromForm(formData));
  revalidatePath("/admin/assets");
  revalidatePath(`/admin/assets/${id}`);
  revalidatePath("/admin/companies");
  redirect("/admin/assets");
}

export async function deleteAssetAction(id: number) {
  await deleteAsset(id);
  revalidatePath("/admin/assets");
  redirect("/admin/assets");
}
