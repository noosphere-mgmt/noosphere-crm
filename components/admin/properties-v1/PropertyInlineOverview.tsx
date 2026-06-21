"use client";

import { AdminViewportSwitch } from "@/components/admin/layout/AdminViewportSwitch";
import { PropertyInlineOverviewDesktop } from "@/components/admin/properties-v1/PropertyInlineOverviewDesktop";
import { PropertyInlineOverviewMobile } from "@/components/admin/properties-v1/PropertyInlineOverviewMobile";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { PropertyV1 } from "@/lib/repos/propertiesV1";

export function PropertyInlineOverview({
  property,
  companies,
}: {
  property: PropertyV1;
  companies: CompanyV1Option[];
}) {
  return (
    <AdminViewportSwitch
      mobile={<PropertyInlineOverviewMobile property={property} companies={companies} />}
      desktop={<PropertyInlineOverviewDesktop property={property} companies={companies} />}
    />
  );
}
