"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CompanyDrawer } from "@/components/admin/connections/CompanyDrawer";
import { ConnectionsCompaniesListClient } from "@/components/admin/connections/ConnectionsCompaniesListClient";
import { ConnectionsListSelectionProvider } from "@/components/admin/connections/ConnectionsListSelectionContext";
import { ModuleListingExportProvider } from "@/components/admin/ModuleListingExportContext";
import { DrawerLoadError } from "@/components/admin/connections/DrawerLoadError";
import { shouldShowConnectionsDrawer } from "@/lib/connectionsDrawerMatch";
import { buildCompaniesReturnTo } from "@/lib/connectionsDrawerNav";
import type { ConnectionCompanyListRow } from "@/lib/connectionsDisplay";
import type { CompanyDrawerData } from "@/lib/repos/connectionsDrawer";

export function ConnectionsCompaniesPageClient({
  rows,
  selectedCompany,
  drawerQuery,
  drawerError,
}: {
  rows: ConnectionCompanyListRow[];
  selectedCompany: CompanyDrawerData | null;
  drawerQuery?: string | null;
  drawerError?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openId = searchParams.get("company")?.trim() ?? null;
  const returnTo = useMemo(() => buildCompaniesReturnTo(searchParams), [searchParams]);

  const drawerData = useMemo(() => {
    if (
      !shouldShowConnectionsDrawer(
        openId,
        drawerQuery,
        selectedCompany,
        selectedCompany?.company.id,
        selectedCompany?.v1CompanyId,
      )
    ) {
      return null;
    }
    return selectedCompany;
  }, [openId, drawerQuery, selectedCompany]);

  const closeDrawer = useCallback(() => {
    router.replace(returnTo);
  }, [router, returnTo]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && openId) closeDrawer();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeDrawer, openId]);

  return (
    <ConnectionsListSelectionProvider>
      <ModuleListingExportProvider>
        <ConnectionsCompaniesListClient rows={rows} />
        <CompanyDrawer
          data={drawerData}
          onClose={closeDrawer}
          initialEditHighlight={searchParams.get("mode") === "edit"}
          fullEdit={searchParams.get("mode") === "full"}
        />
        {openId && !drawerData ? (
          <DrawerLoadError
            label="company"
            message={
              drawerError ??
              "This company could not be loaded. It may have been deleted, or the database may need migration (run npm run db:migrate)."
            }
            onClose={closeDrawer}
          />
        ) : null}
      </ModuleListingExportProvider>
    </ConnectionsListSelectionProvider>
  );
}
