"use client";

import { AdminViewportSwitch } from "@/components/admin/layout/AdminViewportSwitch";
import { PremisesFiltersBarDesktop } from "@/components/admin/properties-v1/PremisesFiltersBarDesktop";
import { PremisesFiltersBarMobile } from "@/components/admin/properties-v1/PremisesFiltersBarMobile";
import type { PremisesFiltersBarProps } from "@/components/admin/properties-v1/usePremisesFiltersBar";

export function PremisesFiltersBar(props: PremisesFiltersBarProps) {
  return (
    <AdminViewportSwitch
      mobile={<PremisesFiltersBarMobile {...props} />}
      desktop={<PremisesFiltersBarDesktop {...props} />}
    />
  );
}
