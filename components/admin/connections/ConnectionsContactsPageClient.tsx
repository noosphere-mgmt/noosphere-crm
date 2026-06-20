"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ConnectionsContactsListClient } from "@/components/admin/connections/ConnectionsContactsListClient";
import { ContactDrawer } from "@/components/admin/connections/ContactDrawer";
import { ContactFormDrawer } from "@/components/admin/connections/ContactFormDrawer";
import { ConnectionsListSelectionProvider } from "@/components/admin/connections/ConnectionsListSelectionContext";
import { ModuleListingExportProvider } from "@/components/admin/ModuleListingExportContext";
import { DrawerLoadError } from "@/components/admin/connections/DrawerLoadError";
import {
  buildContactsReturnTo,
  companyDrawerHref,
  contactDrawerHref,
} from "@/lib/connectionsDrawerNav";
import type { Contact } from "@/lib/types/entities";
import type { ContactDrawerData } from "@/lib/repos/connectionsDrawer";

type CompanyOption = { id: number; company_name: string };

export function ConnectionsContactsPageClient({
  rows,
  companies,
  selectedContact,
  drawerError,
}: {
  rows: Contact[];
  companies: CompanyOption[];
  selectedContact: ContactDrawerData | null;
  drawerError?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openId = searchParams.get("contact")?.trim() ?? null;
  const createOpen = searchParams.get("new") === "1";
  const returnTo = useMemo(() => buildContactsReturnTo(searchParams), [searchParams]);

  const drawerData = useMemo(() => {
    if (!openId || !selectedContact || String(selectedContact.contact.id) !== openId) return null;
    return selectedContact;
  }, [openId, selectedContact]);

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

  const openContact = useCallback(
    (id: number, mode?: "edit") => {
      router.push(contactDrawerHref("/admin/contacts", searchParams, id, "overview", mode));
    },
    [router, searchParams],
  );

  const openCompany = useCallback(
    (id: number) => {
      router.push(companyDrawerHref("/admin/companies", new URLSearchParams(), id));
    },
    [router],
  );

  const openCreateDrawer = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("new", "1");
    router.push(`/admin/contacts?${params.toString()}`);
  }, [router, searchParams]);

  const closeCreateDrawer = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("new");
    params.delete("company_id");
    const qs = params.toString();
    router.push(qs ? `/admin/contacts?${qs}` : "/admin/contacts");
  }, [router, searchParams]);

  const companyIdParam = searchParams.get("company_id");
  const fixedCompanyId = companyIdParam ? Number.parseInt(companyIdParam, 10) : undefined;

  return (
    <ConnectionsListSelectionProvider>
      <ModuleListingExportProvider>
        <ConnectionsContactsListClient
          rows={rows}
          onOpenContact={openContact}
          onOpenCompany={openCompany}
          onNewContact={openCreateDrawer}
        />
        <ContactDrawer
          data={drawerData}
          onClose={closeDrawer}
          initialEditHighlight={searchParams.get("mode") === "edit"}
        />
        {openId && !drawerData ? (
          <DrawerLoadError
            label="contact"
            message={
              drawerError ??
              "This contact could not be loaded. It may have been deleted, or the database may need migration (run npm run db:migrate)."
            }
            onClose={closeDrawer}
          />
        ) : null}
        <ContactFormDrawer
          open={createOpen}
          onClose={closeCreateDrawer}
          companies={companies}
          fixedCompanyId={Number.isFinite(fixedCompanyId) ? fixedCompanyId : undefined}
          returnTo="/admin/contacts"
        />
      </ModuleListingExportProvider>
    </ConnectionsListSelectionProvider>
  );
}
