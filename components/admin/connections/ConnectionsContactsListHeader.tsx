"use client";

import { AdminViewportSwitch } from "@/components/admin/layout/AdminViewportSwitch";
import { ConnectionsContactsListHeaderDesktop } from "@/components/admin/connections/ConnectionsContactsListHeaderDesktop";
import { ConnectionsModuleToolbar } from "@/components/admin/connections/ConnectionsModuleToolbar";
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
      mobile={<ConnectionsModuleToolbar onCreate={onNewContact} createLabel="New contact" />}
    />
  );
}
