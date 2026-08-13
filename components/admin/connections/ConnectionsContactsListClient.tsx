"use client";

import { AdminViewportSwitch } from "@/components/admin/layout/AdminViewportSwitch";
import { ConnectionsCompaniesDesktop } from "@/components/admin/connections/ConnectionsCompaniesDesktop";
import { ConnectionsContactsMobile } from "@/components/admin/connections/ConnectionsContactsMobile";
import { useConnectionsCompaniesList } from "@/components/admin/connections/useConnectionsCompaniesList";
import { useConnectionsContactsList } from "@/components/admin/connections/useConnectionsContactsList";
import type { ConnectionCompanyListRow } from "@/lib/connectionsDisplay";
import type { Contact } from "@/lib/types/entities";

function ContactsSplitDesktop({
  companies,
  contacts,
  onNewContact,
}: {
  companies: ConnectionCompanyListRow[];
  contacts: Contact[];
  onNewContact: (companyId?: number) => void;
}) {
  const state = useConnectionsCompaniesList(companies, contacts);
  return (
    <ConnectionsCompaniesDesktop state={state} contacts={contacts} onNewContact={onNewContact} />
  );
}

function ContactsFlatMobile({
  rows,
  onOpenContact,
  onNewContact,
}: {
  rows: Contact[];
  onOpenContact: (id: number | string) => void;
  onNewContact: () => void;
}) {
  const state = useConnectionsContactsList(rows);
  return (
    <ConnectionsContactsMobile
      state={state}
      onOpenContact={onOpenContact}
      onNewContact={onNewContact}
    />
  );
}

export function ConnectionsContactsListClient({
  rows,
  companies,
  onOpenContact,
  onNewContact,
}: {
  rows: Contact[];
  companies: ConnectionCompanyListRow[];
  onOpenContact: (id: number | string) => void;
  onOpenCompany?: (id: number | string) => void;
  onNewContact: (companyId?: number) => void;
}) {
  return (
    <AdminViewportSwitch
      mobile={
        <ContactsFlatMobile
          rows={rows}
          onOpenContact={onOpenContact}
          onNewContact={() => onNewContact()}
        />
      }
      desktop={
        <ContactsSplitDesktop companies={companies} contacts={rows} onNewContact={onNewContact} />
      }
    />
  );
}
