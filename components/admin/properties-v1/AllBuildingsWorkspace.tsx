"use client";

import { Suspense } from "react";
import { AdminViewportSwitch } from "@/components/admin/layout/AdminViewportSwitch";
import { AdminListLoadingFallback } from "@/components/admin/layout/AdminListLoadingFallback";
import { BuildingsDesktop } from "@/components/admin/properties-v1/BuildingsDesktop";
import { BuildingsMobile } from "@/components/admin/properties-v1/BuildingsMobile";
import { PropertiesListSelectionProvider } from "@/components/admin/properties-v1/PropertiesListSelectionContext";
import type { PropertyListRow } from "@/components/admin/properties-v1/PropertiesFlatListClient";
import type { PropertyV1, PropertyV1SelectOption } from "@/lib/repos/propertiesV1";
import type { PremisesV1 } from "@/lib/repos/premisesV1";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { ContactV1Option } from "@/lib/repos/contactsV1";

export function AllBuildingsWorkspace({
  rows,
  totalCount,
  initialQuery,
  selectedProperty,
  selectedPremises,
  propertyOptions,
  companies,
  contacts,
}: {
  rows: PropertyListRow[];
  totalCount: number;
  initialQuery?: string;
  selectedProperty: PropertyV1 | null;
  selectedPremises: PremisesV1[];
  propertyOptions: PropertyV1SelectOption[];
  companies: CompanyV1Option[];
  contacts: ContactV1Option[];
}) {
  const viewProps = {
    rows,
    totalCount,
    initialQuery,
    selectedProperty,
    selectedPremises,
    propertyOptions,
    companies,
    contacts,
  };

  return (
    <PropertiesListSelectionProvider>
      <Suspense fallback={<AdminListLoadingFallback />}>
        <AdminViewportSwitch
          mobile={<BuildingsMobile {...viewProps} />}
          desktop={<BuildingsDesktop {...viewProps} />}
        />
      </Suspense>
    </PropertiesListSelectionProvider>
  );
}
