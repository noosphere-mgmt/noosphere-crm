"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  parseRelationshipLines,
} from "@/lib/premisesRelationships";
import { buildPremisesRelationshipLinesPatch } from "@/lib/premisesRelationshipPatch";
import { isPackageOperatingModel } from "@/lib/premisesCommercial";
import { applyPremisesFieldPatch } from "@/lib/premisesFieldPatch";
import { composePropertyFullAddresses } from "@/lib/composeAddress";
import { rethrowNextNavigation } from "@/lib/nextNavigation";
import { parsePropertyV1Form } from "@/lib/parsePropertyV1Form";
import { createPropertyV1, deletePropertiesV1, getPropertyV1, updatePropertyV1, type PropertyV1Patch } from "@/lib/repos/propertiesV1";
import { applyPropertyFieldPatch, PROPERTY_LOCATION_FIELDS } from "@/lib/propertyFieldPatch";
import { createPremisesV1, duplicatePremisesV1, getPremisesV1, updatePremisesV1, type PremisesV1Patch } from "@/lib/repos/premisesV1";

function s(v: FormDataEntryValue | null): string | null {
  const out = String(v ?? "").trim();
  return out ? out : null;
}

function nInt(v: FormDataEntryValue | null): number | null {
  const out = String(v ?? "").trim();
  if (!out) return null;
  const n = Number.parseInt(out, 10);
  return Number.isFinite(n) ? n : null;
}

function nDec(v: FormDataEntryValue | null): number | null {
  const out = String(v ?? "").trim();
  if (!out) return null;
  const n = Number.parseFloat(out);
  return Number.isFinite(n) ? n : null;
}

function buildingViewUrl(propertyId: string, returnTo: string | null): string {
  const base = returnTo?.startsWith("/admin/properties")
    ? returnTo.split("?")[0]!
    : "/admin/properties/buildings";
  const params = new URLSearchParams(returnTo?.includes("?") ? returnTo.split("?")[1] : "");
  params.set("property", propertyId);
  params.set("mode", "view");
  return `${base}?${params.toString()}`;
}

export async function createPropertyV1Action(formData: FormData) {
  let propertyId: string;
  try {
    const patch = parsePropertyV1Form(formData);
    propertyId = await createPropertyV1(patch);
    revalidatePath("/admin/properties");
    revalidatePath("/admin/properties/buildings");
  } catch (err) {
    rethrowNextNavigation(err);
    throw new Error(err instanceof Error ? err.message : "Failed to create building");
  }

  redirect(buildingViewUrl(propertyId, s(formData.get("return_to"))));
}

export async function updatePropertyV1Action(propertyId: string, formData: FormData) {
  try {
    await updatePropertyV1(propertyId, parsePropertyV1Form(formData));
    revalidatePath("/admin/properties");
    revalidatePath("/admin/properties/buildings");
    revalidatePath(`/admin/properties/${propertyId}`);
  } catch (err) {
    rethrowNextNavigation(err);
    throw new Error(err instanceof Error ? err.message : "Failed to save building");
  }

  const returnTo = s(formData.get("return_to"));
  if (returnTo?.startsWith("/admin/properties")) {
    redirect(returnTo);
  }
  redirect(`/admin/properties/${propertyId}`);
}

