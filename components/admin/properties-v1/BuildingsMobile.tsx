"use client";

import { Suspense } from "react";
import { BuildingsLookupList } from "@/components/admin/properties-v1/BuildingsLookupList";
import { PropertiesModuleToolbar } from "@/components/admin/properties-v1/PropertiesModuleToolbar";
import { PropertiesMobileSearchBar } from "@/components/admin/properties-v1/PropertiesMobileSearchBar";
import type { BuildingsViewProps } from "@/components/admin/properties-v1/BuildingsDesktop";

/** Phone layout: compact toolbar, lookup cards, drawer detail. */
export function BuildingsMobile(props: BuildingsViewProps) {
  return (
    <>
      <Suspense fallback={<div className="mb-2 h-10 animate-pulse rounded-md bg-slate-100" />}>
        <PropertiesModuleToolbar />
      </Suspense>
      <Suspense fallback={<div className="mb-2 h-9 animate-pulse rounded-md bg-slate-100" />}>
        <PropertiesMobileSearchBar initialQuery={props.initialQuery} />
      </Suspense>
      <Suspense fallback={<div className="h-32 animate-pulse rounded-md bg-slate-100" />}>
        <BuildingsLookupList
          rows={props.rows}
          totalCount={props.totalCount}
          hasSearch={Boolean(props.initialQuery)}
          selectedProperty={props.selectedProperty}
          selectedPremises={props.selectedPremises}
          propertyOptions={props.propertyOptions}
          companies={props.companies}
          contacts={props.contacts}
        />
      </Suspense>
    </>
  );
}
