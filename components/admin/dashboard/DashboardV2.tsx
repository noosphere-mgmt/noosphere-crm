import { AdminViewportSwitch } from "@/components/admin/layout/AdminViewportSwitch";
import { DashboardDesktop } from "@/components/admin/dashboard/DashboardDesktop";
import { DashboardMobile } from "@/components/admin/dashboard/DashboardMobile";
import type { DashboardData } from "@/lib/repos/dashboard";

export function DashboardV2({ data }: { data: DashboardData }) {
  return (
    <AdminViewportSwitch
      mobile={<DashboardMobile data={data} />}
      desktop={<DashboardDesktop data={data} />}
    />
  );
}
