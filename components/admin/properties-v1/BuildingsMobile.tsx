"use client";

import { BuildingsLookupList } from "@/components/admin/properties-v1/BuildingsLookupList";
import { PropertiesModuleToolbar } from "@/components/admin/properties-v1/PropertiesModuleToolbar";
import { PropertiesMobileSearchBar } from "@/components/admin/properties-v1/PropertiesMobileSearchBar";
import type { BuildingsViewProps } from "@/components/admin/properties-v1/BuildingsDesktop";

/** Phone layout: compact toolbar, lookup cards, drawer detail. */
export function BuildingsMobile(props: BuildingsViewProps) {
  return (
    <>
      <PropertiesModuleToolbar />
      <PropertiesMobileSearchBar initialQuery={props.initialQuery} />
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
    </>
  );
}
