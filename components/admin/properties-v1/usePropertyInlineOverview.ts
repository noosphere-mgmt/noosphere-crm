"use client";

import { useCallback, useMemo } from "react";
import { patchPropertyFieldAction } from "@/app/admin/properties/actions";
import { composeAddressChinese, composeAddressEnglish, hasAddressParts } from "@/lib/composeAddress";
import { toCompanyV1SelectOptions, coerceCompanyIdToSelectValue } from "@/lib/companyV1Display";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { PropertyV1 } from "@/lib/repos/propertiesV1";

export function usePropertyInlineOverview(property: PropertyV1, companies: CompanyV1Option[]) {
  const companyOptions = useMemo(() => toCompanyV1SelectOptions(companies), [companies]);

  const save = useCallback(
    (field: string) => async (value: unknown) => {
      const result = await patchPropertyFieldAction(property.property_id, field, JSON.stringify(value));
      return { ok: result.ok, error: result.ok ? undefined : result.error };
    },
    [property.property_id],
  );

  const addressEn = useMemo(() => {
    const parts = {
      streetNo: property.street_no,
      streetName: property.street_name_en,
      district: property.district_en,
      city: property.city_en,
    };
    return hasAddressParts(parts)
      ? composeAddressEnglish(parts)
      : property.full_address_en?.trim() || composeAddressEnglish(parts);
  }, [property]);

  const addressZh = useMemo(() => {
    const parts = {
      streetNo: property.street_no,
      streetName: property.street_name_zh,
      district: property.district_zh,
      city: property.city_zh,
    };
    return hasAddressParts(parts)
      ? composeAddressChinese(parts)
      : property.full_address_zh?.trim() || composeAddressChinese(parts);
  }, [property]);

  const locationSummary = useMemo(() => {
    const parts = [property.country, property.city_en, property.district_en].filter(Boolean);
    return parts.length > 0 ? parts.join(" · ") : addressEn || "—";
  }, [property.country, property.city_en, property.district_en, addressEn]);

  return { companyOptions, coerceCompanyId: (id: string | null) => coerceCompanyIdToSelectValue(id, companyOptions), save, addressEn, addressZh, locationSummary };
}
