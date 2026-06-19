import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { OpportunitiesListError } from "@/components/admin/opportunities/OpportunitiesListError";
import { OpportunitiesPageClient } from "@/components/admin/opportunities/OpportunitiesPageClient";
import { listCompanyOptions } from "@/lib/repos/companies";
import { listContactOptions } from "@/lib/repos/contacts";
import { listOpportunities } from "@/lib/repos/opportunities";
import { getOpportunityDrawerData } from "@/lib/repos/opportunitiesDrawer";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ opportunity?: string; status?: string; stage?: string }>;
};

export default async function OpportunitiesListPage({ searchParams }: Props) {
  const sp = await searchParams;
  let rows: Awaited<ReturnType<typeof listOpportunities>> = [];
  let companies: Awaited<ReturnType<typeof listCompanyOptions>> = [];
  let contacts: Awaited<ReturnType<typeof listContactOptions>> = [];
  let loadError: string | null = null;

  try {
    [rows, companies, contacts] = await Promise.all([
      listOpportunities(),
      listCompanyOptions(),
      listContactOptions(),
    ]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Database query failed";
  }

  const opportunityIdRaw = sp.opportunity?.trim();
  const opportunityId = opportunityIdRaw ? Number.parseInt(opportunityIdRaw, 10) : NaN;
  let selectedOpportunity: Awaited<ReturnType<typeof getOpportunityDrawerData>> = null;

  if (!loadError && Number.isFinite(opportunityId) && opportunityId > 0) {
    try {
      selectedOpportunity = await getOpportunityDrawerData(opportunityId);
    } catch {
      selectedOpportunity = null;
    }
  }

  return (
    <AdminShell title="Opportunities" module="opportunities" wide hideHeader>
      {loadError ? (
        <OpportunitiesListError message={loadError} />
      ) : (
        <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-slate-100" />}>
          <OpportunitiesPageClient
            rows={rows}
            companies={companies}
            contacts={contacts}
            selectedOpportunity={selectedOpportunity}
            initialStatus={sp.status?.trim() || undefined}
            initialStage={
              sp.stage === "open" || sp.stage === "viewing" || sp.stage === "won_month"
                ? sp.stage
                : undefined
            }
          />
        </Suspense>
      )}
    </AdminShell>
  );
}
