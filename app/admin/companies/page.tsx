import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ConnectionsCompaniesPageClient } from "@/components/admin/connections/ConnectionsCompaniesPageClient";
import { ConnectionsListError } from "@/components/admin/connections/ConnectionsListError";
import { AdminListLoadingFallback } from "@/components/admin/layout/AdminListLoadingFallback";
import { resolveCompanyQueryParam } from "@/lib/companyDrawerResolve";
import { resolveContactQueryParam } from "@/lib/contactDrawerResolve";
import { listConnectionCompanies } from "@/lib/repos/connections";
import { listContacts } from "@/lib/repos/contacts";
import { getCompanyDrawerData, getContactDrawerData } from "@/lib/repos/connectionsDrawer";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ company?: string; contact?: string }> };

export default async function CompaniesListPage({ searchParams }: Props) {
  const sp = await searchParams;
  const companyIdRaw = sp.company?.trim();
  const contactIdRaw = sp.contact?.trim();

  let rows: Awaited<ReturnType<typeof listConnectionCompanies>> = [];
  let contacts: Awaited<ReturnType<typeof listContacts>> = [];
  let loadError: string | null = null;
  let legacyCompanyId: number | null = null;

  try {
    [rows, contacts] = await Promise.all([listConnectionCompanies(), listContacts()]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Database query failed";
  }

  if (!loadError && companyIdRaw) {
    const resolved = await resolveCompanyQueryParam(companyIdRaw);
    if (resolved?.kind === "contact_mismatch") {
      redirect(`/admin/contacts?contact=${encodeURIComponent(resolved.redirectToContact)}`);
    }
    if (resolved?.kind === "company") {
      legacyCompanyId = resolved.legacyCompanyId;
    }
  }

  let selectedCompany: Awaited<ReturnType<typeof getCompanyDrawerData>> = null;
  let drawerError: string | null = null;

  if (!loadError && legacyCompanyId != null) {
    try {
      selectedCompany = await getCompanyDrawerData(legacyCompanyId);
      if (!selectedCompany) drawerError = `Company was not found.`;
    } catch (err) {
      drawerError = err instanceof Error ? err.message : "Failed to load company.";
      selectedCompany = null;
    }
  } else if (!loadError && companyIdRaw) {
    drawerError = `Company "${companyIdRaw}" was not found.`;
  }

  let selectedContact: Awaited<ReturnType<typeof getContactDrawerData>> = null;
  let contactDrawerError: string | null = null;
  if (!loadError && contactIdRaw) {
    const resolved = await resolveContactQueryParam(contactIdRaw);
    if (resolved?.kind === "contact") {
      try {
        selectedContact = await getContactDrawerData(resolved.legacyContactId);
        if (!selectedContact) contactDrawerError = `Contact "${contactIdRaw}" was not found.`;
      } catch (err) {
        contactDrawerError = err instanceof Error ? err.message : "Failed to load contact.";
      }
    } else {
      contactDrawerError = `Contact "${contactIdRaw}" was not found.`;
    }
  }

  return (
    <AdminShell title="Connections" module="connections" wide hideHeader>
      {loadError ? (
        <ConnectionsListError message={loadError} />
      ) : (
        <Suspense fallback={<AdminListLoadingFallback />}>
          <ConnectionsCompaniesPageClient
            rows={rows}
            contacts={contacts}
            selectedCompany={selectedCompany}
            drawerQuery={companyIdRaw ?? null}
            drawerError={drawerError}
            selectedContact={selectedContact}
            contactDrawerQuery={contactIdRaw ?? null}
            contactDrawerError={contactDrawerError}
          />
        </Suspense>
      )}
    </AdminShell>
  );
}
