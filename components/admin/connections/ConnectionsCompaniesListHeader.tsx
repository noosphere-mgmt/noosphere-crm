"use client";

import { AdminViewportSwitch } from "@/components/admin/layout/AdminViewportSwitch";
import { ConnectionsCompaniesListHeaderDesktop } from "@/components/admin/connections/ConnectionsCompaniesListHeaderDesktop";
import { ConnectionsModuleToolbar } from "@/components/admin/connections/ConnectionsModuleToolbar";
import type { ConnectionCompanyListRow } from "@/lib/connectionsDisplay";

export function ConnectionsCompaniesListHeader({ rows: _rows }: { rows: ConnectionCompanyListRow[] }) {
  return (
    <AdminViewportSwitch
      desktop={<ConnectionsCompaniesListHeaderDesktop />}
      mobile={<ConnectionsModuleToolbar createHref="/admin/companies/new" createLabel="New company" />}
    />
  );
}
