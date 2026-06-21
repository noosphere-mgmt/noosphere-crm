"use client";

import { ConnectionsModuleToolbar } from "@/components/admin/connections/ConnectionsModuleToolbar";

export function ConnectionsCompaniesListHeaderMobile() {
  return (
    <ConnectionsModuleToolbar createHref="/admin/companies/new" createLabel="New company" />
  );
}
