import { composePropertyFullAddresses, hasAddressParts } from "@/lib/composeAddress";
import type { PropertyV1Patch } from "@/lib/repos/propertiesV1";

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

/** Parse a full building form submission into a properties_v1 patch. */
export function parsePropertyV1Form(formData: FormData): PropertyV1Patch {
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
    management_company_id: s(formData.get("management_company_id")),
    owner_company_id: s(formData.get("owner_company_id")),
    current_tenant_company_id: s(formData.get("current_tenant_company_id")),
    title: s(formData.get("title")),
    mtr_station: s(formData.get("mtr_station")),
    walking_minutes: nInt(formData.get("walking_minutes")),
    facilities: s(formData.get("facilities")),
    green_certification: s(formData.get("green_certification")),
  };

  const composed = composePropertyFullAddresses(patch);
  const hasParts = hasAddressParts({
    streetNo: patch.street_no,
    streetName: patch.street_name_en,
    district: patch.district_en,
    city: patch.city_en,
  });

  patch.full_address_en = composed.full_address_en ?? (hasParts ? null : s(formData.get("full_address_en")));
  patch.full_address_zh = composed.full_address_zh ?? s(formData.get("full_address_zh"));
  patch.full_address_cn = composed.full_address_cn ?? s(formData.get("full_address_cn"));

  return patch;
}
