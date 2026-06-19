import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ConnectionsContactsPageClient } from "@/components/admin/connections/ConnectionsContactsPageClient";
import { ConnectionsListError } from "@/components/admin/connections/ConnectionsListError";
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
  const contactId = contactIdRaw ? Number.parseInt(contactIdRaw, 10) : NaN;
  let selectedContact: Awaited<ReturnType<typeof getContactDrawerData>> = null;
  let drawerError: string | null = null;

  if (!loadError && Number.isFinite(contactId) && contactId > 0) {
    try {
      selectedContact = await getContactDrawerData(contactId);
      if (!selectedContact) drawerError = `Contact #${contactId} was not found.`;
    } catch (err) {
      drawerError = err instanceof Error ? err.message : "Failed to load contact.";
      selectedContact = null;
    }
  }

  return (
    <AdminShell title="Connections" module="connections" wide hideHeader>
      {loadError ? (
        <ConnectionsListError message={loadError} />
      ) : (
        <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-slate-100" />}>
          <ConnectionsContactsPageClient rows={rows} companies={companies} selectedContact={selectedContact} drawerError={drawerError} />
        </Suspense>
      )}
    </AdminShell>
  );
}
