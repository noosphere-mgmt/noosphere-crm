"use client";

import { PremisesFiltersBarDesktop } from "@/components/admin/properties-v1/PremisesFiltersBarDesktop";
import { PremisesListDesktop } from "@/components/admin/properties-v1/PremisesListDesktop";
import { PremisesListHeaderDesktop } from "@/components/admin/properties-v1/PremisesListHeaderDesktop";
import type { CompanyV1Option } from "@/lib/repos/companiesV1";
import type { ContactV1Option } from "@/lib/repos/contactsV1";
import type { PremisesFlatFilters, PremisesListItem } from "@/lib/repos/premisesV1";
import type { PropertyV1SelectOption } from "@/lib/repos/propertiesV1";
import type { PremisesDrawerData } from "@/lib/repos/premisesDrawer";

export type PremisesViewProps = {
  rows: PremisesListItem[];
  totalCount: number;
  filters: PremisesFlatFilters;
  cities: string[];
  districts: string[];
  companies: CompanyV1Option[];
  contacts: ContactV1Option[];
  propertyOptions: PropertyV1SelectOption[];
  drawerData: PremisesDrawerData | null;
};

/** Workstation layout: module header, inline filters, sortable table. */
export function PremisesDesktop(props: PremisesViewProps) {
  return (
    <>
      <PremisesListHeaderDesktop />
      <PremisesFiltersBarDesktop filters={props.filters} cities={props.cities} districts={props.districts} />
      <PremisesListDesktop {...props} />
    </>
  );
}
