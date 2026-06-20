"use client";

import { AdminViewportSwitch } from "@/components/admin/layout/AdminViewportSwitch";
import { OpportunitiesDesktop } from "@/components/admin/opportunities/OpportunitiesDesktop";
import { OpportunitiesMobile } from "@/components/admin/opportunities/OpportunitiesMobile";
import { useOpportunitiesList } from "@/components/admin/opportunities/useOpportunitiesList";
import type { OpportunitiesDashboardStage } from "@/lib/opportunitiesList";
import type { Opportunity } from "@/lib/types/entities";

export function OpportunitiesListClient({
  rows,
  onQuickView,
  onNewOpportunity,
  initialStatus,
  initialStage,
}: {
  rows: Opportunity[];
  onQuickView: (id: number) => void;
  onNewOpportunity: () => void;
  initialStatus?: string;
  initialStage?: OpportunitiesDashboardStage;
}) {
  const state = useOpportunitiesList(rows, initialStatus, initialStage);

  return (
    <AdminViewportSwitch
      mobile={
        <OpportunitiesMobile state={state} onQuickView={onQuickView} onNewOpportunity={onNewOpportunity} />
      }
      desktop={
        <OpportunitiesDesktop state={state} onQuickView={onQuickView} onNewOpportunity={onNewOpportunity} />
      }
    />
  );
}
