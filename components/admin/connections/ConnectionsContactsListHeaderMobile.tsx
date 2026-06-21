"use client";

import { ModuleListingBulkActions } from "@/components/admin/ModuleBulkActionButtons";
import { ConnectionsModuleToolbar } from "@/components/admin/connections/ConnectionsModuleToolbar";

export function ConnectionsContactsListHeaderMobile({ onNewContact }: { onNewContact: () => void }) {
  return (
    <ConnectionsModuleToolbar
      onCreate={onNewContact}
      createLabel="New contact"
      trailing={
        <ModuleListingBulkActions
          variant="export-only"
          compact
          module="connections"
          importObjectType="contacts"
          selectedCount={0}
          someSelected={false}
          selectedIds={[]}
        />
      }
    />
  );
}
