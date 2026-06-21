"use client";

import { PremisesFiltersBarMobile } from "@/components/admin/properties-v1/PremisesFiltersBarMobile";
import { PremisesListMobile } from "@/components/admin/properties-v1/PremisesListMobile";
import { PremisesListHeaderMobile } from "@/components/admin/properties-v1/PremisesListHeaderMobile";
import type { PremisesViewProps } from "@/components/admin/properties-v1/PremisesDesktop";

/** Phone layout: compact toolbar, search + filter sheet, card list. */
export function PremisesMobile(props: PremisesViewProps) {
  return (
    <>
      <PremisesListHeaderMobile />
      <PremisesFiltersBarMobile filters={props.filters} cities={props.cities} districts={props.districts} />
      <PremisesListMobile {...props} />
    </>
  );
}
