"use client";

import { AdminViewportSwitch } from "@/components/admin/layout/AdminViewportSwitch";
import { PremisesListDesktop } from "@/components/admin/properties-v1/PremisesListDesktop";
import { PremisesListMobile } from "@/components/admin/properties-v1/PremisesListMobile";
import type { PremisesListComponentProps } from "@/components/admin/properties-v1/usePremisesFlatList";

export function PremisesFlatListClient(props: PremisesListComponentProps) {
  return (
    <AdminViewportSwitch
      mobile={<PremisesListMobile {...props} />}
      desktop={<PremisesListDesktop {...props} />}
    />
  );
}
