import type { BuildingRelationshipLine } from "@/lib/buildingRelationships";
import { normalizeBuildingRelationships } from "@/lib/buildingRelationships";
import type { PropertyV1 } from "@/lib/repos/propertiesV1";

export const BUILDING_MERGE_FIELD_KEYS = [
  "bldg_name_en",
  "bldg_name_zh",
  "bldg_name_cn",
  "building_type",
  "title",
  "grade",
  "tower_block",
  "year_built",
  "floor_count",
  "bldg_area_sqft",
  "bldg_area_sqm",
  "full_address_en",
  "full_address_zh",
  "full_address_cn",
  "district_en",
  "district_zh",
  "district_cn",
  "street_no",
  "street_name_en",
  "street_name_zh",
  "street_name_cn",
  "city_en",
  "city_zh",
  "city_cn",
  "country",
  "mtr_station",
  "walking_minutes",
  "lot_number",
  "land_use",
  "class_of_site",
  "land_tenure",
  "plot_ratio",
  "site_area_sqft",
  "site_area_sqm",
  "owner_company_id",
  "operator_company_id",
  "management_company_id",
  "current_tenant_company_id",
  "facilities",
  "facilities_zh",
  "facilities_cn",
  "green_certification",
  "bldg_desc",
  "bldg_desc_zh",
  "bldg_desc_cn",
  "location_advantages_en",
  "location_advantages_zh",
  "location_advantages_cn",
  "proposal_highlights_en",
  "proposal_highlights_zh",
  "proposal_highlights_cn",
  "building_remarks",
] as const;

export type BuildingMergeFieldKey = (typeof BUILDING_MERGE_FIELD_KEYS)[number];
/** Source building property_id whose value should survive for this field. */
export type BuildingMergeFieldChoices = Partial<Record<BuildingMergeFieldKey, string>>;

export const BUILDING_MERGE_FIELD_LABELS: Record<BuildingMergeFieldKey, string> = {
  bldg_name_en: "Building Name EN",
  bldg_name_zh: "Building Name ZH",
  bldg_name_cn: "Building Name CN",
  building_type: "Building Type",
  title: "Property Sector / Title",
  grade: "Grade",
  tower_block: "Tower / Block",
  year_built: "Year Built",
  floor_count: "Floors",
  bldg_area_sqft: "GFA (sq ft)",
  bldg_area_sqm: "GFA (sq m)",
  full_address_en: "Address EN",
  full_address_zh: "Address ZH",
  full_address_cn: "Address CN",
  district_en: "District EN",
  district_zh: "District ZH",
  district_cn: "District CN",
  street_no: "Street No.",
  street_name_en: "Street Name EN",
  street_name_zh: "Street Name ZH",
  street_name_cn: "Street Name CN",
  city_en: "City EN",
  city_zh: "City ZH",
  city_cn: "City CN",
  country: "Country",
  mtr_station: "MTR Station",
  walking_minutes: "Walking Minutes",
  lot_number: "Lot Number",
  land_use: "Land Use",
  class_of_site: "Class of Site",
  land_tenure: "Land Tenure",
  plot_ratio: "Plot Ratio",
  site_area_sqft: "Site Area (sq ft)",
  site_area_sqm: "Site Area (sq m)",
  owner_company_id: "Landlord / Owner",
  operator_company_id: "Operator",
  management_company_id: "Management Office",
  current_tenant_company_id: "Current Occupant",
  facilities: "Facilities EN",
  facilities_zh: "Facilities ZH",
  facilities_cn: "Facilities CN",
  green_certification: "Green Certification",
  bldg_desc: "Description EN",
  bldg_desc_zh: "Description ZH",
  bldg_desc_cn: "Description CN",
  location_advantages_en: "Location Advantages EN",
  location_advantages_zh: "Location Advantages ZH",
  location_advantages_cn: "Location Advantages CN",
  proposal_highlights_en: "Proposal Highlights EN",
  proposal_highlights_zh: "Proposal Highlights ZH",
  proposal_highlights_cn: "Proposal Highlights CN",
  building_remarks: "Remarks",
};

const COMPANY_FIELDS = new Set<BuildingMergeFieldKey>([
  "owner_company_id",
  "operator_company_id",
  "management_company_id",
  "current_tenant_company_id",
]);

export function isCompanyMergeField(key: BuildingMergeFieldKey): boolean {
  return COMPANY_FIELDS.has(key);
}

export function isEmptyMergeValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (typeof value === "number") return !Number.isFinite(value);
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function serializeMergeValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  return String(value).trim();
}

export function readMergeField(property: PropertyV1, key: BuildingMergeFieldKey): unknown {
  return (property as Record<string, unknown>)[key];
}

export type BuildingMergeFieldCell = {
  propertyId: string;
  value: unknown;
  empty: boolean;
};

export type BuildingMergeFieldRow = {
  key: BuildingMergeFieldKey;
  label: string;
  cells: BuildingMergeFieldCell[];
  defaultSourceId: string;
  identical: boolean;
  conflict: boolean;
  allEmpty: boolean;
};

/**
 * Prefer a populated value over blank. On conflict, prefer the surviving record
 * if it is populated, otherwise the first populated building in listing order.
 */
