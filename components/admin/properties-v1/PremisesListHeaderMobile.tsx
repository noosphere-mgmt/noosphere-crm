"use client";

import { ModuleListingBulkActions } from "@/components/admin/ModuleBulkActionButtons";
import { PropertiesModuleToolbar } from "@/components/admin/properties-v1/PropertiesModuleToolbar";

export function PremisesListHeaderMobile() {
  return (
    <PropertiesModuleToolbar
      trailing={
        <ModuleListingBulkActions
          variant="export-only"
          compact
          module="properties"
          importObjectType="premises"
          selectedCount={0}
          someSelected={false}
          selectedIds={[]}
        />
      }
    />
  );
}
