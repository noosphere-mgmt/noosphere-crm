import { DashboardDesktop } from "@/components/admin/dashboard/DashboardDesktop";
import type { DashboardData } from "@/lib/repos/dashboard";
import type { Opportunity } from "@/lib/types/entities";

export type DashboardViewData = {
  dashboard: DashboardData;
  deals: Opportunity[];
};

export function DashboardV2({ data, ownerName }: { data: DashboardViewData; ownerName?: string }) {
  return <DashboardDesktop data={data} ownerName={ownerName} />;
}
