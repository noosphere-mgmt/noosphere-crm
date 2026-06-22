"use client";

import { AdminViewportSwitch } from "@/components/admin/layout/AdminViewportSwitch";
import { ConnectionsContactsDesktop } from "@/components/admin/connections/ConnectionsContactsDesktop";
import { ConnectionsContactsMobile } from "@/components/admin/connections/ConnectionsContactsMobile";
import { useConnectionsContactsList } from "@/components/admin/connections/useConnectionsContactsList";
import type { Contact } from "@/lib/types/entities";

export function ConnectionsContactsListClient({
  rows,
  onOpenContact,
  onOpenCompany,
  onNewContact,
}: {
  rows: Contact[];
  onOpenContact: (id: number | string) => void;
  onOpenCompany: (id: number | string) => void;
  onNewContact: () => void;
}) {
  const state = useConnectionsContactsList(rows);

  return (
    <AdminViewportSwitch
      mobile={
        <ConnectionsContactsMobile
          state={state}
          onOpenContact={onOpenContact}
          onNewContact={onNewContact}
        />
      }
      desktop={
        <ConnectionsContactsDesktop
          state={state}
          onOpenContact={onOpenContact}
          onOpenCompany={onOpenCompany}
          onNewContact={onNewContact}
        />
      }
    />
  );
}
