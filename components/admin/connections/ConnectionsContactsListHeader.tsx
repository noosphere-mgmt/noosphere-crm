"use client";

import { AdminViewportSwitch } from "@/components/admin/layout/AdminViewportSwitch";
import { ConnectionsContactsListHeaderDesktop } from "@/components/admin/connections/ConnectionsContactsListHeaderDesktop";
import { ConnectionsContactsListHeaderMobile } from "@/components/admin/connections/ConnectionsContactsListHeaderMobile";
import type { Contact } from "@/lib/types/entities";

export function ConnectionsContactsListHeader({
  rows: _rows,
  onNewContact,
}: {
  rows: Contact[];
  onNewContact: () => void;
}) {
  return (
    <AdminViewportSwitch
      desktop={<ConnectionsContactsListHeaderDesktop onNewContact={onNewContact} />}
      mobile={<ConnectionsContactsListHeaderMobile onNewContact={onNewContact} />}
    />
  );
}
