"use client";

import { ModuleListingBulkActions } from "@/components/admin/ModuleBulkActionButtons";
import { ConnectionsModuleToolbar } from "@/components/admin/connections/ConnectionsModuleToolbar";

export function ConnectionsCompaniesListHeaderMobile() {
  return (
    <ConnectionsModuleToolbar
      createHref="/admin/companies/new"
      createLabel="New company"
      trailing={
        <ModuleListingBulkActions
          variant="export-only"
          compact
          module="connections"
          importObjectType="companies"
          selectedCount={0}
          someSelected={false}
          selectedIds={[]}
        />
      }
    />
  );
}
