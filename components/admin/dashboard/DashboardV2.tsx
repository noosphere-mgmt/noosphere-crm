import { DashboardDesktop } from "@/components/admin/dashboard/DashboardDesktop";
import type { DashboardData } from "@/lib/repos/dashboard";
import type { Opportunity } from "@/lib/types/entities";

export type DashboardViewData = {
  dashboard: DashboardData;
  deals: Opportunity[];
};

export function DashboardV2({ data }: { data: DashboardViewData }) {
  // Keep one responsive information architecture on every device.  The old
  // mobile-only dashboard had different sections and metrics from desktop.
  return <DashboardDesktop data={data} />;
}
