"use client";

import { OpportunitiesModuleToolbar } from "@/components/admin/opportunities/OpportunitiesModuleToolbar";

export function OpportunitiesListHeaderMobile({ onNewOpportunity }: { onNewOpportunity: () => void }) {
  return (
    <OpportunitiesModuleToolbar onCreate={onNewOpportunity} createLabel="New opportunity" />
  );
}