async function parsePremisesV1Form(formData: FormData): Promise<PremisesV1Patch> {
  const relationshipPatch = await buildPremisesRelationshipLinesPatch(
    parseRelationshipLines(s(formData.get("relationship_lines"))),
  );

  const operatingModel = s(formData.get("operating_model"));
  const packageFees = isPackageOperatingModel(operatingModel);

  return {
    property_name_en: s(formData.get("property_name_en")),
    property_name_zh: s(formData.get("property_name_zh")),
    property_type: s(formData.get("property_type")),
    operating_model: operatingModel,
    fit_out_condition: s(formData.get("fit_out_condition")),
    inventory_status: s(formData.get("inventory_status")),
    floor: s(formData.get("floor")),
    unit: s(formData.get("unit")),
    workstation_count: s(formData.get("workstation_count")),
    office_type: s(formData.get("office_type")),
    gross_area_sqft: nDec(formData.get("gross_area_sqft")),
    net_area_sqft: nDec(formData.get("net_area_sqft")),
    view_type: s(formData.get("view_type")),
    currency: s(formData.get("currency")) ?? "HKD",
    management_fee: packageFees ? 0 : nDec(formData.get("management_fee")),
    government_rates: packageFees ? 0 : nDec(formData.get("government_rates")),
    remarks: s(formData.get("remarks")),
    ...relationshipPatch,
    offer_type: s(formData.get("offer_type")),
    offer_status: s(formData.get("offer_status")),
    capacity_pax: nInt(formData.get("capacity_pax")),
    monthly_rent: nDec(formData.get("monthly_rent")),
    rent_psf: nDec(formData.get("rent_psf")),
    deposit_months: s(formData.get("deposit_months")),
    rent_free_period: s(formData.get("rent_free_period")),
    contract_term_months: nInt(formData.get("contract_term_months")),
    available_date: s(formData.get("available_date")),
    asking_sale_price: nDec(formData.get("asking_sale_price")),
    sale_price_psf: nDec(formData.get("sale_price_psf")),
    negotiable_sale_price: nDec(formData.get("negotiable_sale_price")),
    negotiable_sale_price_psf: nDec(formData.get("negotiable_sale_price_psf")),
    expected_commission: s(formData.get("expected_commission")),
    payout_commission: s(formData.get("payout_commission")),
    commission_remarks: s(formData.get("commission_remarks")),
    last_verified_date: s(formData.get("last_verified_date")),
    listing_remarks: s(formData.get("listing_remarks")),
  };
}

export async function createPremisesV1Action(propertyId: string, formData: FormData) {
  const id = propertyId.trim();
  if (!id) throw new Error("Select a building for this premise.");

  let premisesId: string;
  try {
    premisesId = await createPremisesV1(id, await parsePremisesV1Form(formData));
    revalidatePath("/admin/properties");
    revalidatePath(`/admin/properties/${id}`);
  } catch (err) {
    rethrowNextNavigation(err);
    throw new Error(err instanceof Error ? err.message : "Failed to create premises");
  }

  const returnTo = s(formData.get("return_to"));
  if (returnTo?.startsWith("/admin/properties")) {
    redirect(returnTo);
  }
  redirect(`/admin/properties?premises=${encodeURIComponent(premisesId)}&mode=view`);
}

export async function updatePremisesV1Action(premisesId: string, propertyId: string, formData: FormData) {
  let nextPropertyId: string;
  try {
    const patch = await parsePremisesV1Form(formData);
    nextPropertyId = s(formData.get("property_id")) ?? propertyId;
    if (nextPropertyId !== propertyId) {
      patch.property_id = nextPropertyId;
    }

    await updatePremisesV1(premisesId, patch);

    revalidatePath("/admin/properties");
    revalidatePath(`/admin/properties/${propertyId}`);
    if (nextPropertyId !== propertyId) {
      revalidatePath(`/admin/properties/${nextPropertyId}`);
    }
  } catch (err) {
    rethrowNextNavigation(err);
    throw new Error(err instanceof Error ? err.message : "Failed to save premises");
  }

  const returnTo = s(formData.get("return_to"));
  if (returnTo?.startsWith("/admin/properties")) {
    redirect(returnTo);
  }
  redirect(`/admin/properties/${nextPropertyId}?premises=${encodeURIComponent(premisesId)}&mode=view`);
}

export type PropertyPatchResult = { ok: true } | { ok: false; error: string };

