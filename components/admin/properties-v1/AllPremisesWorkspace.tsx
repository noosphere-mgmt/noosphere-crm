"use client";

import { Suspense } from "react";
import { PremisesFiltersBar } from "@/components/admin/properties-v1/PremisesFiltersBar";
import { PremisesFlatListClient } from "@/components/admin/properties-v1/PremisesFlatListClient";
import { PremisesListHeader } from "@/components/admin/properties-v1/PremisesListHeader";
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
  return (
    <PremisesListSelectionProvider>
      <ModuleListingExportProvider>
        <Suspense fallback={<div className="mb-4 h-[104px] animate-pulse rounded-xl bg-slate-100" />}>
          <PremisesListHeader />
        </Suspense>

      <Suspense fallback={<div className="mb-4 h-20 animate-pulse rounded-lg bg-slate-100" />}>
        <PremisesFiltersBar filters={filters} cities={cities} districts={districts} />
      </Suspense>

      <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-slate-100" />}>
        <PremisesFlatListClient
          rows={rows}
          totalCount={totalCount}
          initialFilters={filters}
          companies={companies}
          contacts={contacts}
          propertyOptions={propertyOptions}
          drawerData={drawerData}
        />
      </Suspense>
      </ModuleListingExportProvider>
    </PremisesListSelectionProvider>
  );
}
