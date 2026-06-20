"use client";

import { AdminViewportSwitch } from "@/components/admin/layout/AdminViewportSwitch";
import { PremisesDesktop } from "@/components/admin/properties-v1/PremisesDesktop";
import { PremisesMobile } from "@/components/admin/properties-v1/PremisesMobile";
import { PremisesListSelectionProvider } from "@/components/admin/properties-v1/PremisesListSelectionContext";
import { ModuleListingExportProvider } from "@/components/admin/ModuleListingExportContext";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { ContactV1Option } from "@/lib/repos/contactsV1";
import type { PremisesFlatFilters, PremisesListItem } from "@/lib/repos/premisesV1";
import type { PropertyV1SelectOption } from "@/lib/repos/propertiesV1";
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
  };

  return (
    <PremisesListSelectionProvider>
      <ModuleListingExportProvider>
        <AdminViewportSwitch
          mobile={<PremisesMobile {...viewProps} />}
          desktop={<PremisesDesktop {...viewProps} />}
        />
      </ModuleListingExportProvider>
    </PremisesListSelectionProvider>
  );
}
