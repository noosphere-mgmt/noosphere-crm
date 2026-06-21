import { BUILDING_GRADES, BUILDING_TITLES } from "@/lib/lookups";
import type { PropertyV1, PropertyV1Patch } from "@/lib/repos/propertiesV1";

export const PROPERTY_LOCATION_FIELDS = new Set([
  "country",
  "city_en",
  "city_zh",
  "city_cn",
  "district_en",
  "district_zh",
  "district_cn",
  "street_no",
  "street_name_en",
  "street_name_zh",
  "street_name_cn",
]);

export const PROPERTY_COMPANY_FIELDS = new Set([
  "management_company_id",
  "operator_company_id",
  "owner_company_id",
  "current_tenant_company_id",
]);

function strOrNull(value: unknown): string | null {
  const s = String(value ?? "").trim();
  return s || null;
}

function intOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : null;
}

function decOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

function mustBeIn(value: unknown, allowed: readonly string[]): string | null {
  const s = strOrNull(value);
  if (!s) return null;
  return allowed.includes(s) ? s : null;
}

export function applyPropertyFieldPatch(
  _property: PropertyV1,
  field: string,
  value: unknown,
): PropertyV1Patch | { error: string } {
  const patch: PropertyV1Patch = {};

  switch (field) {
    case "bldg_name_en":
    case "bldg_name_zh":
    case "bldg_name_cn":
    case "country":
    case "city_en":
    case "city_zh":
    case "city_cn":
    case "district_en":
    case "district_zh":
    case "district_cn":
    case "street_no":
    case "street_name_en":
    case "street_name_zh":
    case "street_name_cn":
    case "lot_number":
    case "land_use":
    case "class_of_site":
    case "land_tenure":
    case "mtr_station":
    case "green_certification":
    case "bldg_desc":
    case "building_remarks":
    case "facilities":
      patch[field] = strOrNull(value);
      break;
    case "year_built":
    case "floor_count":
    case "walking_minutes":
      patch[field] = intOrNull(value);
      break;
    case "bldg_area_sqft":
    case "bldg_area_sqm":
    case "plot_ratio":
    case "site_area_sqft":
    case "site_area_sqm":
      patch[field] = decOrNull(value);
      break;
    case "grade": {
      const grade = mustBeIn(value, BUILDING_GRADES);
      if (value && !grade) return { error: "Invalid grade" };
      patch.grade = grade;
      break;
    }
    case "title": {
      const title = mustBeIn(value, BUILDING_TITLES);
      if (value && !title) return { error: "Invalid title" };
      patch.title = title;
      break;
    }
    case "management_company_id":
    case "operator_company_id":
    case "owner_company_id":
    case "current_tenant_company_id":
      patch[field] = strOrNull(value);
      break;
    default:
      return { error: `Field "${field}" cannot be edited inline` };
  }

  return patch;
}
