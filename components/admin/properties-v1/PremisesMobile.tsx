"use client";

import { Suspense } from "react";
import { PremisesFiltersBarMobile } from "@/components/admin/properties-v1/PremisesFiltersBarMobile";
import { PremisesListMobile } from "@/components/admin/properties-v1/PremisesListMobile";
import { PropertiesModuleToolbar } from "@/components/admin/properties-v1/PropertiesModuleToolbar";
import type { PremisesViewProps } from "@/components/admin/properties-v1/PremisesDesktop";

/** Phone layout: compact toolbar, search + filter sheet, card list. */
export function PremisesMobile(props: PremisesViewProps) {
  return (
    <>
      <Suspense fallback={<div className="mb-2 h-10 animate-pulse rounded-md bg-slate-100" />}>
        <PropertiesModuleToolbar />
      </Suspense>
      <Suspense fallback={<div className="mb-2 h-12 animate-pulse rounded-md bg-slate-100" />}>
        <PremisesFiltersBarMobile filters={props.filters} cities={props.cities} districts={props.districts} />
      </Suspense>
      <Suspense fallback={<div className="h-48 animate-pulse rounded-md bg-slate-100" />}>
        <PremisesListMobile {...props} />
      </Suspense>
    </>
  );
}
