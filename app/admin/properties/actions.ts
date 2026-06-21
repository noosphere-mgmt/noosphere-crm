"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseRelationshipLines, syncRelationshipColumns, normalizeRelationshipLines } from "@/lib/premisesRelationships";
import { loadCompanyLookupMaps } from "@/lib/companyV1Resolve";
import { resolveToV1CompanyId } from "@/lib/companyIdResolve";
import { isPackageOperatingModel } from "@/lib/premisesCommercial";
import { applyPremisesFieldPatch } from "@/lib/premisesFieldPatch";
import { composePropertyFullAddresses } from "@/lib/composeAddress";
import { createPropertyV1, deletePropertiesV1, getPropertyV1, updatePropertyV1, type PropertyV1Patch } from "@/lib/repos/propertiesV1";
import { applyPropertyFieldPatch, PROPERTY_COMPANY_FIELDS, PROPERTY_LOCATION_FIELDS } from "@/lib/propertyFieldPatch";
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

async function parsePropertyV1Form(formData: FormData): Promise<PropertyV1Patch> {
  const maps = await loadCompanyLookupMaps();
  const normalize = (raw: FormDataEntryValue | null) => {
    const v = s(raw);
    return v ? resolveToV1CompanyId(v, maps) : null;
  };

  const patch: PropertyV1Patch = {
    bldg_name_en: s(formData.get("bldg_name_en")),
    bldg_name_zh: s(formData.get("bldg_name_zh")),
    bldg_name_cn: s(formData.get("bldg_name_cn")),
    floor_count: nInt(formData.get("floor_count")),
    bldg_area_sqft: nDec(formData.get("bldg_area_sqft")),
    bldg_area_sqm: nDec(formData.get("bldg_area_sqm")),
    year_built: nInt(formData.get("year_built")),
    bldg_desc: s(formData.get("bldg_desc")),
    building_remarks: s(formData.get("building_remarks")),
    country: s(formData.get("country")),
    city_en: s(formData.get("city_en")),
    city_zh: s(formData.get("city_zh")),
    city_cn: s(formData.get("city_cn")),
    district_en: s(formData.get("district_en")),
    district_zh: s(formData.get("district_zh")),
    district_cn: s(formData.get("district_cn")),
    street_no: s(formData.get("street_no")),
    street_name_en: s(formData.get("street_name_en")),
    street_name_zh: s(formData.get("street_name_zh")),
    street_name_cn: s(formData.get("street_name_cn")),
    land_use: s(formData.get("land_use")),
    class_of_site: s(formData.get("class_of_site")),
    land_tenure: s(formData.get("land_tenure")),
    plot_ratio: nDec(formData.get("plot_ratio")),
    site_area_sqft: nDec(formData.get("site_area_sqft")),
    site_area_sqm: nDec(formData.get("site_area_sqm")),
    lot_number: s(formData.get("lot_number")),
    grade: s(formData.get("grade")),
    management_company_id: normalize(formData.get("management_company_id")),
    operator_company_id: normalize(formData.get("operator_company_id")),
    owner_company_id: normalize(formData.get("owner_company_id")),
    current_tenant_company_id: normalize(formData.get("current_tenant_company_id")),
    title: s(formData.get("title")),
    mtr_station: s(formData.get("mtr_station")),
    walking_minutes: nInt(formData.get("walking_minutes")),
    facilities: s(formData.get("facilities")),
    green_certification: s(formData.get("green_certification")),
  };

  Object.assign(patch, composePropertyFullAddresses(patch));
  return patch;
}

export async function createPropertyV1Action(formData: FormData) {
  const patch = await parsePropertyV1Form(formData);
  const propertyId = await createPropertyV1(patch);

  revalidatePath("/admin/properties");
  revalidatePath("/admin/properties/buildings");

  const returnTo = s(formData.get("return_to"));
  if (returnTo?.startsWith("/admin/properties")) {
    redirect(returnTo);
  }
  redirect(`/admin/properties/buildings?property=${encodeURIComponent(propertyId)}&mode=view`);
}

export async function updatePropertyV1Action(propertyId: string, formData: FormData) {
  await updatePropertyV1(propertyId, await parsePropertyV1Form(formData));

  revalidatePath("/admin/properties");
  revalidatePath("/admin/properties/buildings");
  revalidatePath(`/admin/properties/${propertyId}`);

  const returnTo = s(formData.get("return_to"));
  if (returnTo?.startsWith("/admin/properties")) {
    redirect(returnTo);
  }
  redirect(`/admin/properties/${propertyId}`);
}

async function parsePremisesV1Form(formData: FormData): Promise<PremisesV1Patch> {
  const maps = await loadCompanyLookupMaps();
  const relationshipLines = normalizeRelationshipLines(
    parseRelationshipLines(s(formData.get("relationship_lines"))),
    maps,
  );
  const synced = syncRelationshipColumns(relationshipLines);

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
    owner_company_id: synced.owner_company_id,
    landlord_company_id: synced.landlord_company_id,
    current_tenant_company_id: synced.current_tenant_company_id,
    operator_company_id: synced.operator_company_id,
    source_company_id: synced.source_company_id,
    source_contact_id: synced.source_contact_id,
    source_contact_role: synced.source_contact_role,
    source_url: synced.source_url,
    source_file: synced.source_file,
    relationship_lines: relationshipLines,
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

  const premisesId = await createPremisesV1(id, await parsePremisesV1Form(formData));

  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${id}`);

  const returnTo = s(formData.get("return_to"));
  if (returnTo?.startsWith("/admin/properties")) {
    redirect(returnTo);
  }
  redirect(`/admin/properties?premises=${encodeURIComponent(premisesId)}&mode=view`);
}

export async function updatePremisesV1Action(premisesId: string, propertyId: string, formData: FormData) {
  const patch = await parsePremisesV1Form(formData);
  const nextPropertyId = s(formData.get("property_id")) ?? propertyId;
  if (nextPropertyId !== propertyId) {
    patch.property_id = nextPropertyId;
  }

  await updatePremisesV1(premisesId, patch);

  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${propertyId}`);
  if (nextPropertyId !== propertyId) {
    revalidatePath(`/admin/properties/${nextPropertyId}`);
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

    if (PROPERTY_COMPANY_FIELDS.has(field)) {
      const maps = await loadCompanyLookupMaps();
      const raw = patch[field as keyof PropertyV1Patch];
      const resolved =
        typeof raw === "string" && raw ? resolveToV1CompanyId(raw, maps) : null;
      if (field === "management_company_id") patch.management_company_id = resolved;
      else if (field === "operator_company_id") patch.operator_company_id = resolved;
      else if (field === "owner_company_id") patch.owner_company_id = resolved;
      else if (field === "current_tenant_company_id") patch.current_tenant_company_id = resolved;
    }

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

    await updatePremisesV1(premisesId, patch);

    const nextPropertyId = patch.property_id ?? premises.property_id;
    revalidatePath("/admin/properties");
    revalidatePath(`/admin/properties/${premises.property_id}`);
    if (nextPropertyId !== premises.property_id) {
      revalidatePath(`/admin/properties/${nextPropertyId}`);
    }

    return { ok: true };
  } catch (err) {
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
