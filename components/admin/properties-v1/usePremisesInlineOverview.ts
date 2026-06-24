"use client";

import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { patchPremisesFieldAction } from "@/app/admin/properties/actions";
import { controllingParty } from "@/components/admin/properties-v1/premisesInlineOverviewShared";
import { toCompanyV1SelectOptions, coerceCompanyIdToSelectValue } from "@/lib/companyV1Display";
import { asArray } from "@/lib/asArray";
import { asCompanyV1Options } from "@/lib/premisesClientData";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import {
  isPackageOperatingModel,
  monthlyRentFieldLabel,
  packageFeesNote,
} from "@/lib/premisesCommercial";
import {
  isListingIntentForLease,
  isListingIntentForSale,
  normalizeListingIntent,
} from "@/lib/premisesListing";
import { premisesDrawerHref } from "@/lib/premisesDrawerNav";
import type { PremisesDetailTabId } from "@/lib/premisesDetailTab";
import type { PropertyV1SelectOption } from "@/lib/repos/propertiesV1";
import type { PremisesV1 } from "@/lib/repos/premisesV1";

export function usePremisesInlineOverview(
  premises: PremisesV1,
  propertyOptions: PropertyV1SelectOption[],
  companies: CompanyV1Option[],
  companyLabels: Map<string, string>,
  drawerBasePath = "/admin/properties",
) {
  const searchParams = useSearchParams();
  const currency = premises.currency ?? "HKD";
  const rentLabel = monthlyRentFieldLabel(premises.operating_model);
  const feesNote = packageFeesNote(premises.operating_model);
  const listingIntent = normalizeListingIntent(premises.inventory_status);
  const forLease = isListingIntentForLease(premises.inventory_status);
  const forSale = isListingIntentForSale(premises.inventory_status);
  const controller = controllingParty(premises, companyLabels);
  const companyOptions = useMemo(() => toCompanyV1SelectOptions(asCompanyV1Options(companies)), [companies]);

  const propertySelectOptions = useMemo(
    () => asArray<PropertyV1SelectOption>(propertyOptions).map((p) => ({ value: p.property_id, label: p.label })),
    [propertyOptions],
  );

  const coerceCompanyId = useCallback(
    (id: string | null | undefined) => coerceCompanyIdToSelectValue(id, companyOptions),
    [companyOptions],
  );

  const save = useCallback(
    (field: string) => async (value: unknown) => {
      const result = await patchPremisesFieldAction(premises.premises_id, field, JSON.stringify(value));
      return { ok: result.ok, error: result.ok ? undefined : result.error };
    },
    [premises.premises_id],
  );

  function tabHref(tab: PremisesDetailTabId) {
    return premisesDrawerHref(searchParams, premises.premises_id, tab, "view", drawerBasePath);
  }

  return {
    currency,
    rentLabel,
    feesNote,
    listingIntent,
    forLease,
    forSale,
    controller,
    companyOptions,
    coerceCompanyId,
    propertySelectOptions,
    save,
    tabHref,
  };
}
