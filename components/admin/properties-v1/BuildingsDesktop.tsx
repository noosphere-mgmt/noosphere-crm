"use client";

import { Suspense } from "react";
import { PropertiesBuildingsListHeader } from "@/components/admin/properties-v1/PropertiesBuildingsListHeader";
import { PropertiesFlatListClient, type PropertyListRow } from "@/components/admin/properties-v1/PropertiesFlatListClient";
import { PropertiesSearchBar } from "@/components/admin/properties-v1/PropertiesSearchBar";
import type { PropertyV1, PropertyV1SelectOption } from "@/lib/repos/propertiesV1";
import type { PremisesV1 } from "@/lib/repos/premisesV1";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { ContactV1Option } from "@/lib/repos/contactsV1";

export type BuildingsViewProps = {
  rows: PropertyListRow[];
  totalCount: number;
  initialQuery?: string;
  selectedProperty: PropertyV1 | null;
  selectedPremises: PremisesV1[];
  propertyOptions: PropertyV1SelectOption[];
  companies: CompanyV1Option[];
  contacts: ContactV1Option[];
};

/** Workstation layout: full header, bordered search, dense property table. */
export function BuildingsDesktop(props: BuildingsViewProps) {
  return (
    <>
      <Suspense fallback={<div className="mb-4 h-[104px] animate-pulse rounded-xl bg-slate-100" />}>
        <PropertiesBuildingsListHeader rows={props.rows} />
      </Suspense>
      <Suspense fallback={<div className="mb-4 h-11 animate-pulse rounded-lg bg-slate-100" />}>
        <PropertiesSearchBar initialQuery={props.initialQuery} />
      </Suspense>
      <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-slate-100" />}>
        <PropertiesFlatListClient
          rows={props.rows}
          totalCount={props.totalCount}
          hasSearch={Boolean(props.initialQuery)}
          selectedProperty={props.selectedProperty}
          selectedPremises={props.selectedPremises}
          companies={props.companies}
          contacts={props.contacts}
          propertyOptions={props.propertyOptions}
        />
      </Suspense>
    </>
  );
}
