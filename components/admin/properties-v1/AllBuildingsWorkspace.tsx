"use client";

import { Suspense } from "react";
import { PropertiesBuildingsListHeader } from "@/components/admin/properties-v1/PropertiesBuildingsListHeader";
import { PropertiesFlatListClient, type PropertyListRow } from "@/components/admin/properties-v1/PropertiesFlatListClient";
import { PropertiesListSelectionProvider } from "@/components/admin/properties-v1/PropertiesListSelectionContext";
import { PropertiesSearchBar } from "@/components/admin/properties-v1/PropertiesSearchBar";
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
  return (
    <PropertiesListSelectionProvider>
      <Suspense fallback={<div className="mb-4 h-[104px] animate-pulse rounded-xl bg-slate-100" />}>
        <PropertiesBuildingsListHeader rows={rows} />
      </Suspense>

      <Suspense fallback={<div className="mb-4 h-11 animate-pulse rounded-lg bg-slate-100" />}>
        <PropertiesSearchBar initialQuery={initialQuery} />
      </Suspense>

      <p className="mb-4 text-sm text-slate-600">
        Property building records. Premises lines are managed from All Premises or inside each property.
      </p>

      <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-slate-100" />}>
        <PropertiesFlatListClient
          rows={rows}
          totalCount={totalCount}
          hasSearch={Boolean(initialQuery)}
          selectedProperty={selectedProperty}
          selectedPremises={selectedPremises}
          companies={companies}
          contacts={contacts}
          propertyOptions={propertyOptions}
        />
      </Suspense>
    </PropertiesListSelectionProvider>
  );
}
