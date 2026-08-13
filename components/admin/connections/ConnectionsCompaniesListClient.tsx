"use client";

import { AdminViewportSwitch } from "@/components/admin/layout/AdminViewportSwitch";
import { ConnectionsCompaniesFlatDesktop } from "@/components/admin/connections/ConnectionsCompaniesFlatDesktop";
import { ConnectionsCompaniesMobile } from "@/components/admin/connections/ConnectionsCompaniesMobile";
import { useConnectionsCompaniesList } from "@/components/admin/connections/useConnectionsCompaniesList";
import type { ConnectionCompanyListRow } from "@/lib/connectionsDisplay";
import type { Contact } from "@/lib/types/entities";

export function ConnectionsCompaniesListClient({
  rows,
  contacts,
}: {
  rows: ConnectionCompanyListRow[];
  contacts: Contact[];
}) {
  const state = useConnectionsCompaniesList(rows, contacts);

  return (
    <AdminViewportSwitch
      mobile={<ConnectionsCompaniesMobile state={state} />}
      desktop={<ConnectionsCompaniesFlatDesktop state={state} />}
    />
  );
}
