import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { CompanyWorkspacePageClient } from "@/components/admin/connections/CompanyWorkspacePageClient";
import { sanitizeAdminReturnTo } from "@/lib/adminReturnTo";
import { resolveLegacyCompanyIdFromQuery } from "@/lib/companyDrawerResolve";
import { getCompanyDrawerData } from "@/lib/repos/connectionsDrawer";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; mode?: string; returnTo?: string }>;
};

export default async function CompanyDetailPage({ params, searchParams }: Props) {
  const { id: idRaw } = await params;
  const sp = await searchParams;
  const returnTo = sanitizeAdminReturnTo(sp.returnTo, "/admin/companies");
  const legacyCompanyId = await resolveLegacyCompanyIdFromQuery(idRaw);
  if (legacyCompanyId == null) notFound();

  const data = await getCompanyDrawerData(legacyCompanyId);
  if (!data) notFound();

  return (
    <AdminShell title="" wide module="connections" hideHeader>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-100" />}>
        <CompanyWorkspacePageClient
          data={data}
          editMode={sp.mode === "edit"}
          returnTo={returnTo}
        />
      </Suspense>
    </AdminShell>
  );
}
