"use client";

import { Suspense } from "react";
import { AdminViewportSwitch } from "@/components/admin/layout/AdminViewportSwitch";
import { AdminListLoadingFallback } from "@/components/admin/layout/AdminListLoadingFallback";
import { PropertiesSplitDesktop } from "@/components/admin/properties-v1/PropertiesSplitDesktop";
import { PremisesMobile } from "@/components/admin/properties-v1/PremisesMobile";
import { PremisesListSelectionProvider } from "@/components/admin/properties-v1/PremisesListSelectionContext";
import { ModuleListingExportProvider } from "@/components/admin/ModuleListingExportContext";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { ContactV1Option } from "@/lib/repos/contactsV1";
import type { PremisesFlatFilters, PremisesListItem, PremisesV1 } from "@/lib/repos/premisesV1";
import type { PropertyV1, PropertyV1SelectOption } from "@/lib/repos/propertiesV1";
import type { PremisesDrawerData } from "@/lib/repos/premisesDrawer";

export function AllPremisesWorkspace({
  rows,
  totalCount,
  filters,
  cities,
  districts,
  companies,
  contacts,
  propertyOptions,
  drawerData,
  selectedBuildingProperty,
  selectedBuildingPremises,
}: {
  rows: PremisesListItem[];
  totalCount: number;
  filters: PremisesFlatFilters;
  cities: string[];
  districts: string[];
  companies: CompanyV1Option[];
  contacts: ContactV1Option[];
  propertyOptions: PropertyV1SelectOption[];
  drawerData: PremisesDrawerData | null;
  selectedBuildingProperty: PropertyV1 | null;
  selectedBuildingPremises: PremisesV1[];
}) {
  const viewProps = {
    rows,
    totalCount,
    filters,
    cities,
    districts,
    companies,
    contacts,
    propertyOptions,
    drawerData,
    selectedBuildingProperty,
    selectedBuildingPremises,
  };

  return (
    <PremisesListSelectionProvider>
      <ModuleListingExportProvider>
        <Suspense fallback={<AdminListLoadingFallback />}>
          <AdminViewportSwitch
            mobile={<PremisesMobile {...viewProps} />}
            desktop={<PropertiesSplitDesktop {...viewProps} />}
          />
        </Suspense>
      </ModuleListingExportProvider>
    </PremisesListSelectionProvider>
  );
}
