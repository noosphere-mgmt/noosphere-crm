"use client";

import { AdminViewportSwitch } from "@/components/admin/layout/AdminViewportSwitch";
import { ConnectionsCompaniesListHeaderDesktop } from "@/components/admin/connections/ConnectionsCompaniesListHeaderDesktop";
import { ConnectionsCompaniesListHeaderMobile } from "@/components/admin/connections/ConnectionsCompaniesListHeaderMobile";
import type { ConnectionCompanyListRow } from "@/lib/connectionsDisplay";

export function ConnectionsCompaniesListHeader({
  rows: _rows,
  exportSelectedIds = [],
}: {
  rows: ConnectionCompanyListRow[];
  exportSelectedIds?: string[];
}) {
  return (
    <AdminViewportSwitch
      desktop={<ConnectionsCompaniesListHeaderDesktop exportSelectedIds={exportSelectedIds} />}
      mobile={<ConnectionsCompaniesListHeaderMobile />}
    />
  );
}