export async function patchPropertyFieldAction(
  propertyId: string,
  field: string,
  valueJson: string,
): Promise<PropertyPatchResult> {
  try {
    const property = await getPropertyV1(propertyId);
    if (!property) return { ok: false, error: "Building not found" };

    let value: unknown;
    try {
      value = JSON.parse(valueJson);
    } catch {
      return { ok: false, error: "Invalid value" };
    }

    const fieldPatch = applyPropertyFieldPatch(property, field, value);
    if ("error" in fieldPatch) return { ok: false, error: fieldPatch.error };

    const patch: PropertyV1Patch = { ...fieldPatch };

    if (PROPERTY_LOCATION_FIELDS.has(field)) {
      const merged = { ...property, ...patch };
      Object.assign(patch, composePropertyFullAddresses(merged));
    }

    await updatePropertyV1(propertyId, patch);

    revalidatePath("/admin/properties");
    revalidatePath("/admin/properties/buildings");
    revalidatePath(`/admin/properties/${propertyId}`);

    return { ok: true };
  } catch (err) {
    rethrowNextNavigation(err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to save" };
  }
}

export type PremisesPatchResult = { ok: true } | { ok: false; error: string };

export async function patchPremisesFieldAction(
  premisesId: string,
  field: string,
  valueJson: string,
): Promise<PremisesPatchResult> {
  try {
    const premises = await getPremisesV1(premisesId);
    if (!premises) return { ok: false, error: "Premises not found" };

    let value: unknown;
    try {
      value = JSON.parse(valueJson);
    } catch {
      return { ok: false, error: "Invalid value" };
    }

    const patch = applyPremisesFieldPatch(premises, field, value);
    if ("error" in patch) return { ok: false, error: patch.error };

    if (field === "relationship_lines") {
      if (!Array.isArray(value)) return { ok: false, error: "Invalid relationship lines" };
      const relPatch = await buildPremisesRelationshipLinesPatch(value as import("@/lib/v1ListValues").PremisesRelationshipLine[]);
      await updatePremisesV1(premisesId, relPatch);
    } else {
      await updatePremisesV1(premisesId, patch);
    }

    const nextPropertyId = patch.property_id ?? premises.property_id;
    revalidatePath("/admin/properties");
    revalidatePath(`/admin/properties/${premises.property_id}`);
    if (nextPropertyId !== premises.property_id) {
      revalidatePath(`/admin/properties/${nextPropertyId}`);
    }

    return { ok: true };
  } catch (err) {
    rethrowNextNavigation(err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to save" };
  }
}

export type PremisesBulkActionResult = { ok: true; created_count: number } | { ok: false; error: string };

export async function bulkDuplicatePremisesV1Action(formData: FormData): Promise<PremisesBulkActionResult> {
  try {
    const raw = String(formData.get("premises_ids") ?? "").trim();
    const ids = raw ? raw.split(",").map((id) => id.trim()).filter(Boolean) : [];
    if (ids.length === 0) return { ok: false, error: "No premises selected" };

    const propertyIds = new Set<string>();
    for (const id of ids) {
      const source = await getPremisesV1(id);
      if (source) propertyIds.add(source.property_id);
      await duplicatePremisesV1(id);
    }

    revalidatePath("/admin/properties");
    for (const propertyId of propertyIds) {
      revalidatePath(`/admin/properties/${propertyId}`);
    }

    return { ok: true, created_count: ids.length };
  } catch (err) {
    rethrowNextNavigation(err);
    return { ok: false, error: err instanceof Error ? err.message : "Failed to copy premises" };
  }
}

export async function bulkDeletePremisesV1Action(formData: FormData) {
  const raw = String(formData.get("premises_ids") ?? "").trim();
  const ids = raw ? raw.split(",").map((id) => id.trim()).filter(Boolean) : [];
  if (ids.length > 0) {
    const { deletePremisesV1 } = await import("@/lib/repos/premisesV1");
    await deletePremisesV1(ids);
  }

  revalidatePath("/admin/properties");
  const returnTo = s(formData.get("return_to")) ?? "/admin/properties";
  redirect(returnTo.startsWith("/admin") ? returnTo : "/admin/properties");
}

export async function deletePremisesV1FromListAction(
  premisesId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const trimmed = premisesId.trim();
    if (!trimmed) return { ok: false, error: "Invalid premises" };
    const { deletePremisesV1 } = await import("@/lib/repos/premisesV1");
    await deletePremisesV1([trimmed]);
    revalidatePath("/admin/properties");
    return { ok: true };
  } catch (err) {
    rethrowNextNavigation(err);
    return { ok: false, error: err instanceof Error ? err.message : "Delete failed" };
  }
}

export async function bulkDeletePropertiesV1Action(formData: FormData) {
  const raw = String(formData.get("property_ids") ?? "").trim();
  const ids = raw ? raw.split(",").map((id) => id.trim()).filter(Boolean) : [];
  if (ids.length > 0) {
    await deletePropertiesV1(ids);
  }

  revalidatePath("/admin/properties");
  revalidatePath("/admin/properties/buildings");
  const returnTo = s(formData.get("return_to")) ?? "/admin/properties/buildings";
  redirect(returnTo.startsWith("/admin") ? returnTo : "/admin/properties/buildings");
}
