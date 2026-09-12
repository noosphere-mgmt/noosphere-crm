import { toLegacyCompanySelectOptions } from "@/lib/crmSelectOptions";
import type { CompanyOption } from "@/lib/repos/companies";
import type { PropertyV1, PropertyV1SelectOption } from "@/lib/repos/propertiesV1";

export type TypeaheadOption = {
  value: string;
  label: string;
  searchText?: string;
  detail?: string;
};

export function companyTypeaheadOptions(companies: CompanyOption[]): TypeaheadOption[] {
  return toLegacyCompanySelectOptions(companies).map((option) => ({
    value: option.value,
    label: option.label,
    searchText: [option.label, option.value, option.businessId].filter(Boolean).join(" "),
  }));
}

function joinSearchParts(parts: Array<string | null | undefined>): string {
  return parts.map((part) => part?.trim()).filter(Boolean).join(" ");
}

export function buildingTypeaheadOptionFromProperty(property: PropertyV1): TypeaheadOption {
  const name = property.bldg_name_en?.trim() || property.property_id;
  const district = property.district_en?.trim();
  const address =
    property.full_address_en?.trim() ||
    [property.street_no, property.street_name_en, property.district_en].filter(Boolean).join(" ");
  return {
    value: property.property_id,
    label: district ? `${name} · ${district}` : name,
    detail: [address, property.business_id].filter(Boolean).join(" · ") || undefined,
    searchText: joinSearchParts([
      property.property_id,
      property.business_id,
      property.bldg_name_en,
      property.bldg_name_zh,
      property.bldg_name_cn,
      property.tower_block,
      property.full_address_en,
      property.full_address_zh,
      property.full_address_cn,
      property.street_no,
      property.street_name_en,
      property.street_name_zh,
      property.street_name_cn,
      property.district_en,
      property.district_zh,
      property.district_cn,
      property.city_en,
      property.city_zh,
      property.mtr_station,
      property.building_remarks,
      property.bldg_desc,
    ]),
  };
}

export function buildingTypeaheadOptionFromSelect(option: PropertyV1SelectOption): TypeaheadOption {
  return {
    value: option.property_id,
    label: option.label,
    detail: [option.full_address, option.business_id].filter(Boolean).join(" · ") || undefined,
    searchText: joinSearchParts([
      option.label,
      option.property_id,
      option.business_id,
      option.name_en,
      option.name_zh,
      option.name_cn,
      option.full_address,
      option.street_no,
      option.street_name_en,
      option.street_name_zh,
      option.street_name_cn,
      option.district,
      option.city,
      option.country,
      option.mtr_station,
      option.remarks,
      option.description,
      option.owner_landlord_search,
    ]),
  };
}
