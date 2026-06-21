import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ConnectionsCompaniesPageClient } from "@/components/admin/connections/ConnectionsCompaniesPageClient";
import { ConnectionsListError } from "@/components/admin/connections/ConnectionsListError";
import { AdminListLoadingFallback } from "@/components/admin/layout/AdminListLoadingFallback";
import { resolveLegacyCompanyIdFromQuery } from "@/lib/companyDrawerResolve";
import { listConnectionCompanies } from "@/lib/repos/connections";
import { getCompanyDrawerData } from "@/lib/repos/connectionsDrawer";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ company?: string }> };

export default async function CompaniesListPage({ searchParams }: Props) {
  const sp = await searchParams;
  const companyIdRaw = sp.company?.trim();

  let rows: Awaited<ReturnType<typeof listConnectionCompanies>> = [];
  let loadError: string | null = null;
  let legacyCompanyId: number | null = null;

  try {
    const [listRows, resolvedId] = await Promise.all([
      listConnectionCompanies(),
      companyIdRaw ? resolveLegacyCompanyIdFromQuery(companyIdRaw) : Promise.resolve(null),
    ]);
    rows = listRows;
    legacyCompanyId = resolvedId;
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Database query failed";
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

  return (
    <AdminShell title="Connections" module="connections" wide hideHeader>
      {loadError ? (
        <ConnectionsListError message={loadError} />
      ) : (
        <Suspense fallback={<AdminListLoadingFallback />}>
          <ConnectionsCompaniesPageClient rows={rows} selectedCompany={selectedCompany} drawerError={drawerError} />
        </Suspense>
      )}
    </AdminShell>
  );
}
