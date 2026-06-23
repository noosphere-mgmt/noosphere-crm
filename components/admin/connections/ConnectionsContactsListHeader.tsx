"use client";

import { AdminViewportSwitch } from "@/components/admin/layout/AdminViewportSwitch";
import { ConnectionsContactsListHeaderDesktop } from "@/components/admin/connections/ConnectionsContactsListHeaderDesktop";
import { ConnectionsContactsListHeaderMobile } from "@/components/admin/connections/ConnectionsContactsListHeaderMobile";
import type { Contact } from "@/lib/types/entities";

export function ConnectionsContactsListHeader({
  rows: _rows,
  onNewContact,
  exportSelectedIds = [],
}: {
  rows: Contact[];
  onNewContact: () => void;
  exportSelectedIds?: string[];
}) {
  return (
    <AdminViewportSwitch
      desktop={
        <ConnectionsContactsListHeaderDesktop
          onNewContact={onNewContact}
          exportSelectedIds={exportSelectedIds}
        />
      }
      mobile={<ConnectionsContactsListHeaderMobile onNewContact={onNewContact} />}
    />
  );
}
