"use client";

import { ModuleListingBulkActions } from "@/components/admin/ModuleBulkActionButtons";
import { OpportunitiesModuleToolbar } from "@/components/admin/opportunities/OpportunitiesModuleToolbar";

export function OpportunitiesListHeaderMobile({ onNewOpportunity }: { onNewOpportunity: () => void }) {
  return (
    <OpportunitiesModuleToolbar
      onCreate={onNewOpportunity}
      createLabel="New opportunity"
      trailing={
        <ModuleListingBulkActions
          variant="export-only"
          compact
          module="opportunities"
          importObjectType="opportunities"
          selectedCount={0}
          someSelected={false}
          selectedIds={[]}
        />
      }
    />
  );
}
