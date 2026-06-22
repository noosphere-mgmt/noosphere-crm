import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ConnectionsContactsPageClient } from "@/components/admin/connections/ConnectionsContactsPageClient";
import { ConnectionsListError } from "@/components/admin/connections/ConnectionsListError";
import { AdminListLoadingFallback } from "@/components/admin/layout/AdminListLoadingFallback";
import { resolveContactQueryParam } from "@/lib/contactDrawerResolve";
import { classifyContactQueryParam } from "@/lib/entityRefGuards";
import { listCompanyOptions } from "@/lib/repos/companies";
import { listContacts } from "@/lib/repos/contacts";
import { getContactDrawerData } from "@/lib/repos/connectionsDrawer";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ contact?: string }> };

export default async function ContactsListPage({ searchParams }: Props) {
  const sp = await searchParams;
  let rows: Awaited<ReturnType<typeof listContacts>> = [];
  let companies: Awaited<ReturnType<typeof listCompanyOptions>> = [];
  let loadError: string | null = null;

  try {
    [rows, companies] = await Promise.all([listContacts(), listCompanyOptions()]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Database query failed";
  }

  const contactIdRaw = sp.contact?.trim();
  let selectedContact: Awaited<ReturnType<typeof getContactDrawerData>> = null;
  let drawerError: string | null = null;

  if (!loadError && contactIdRaw) {
    const precheck = classifyContactQueryParam(contactIdRaw);
    if (precheck?.kind === "company_mismatch") {
      redirect(`/admin/companies?company=${encodeURIComponent(precheck.redirectToCompany)}`);
    }

    const resolved = await resolveContactQueryParam(contactIdRaw);
    if (resolved?.kind === "company_mismatch") {
      redirect(`/admin/companies?company=${encodeURIComponent(resolved.redirectToCompany)}`);
    }
    if (resolved?.kind === "contact") {
      try {
        selectedContact = await getContactDrawerData(resolved.legacyContactId);
        if (!selectedContact) drawerError = `Contact #${resolved.legacyContactId} was not found.`;
      } catch (err) {
        drawerError = err instanceof Error ? err.message : "Failed to load contact.";
        selectedContact = null;
      }
    } else {
      drawerError = `Contact "${contactIdRaw}" was not found.`;
    }
  }

  return (
    <AdminShell title="Connections" module="connections" wide hideHeader>
      {loadError ? (
        <ConnectionsListError message={loadError} />
      ) : (
        <Suspense fallback={<AdminListLoadingFallback />}>
          <ConnectionsContactsPageClient
            rows={rows}
            companies={companies}
            selectedContact={selectedContact}
            drawerQuery={contactIdRaw ?? null}
            drawerError={drawerError}
          />
        </Suspense>
      )}
    </AdminShell>
  );
}
