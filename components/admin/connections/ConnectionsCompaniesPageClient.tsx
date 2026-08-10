"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CompanyDrawer } from "@/components/admin/connections/CompanyDrawer";
import { ContactDrawer } from "@/components/admin/connections/ContactDrawer";
import { ConnectionsCompaniesListClient } from "@/components/admin/connections/ConnectionsCompaniesListClient";
import { ConnectionsListSelectionProvider } from "@/components/admin/connections/ConnectionsListSelectionContext";
import { ModuleListingExportProvider } from "@/components/admin/ModuleListingExportContext";
import { DrawerLoadError } from "@/components/admin/connections/DrawerLoadError";
import { shouldShowConnectionsDrawer } from "@/lib/connectionsDrawerMatch";
import { buildCompaniesReturnTo } from "@/lib/connectionsDrawerNav";
import type { ConnectionCompanyListRow } from "@/lib/connectionsDisplay";
import type { CompanyDrawerData, ContactDrawerData } from "@/lib/repos/connectionsDrawer";
import type { Contact } from "@/lib/types/entities";

export function ConnectionsCompaniesPageClient({
  rows,
  contacts,
  selectedCompany,
  drawerQuery,
  drawerError,
  selectedContact,
  contactDrawerQuery,
  contactDrawerError,
}: {
  rows: ConnectionCompanyListRow[];
  contacts: Contact[];
  selectedCompany: CompanyDrawerData | null;
  drawerQuery?: string | null;
  drawerError?: string | null;
  selectedContact: ContactDrawerData | null;
  contactDrawerQuery?: string | null;
  contactDrawerError?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openId = searchParams.get("company")?.trim() ?? null;
  const openContactId = searchParams.get("contact")?.trim() ?? null;
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

  const closeContactDrawer = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("contact");
    params.delete("tab");
    params.delete("mode");
    params.delete("return_to");
    const qs = params.toString();
    router.replace(qs ? `/admin/companies?${qs}` : "/admin/companies");
  }, [router, searchParams]);

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
        <ConnectionsCompaniesListClient rows={rows} contacts={contacts} />
        <CompanyDrawer
          data={drawerData}
          onClose={closeDrawer}
          initialEditHighlight={searchParams.get("mode") === "edit"}
          fullEdit={searchParams.get("mode") === "full"}
        />
        <ContactDrawer data={selectedContact} onClose={closeContactDrawer} />
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
        {openContactId && !selectedContact ? (
          <DrawerLoadError
            label="contact"
            message={contactDrawerError ?? `Contact "${contactDrawerQuery ?? openContactId}" could not be loaded.`}
            onClose={closeContactDrawer}
          />
        ) : null}
      </ModuleListingExportProvider>
    </ConnectionsListSelectionProvider>
  );
}
