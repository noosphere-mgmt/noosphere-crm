import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { CompanyWorkspacePageClient } from "@/components/admin/connections/CompanyWorkspacePageClient";
import { resolveLegacyCompanyIdFromQuery } from "@/lib/companyDrawerResolve";
import { getCompanyDrawerData } from "@/lib/repos/connectionsDrawer";
import { listCompanyFeeDealRows } from "@/lib/repos/connectionOpportunities";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; mode?: string }>;
};

export default async function CompanyDetailPage({ params, searchParams }: Props) {
  const { id: idRaw } = await params;
  const sp = await searchParams;
  const legacyCompanyId = await resolveLegacyCompanyIdFromQuery(idRaw);
  if (legacyCompanyId == null) notFound();

  const data = await getCompanyDrawerData(legacyCompanyId);
  if (!data) notFound();

  const feeRows = await listCompanyFeeDealRows(legacyCompanyId).catch(() => []);

  return (
    <AdminShell title="" wide module="connections" hideHeader>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-100" />}>
        <CompanyWorkspacePageClient data={data} feeRows={feeRows} editMode={sp.mode === "edit"} />
      </Suspense>
    </AdminShell>
  );
}