export function defaultMergeFieldSource(
  buildings: PropertyV1[],
  key: BuildingMergeFieldKey,
  survivorId: string,
): string {
  if (buildings.length === 0) return survivorId;
  const populated = buildings.filter((building) => !isEmptyMergeValue(readMergeField(building, key)));
  if (populated.length === 0) return survivorId;

  const unique = new Set(populated.map((building) => serializeMergeValue(readMergeField(building, key))));
  if (unique.size === 1) return populated[0]!.property_id;

  const survivor = buildings.find((building) => building.property_id === survivorId);
  if (survivor && !isEmptyMergeValue(readMergeField(survivor, key))) return survivor.property_id;
  return populated[0]!.property_id;
}

export function compareBuildingMergeGroup(
  buildings: PropertyV1[],
  survivorId: string,
): BuildingMergeFieldRow[] {
  return BUILDING_MERGE_FIELD_KEYS.map((key) => {
    const cells: BuildingMergeFieldCell[] = buildings.map((building) => {
      const value = readMergeField(building, key);
      return { propertyId: building.property_id, value, empty: isEmptyMergeValue(value) };
    });
    const populatedSerials = cells.filter((cell) => !cell.empty).map((cell) => serializeMergeValue(cell.value));
    const uniquePopulated = new Set(populatedSerials);
    const allEmpty = cells.every((cell) => cell.empty);
    const uniqueSerials = new Set(cells.map((cell) => serializeMergeValue(cell.value)));
    const identical = uniqueSerials.size <= 1;
    return {
      key,
      label: BUILDING_MERGE_FIELD_LABELS[key],
      cells,
      defaultSourceId: defaultMergeFieldSource(buildings, key, survivorId),
      identical: identical && uniquePopulated.size <= 1,
      conflict: uniquePopulated.size > 1,
      allEmpty,
    };
  });
}

export function resolveMergeFieldPatchFromSources(
  survivor: PropertyV1,
  buildings: PropertyV1[],
  choices: BuildingMergeFieldChoices,
): Partial<Record<BuildingMergeFieldKey, unknown>> {
  const byId = new Map(buildings.map((building) => [building.property_id, building]));
  const allowed = new Set(byId.keys());
  const patch: Partial<Record<BuildingMergeFieldKey, unknown>> = {};
  for (const key of BUILDING_MERGE_FIELD_KEYS) {
    const requested = choices[key]?.trim();
    const sourceId = requested && allowed.has(requested) ? requested : defaultMergeFieldSource(buildings, key, survivor.property_id);
    const source = byId.get(sourceId) ?? survivor;
    const next = readMergeField(source, key);
    const current = readMergeField(survivor, key);
    if (serializeMergeValue(next) === serializeMergeValue(current)) continue;
    patch[key] = isEmptyMergeValue(next) ? null : next;
  }
  return patch;
}

export function resolvedMergeFieldChoices(
  buildings: PropertyV1[],
  survivorId: string,
  choices: BuildingMergeFieldChoices,
): BuildingMergeFieldChoices {
  const allowed = new Set(buildings.map((building) => building.property_id));
  const resolved: BuildingMergeFieldChoices = {};
  for (const key of BUILDING_MERGE_FIELD_KEYS) {
    const requested = choices[key]?.trim();
    resolved[key] = requested && allowed.has(requested) ? requested : defaultMergeFieldSource(buildings, key, survivorId);
  }
  return resolved;
}

export function mergeBuildingRelationshipLines(
  ...groups: Array<BuildingRelationshipLine[] | unknown>
): BuildingRelationshipLine[] {
  const merged: BuildingRelationshipLine[] = [];
  for (const group of groups) {
    for (const line of normalizeBuildingRelationships(group)) {
      const exists = merged.some(
        (existing) => existing.role === line.role && existing.company_id === line.company_id,
      );
      if (!exists) merged.push(line);
    }
  }
  return merged;
}

export function collectSearchAliases(survivor: PropertyV1, archived: PropertyV1[]): string[] {
  const existing = new Set((survivor.search_aliases ?? []).map((alias) => alias.trim()).filter(Boolean));
  const survivorNames = new Set(
    [survivor.bldg_name_en, survivor.bldg_name_zh, survivor.bldg_name_cn]
      .map((name) => name?.trim() ?? "")
      .filter(Boolean),
  );
  for (const duplicate of archived) {
    const candidates = [
      duplicate.bldg_name_en,
      duplicate.bldg_name_zh,
      duplicate.bldg_name_cn,
      duplicate.business_id,
      duplicate.property_id,
      ...(duplicate.search_aliases ?? []),
    ];
    for (const raw of candidates) {
      const alias = raw?.trim();
      if (!alias) continue;
      if (survivorNames.has(alias)) continue;
      if (alias === survivor.business_id?.trim() || alias === survivor.property_id) continue;
      existing.add(alias);
    }
  }
  return [...existing];
}

export function buildingDisplayName(
  property: Pick<PropertyV1, "bldg_name_en" | "bldg_name_zh" | "property_id" | "business_id">,
): string {
  return (
    property.bldg_name_en?.trim() ||
    property.bldg_name_zh?.trim() ||
    property.business_id?.trim() ||
    property.property_id
  );
}

export function parseBuildingMergeIds(raw: string | string[] | undefined): string[] {
  const value = Array.isArray(raw) ? raw.join(",") : raw ?? "";
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const part of value.split(/[,\s]+/)) {
    const id = part.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}
