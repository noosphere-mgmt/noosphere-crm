"use client";

import { ModuleListingBulkActions } from "@/components/admin/ModuleBulkActionButtons";
import { BuildingsLookupList } from "@/components/admin/properties-v1/BuildingsLookupList";
import { PropertiesModuleToolbar } from "@/components/admin/properties-v1/PropertiesModuleToolbar";
import { PropertiesMobileSearchBar } from "@/components/admin/properties-v1/PropertiesMobileSearchBar";
import type { BuildingsViewProps } from "@/components/admin/properties-v1/BuildingsDesktop";

/** Phone layout: compact toolbar, lookup cards, drawer detail. */
export function BuildingsMobile(props: BuildingsViewProps) {
  const filteredIds = props.rows.map((row) => row.property_id);

  return (
    <>
      <PropertiesModuleToolbar
        trailing={
          <ModuleListingBulkActions
            variant="export-only"
            compact
            module="properties"
            importObjectType="buildings"
            selectedCount={0}
            someSelected={false}
            selectedIds={[]}
            filteredIds={filteredIds}
          />
        }
      />
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
