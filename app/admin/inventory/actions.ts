"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  computeRentPsf,
  createInventory,
  deleteInventory,
  getAssetAreaForRentPsf,
  resolveInventoryLocationFromAsset,
  updateInventory,
} from "@/lib/repos/inventory";
import type { InventoryStatus, ListingIntent, OfferType } from "@/lib/types/entities";
import { INVENTORY_STATUSES, LEGACY_LISTING_INTENTS, OFFER_TYPES } from "@/lib/lookups";

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

function parseOfferType(v: FormDataEntryValue | null): OfferType {
  const s = String(v ?? "Unit");
  return (OFFER_TYPES as readonly string[]).includes(s) ? (s as OfferType) : "Unit";
}

function parseInventoryStatus(v: FormDataEntryValue | null): InventoryStatus {
  const s = String(v ?? "available");
  return (INVENTORY_STATUSES as readonly string[]).includes(s) ? (s as InventoryStatus) : "available";
}

function parseListingIntent(v: FormDataEntryValue | null): ListingIntent {
  const s = String(v ?? "lease");
  return (LEGACY_LISTING_INTENTS as readonly string[]).includes(s) ? (s as ListingIntent) : "lease";
}

async function inventoryInputFromForm(formData: FormData) {
  const assetId = parseRequiredId(formData.get("asset_id"), "asset");
  const location = await resolveInventoryLocationFromAsset(assetId);
  const areas = await getAssetAreaForRentPsf(assetId);
  const monthly_rent = parseOptionalDecimal(formData.get("monthly_rent"));
  const rent_psf = computeRentPsf({
    monthly_rent,
    net_area_sqft: areas.net_area_sqft,
    gross_area_sqft: areas.gross_area_sqft,
    rent_psf: parseOptionalDecimal(formData.get("rent_psf")),
  });

  return {
    asset_id: assetId,
    property_id: location.property_id,
    building_id: location.building_id,
    operator_id: parseOptionalId(formData.get("operator_id")),
    offer_type: parseOfferType(formData.get("offer_type")),
    status: parseInventoryStatus(formData.get("status")),
    monthly_rent,
    rent_psf,
    management_fee: parseOptionalDecimal(formData.get("management_fee")),
    government_rates: parseOptionalDecimal(formData.get("government_rates")),
    deposit_months: parseOptionalInt(formData.get("deposit_months")),
    rent_free_period: parseOptionalString(formData.get("rent_free_period")),
    contract_term_months: parseOptionalInt(formData.get("contract_term_months")),
    available_date: parseOptionalString(formData.get("available_date")),
    commission_rate: parseOptionalDecimal(formData.get("commission_rate")),
    source_file: parseOptionalString(formData.get("source_file")),
    listing_intent: parseListingIntent(formData.get("listing_intent")),
    sale_price: parseOptionalDecimal(formData.get("sale_price")),
    remarks: parseOptionalString(formData.get("remarks")),
  };
}

export async function createInventoryAction(formData: FormData) {
  const id = await createInventory(await inventoryInputFromForm(formData));
  revalidatePath("/admin/inventory");
  redirect(`/admin/inventory/${id}`);
}

export async function updateInventoryAction(id: number, formData: FormData) {
  const input = await inventoryInputFromForm(formData);
  await updateInventory(id, {
    ...input,
    status: input.status!,
    listing_intent: input.listing_intent!,
  });
  revalidatePath("/admin/inventory");
  redirect("/admin/inventory");
}

export async function deleteInventoryAction(id: number) {
  await deleteInventory(id);
  revalidatePath("/admin/inventory");
  redirect("/admin/inventory");
}
