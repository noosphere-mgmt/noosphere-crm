"use client";

import { AdminViewportSwitch } from "@/components/admin/layout/AdminViewportSwitch";
import { PremisesListHeaderDesktop } from "@/components/admin/properties-v1/PremisesListHeaderDesktop";
import { PremisesListHeaderMobile } from "@/components/admin/properties-v1/PremisesListHeaderMobile";

export function PremisesListHeader() {
  return (
    <AdminViewportSwitch
      mobile={<PremisesListHeaderMobile />}
      desktop={<PremisesListHeaderDesktop />}
    />
  );
}
