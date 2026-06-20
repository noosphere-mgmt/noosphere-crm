"use client";

import { AdminViewportSwitch } from "@/components/admin/layout/AdminViewportSwitch";
import { ConnectionsCompaniesDesktop } from "@/components/admin/connections/ConnectionsCompaniesDesktop";
import { ConnectionsCompaniesMobile } from "@/components/admin/connections/ConnectionsCompaniesMobile";
import { useConnectionsCompaniesList } from "@/components/admin/connections/useConnectionsCompaniesList";
import type { ConnectionCompanyListRow } from "@/lib/connectionsDisplay";

export function ConnectionsCompaniesListClient({
  rows,
}: {
  rows: ConnectionCompanyListRow[];
}) {
  const state = useConnectionsCompaniesList(rows);

  return (
    <AdminViewportSwitch
      mobile={<ConnectionsCompaniesMobile state={state} />}
      desktop={<ConnectionsCompaniesDesktop state={state} />}
    />
  );
}
