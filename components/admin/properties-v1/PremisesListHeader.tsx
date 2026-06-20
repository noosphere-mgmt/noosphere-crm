"use client";

import { AdminViewportSwitch } from "@/components/admin/layout/AdminViewportSwitch";
import { PremisesListHeaderDesktop } from "@/components/admin/properties-v1/PremisesListHeaderDesktop";
import { PropertiesModuleToolbar } from "@/components/admin/properties-v1/PropertiesModuleToolbar";

export function PremisesListHeader() {
  return (
    <AdminViewportSwitch
      mobile={<PropertiesModuleToolbar />}
      desktop={<PremisesListHeaderDesktop />}
    />
  );
}
