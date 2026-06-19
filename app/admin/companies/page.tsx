import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ConnectionsCompaniesPageClient } from "@/components/admin/connections/ConnectionsCompaniesPageClient";
import { ConnectionsListError } from "@/components/admin/connections/ConnectionsListError";
import { listConnectionCompanies } from "@/lib/repos/connections";
import { getCompanyDrawerData } from "@/lib/repos/connectionsDrawer";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ company?: string }> };

export default async function CompaniesListPage({ searchParams }: Props) {
  const sp = await searchParams;
  let rows: Awaited<ReturnType<typeof listConnectionCompanies>> = [];
  let loadError: string | null = null;

  try {
    rows = await listConnectionCompanies();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Database query failed";
  }

  const companyIdRaw = sp.company?.trim();
  const companyId = companyIdRaw ? Number.parseInt(companyIdRaw, 10) : NaN;
  let selectedCompany: Awaited<ReturnType<typeof getCompanyDrawerData>> = null;
  let drawerError: string | null = null;

  if (!loadError && Number.isFinite(companyId) && companyId > 0) {
    try {
      selectedCompany = await getCompanyDrawerData(companyId);
      if (!selectedCompany) drawerError = `Company #${companyId} was not found.`;
    } catch (err) {
      drawerError = err instanceof Error ? err.message : "Failed to load company.";
      selectedCompany = null;
    }
  }

  return (
    <AdminShell title="Connections" module="connections" wide hideHeader>
      {loadError ? (
        <ConnectionsListError message={loadError} />
      ) : (
        <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-slate-100" />}>
          <ConnectionsCompaniesPageClient rows={rows} selectedCompany={selectedCompany} drawerError={drawerError} />
        </Suspense>
      )}
    </AdminShell>
  );
}
