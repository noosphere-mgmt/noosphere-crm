"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { quickAddProperty } from "@/lib/quickAddProperty";
import type { AssetType, ListingIntent, MarketablePropertyStatus, OfferType } from "@/lib/types/entities";
import {
  ASSET_TYPES,
  LEGACY_LISTING_INTENTS,
  MARKETABLE_PROPERTY_STATUSES,
  OFFER_TYPES,
} from "@/lib/lookups";

function parseMode(v: FormDataEntryValue | null): "existing" | "new" {
  return String(v ?? "") === "existing" ? "existing" : "new";
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

function str(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

function parseOfferType(v: FormDataEntryValue | null): OfferType {
  const s = String(v ?? "Unit");
  return (OFFER_TYPES as readonly string[]).includes(s) ? (s as OfferType) : "Unit";
}

function parseSpaceType(v: FormDataEntryValue | null): AssetType | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  return (ASSET_TYPES as readonly string[]).includes(s) ? (s as AssetType) : null;
}

function parsePropertyStatus(v: FormDataEntryValue | null): MarketablePropertyStatus {
  const s = String(v ?? "available");
  return (MARKETABLE_PROPERTY_STATUSES as readonly string[]).includes(s)
    ? (s as MarketablePropertyStatus)
    : "available";
}

function parseListingIntent(v: FormDataEntryValue | null): ListingIntent {
  const s = String(v ?? "lease");
  return (LEGACY_LISTING_INTENTS as readonly string[]).includes(s) ? (s as ListingIntent) : "lease";
}

export async function quickAddPropertyAction(formData: FormData) {
  const propertyId = await quickAddProperty({
    building_mode: parseMode(formData.get("building_mode")),
    building_id: parseOptionalId(formData.get("building_id")),
    name_en: str(formData.get("name_en")),
    district: str(formData.get("district")),
    full_address_en: str(formData.get("full_address_en")),
    tower_block: str(formData.get("tower_block")),
    floor_count: parseOptionalInt(formData.get("floor_count")),
    grade: str(formData.get("grade")),
    mtr_station: str(formData.get("mtr_station")),
    property_mode: parseMode(formData.get("property_mode")),
    property_id: parseOptionalId(formData.get("property_id")),
    space_type: parseSpaceType(formData.get("space_type")),
    floor: str(formData.get("floor")),
    unit: str(formData.get("unit")),
    suite: str(formData.get("suite")),
    capacity_pax: parseOptionalInt(formData.get("capacity_pax")),
    area_sqft: parseOptionalDecimal(formData.get("area_sqft")),
    operator_mode: parseMode(formData.get("operator_mode")),
    operator_company_id: parseOptionalId(formData.get("operator_company_id")),
    operator_name: str(formData.get("operator_name")),
    offer_type: parseOfferType(formData.get("offer_type")),
    asking_rent: parseOptionalDecimal(formData.get("asking_rent")),
    deposit_months: parseOptionalInt(formData.get("deposit_months")),
    contract_term_months: parseOptionalInt(formData.get("contract_term_months")),
    available_date: str(formData.get("available_date")),
    commission_rate: parseOptionalDecimal(formData.get("commission_rate")),
    listing_intent: parseListingIntent(formData.get("listing_intent")),
    asking_sale_price: parseOptionalDecimal(formData.get("asking_sale_price")),
    status: parsePropertyStatus(formData.get("status")),
    remarks: str(formData.get("remarks")),
  });

  revalidatePath("/admin");
  revalidatePath("/admin/properties");
  revalidatePath("/admin/buildings");
  revalidatePath("/admin/companies");
  revalidatePath("/admin/opportunities");
  redirect(`/admin/properties/${propertyId}`);
}

/** @deprecated Use quickAddPropertyAction */
export const quickAddOfferAction = quickAddPropertyAction;

/** @deprecated Use quickAddPropertyAction */
export const quickAddInventoryAction = quickAddPropertyAction;
