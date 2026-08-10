import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { OpportunitiesListError } from "@/components/admin/opportunities/OpportunitiesListError";
import { OpportunitiesPageClient } from "@/components/admin/opportunities/OpportunitiesPageClient";
import { AdminListLoadingFallback } from "@/components/admin/layout/AdminListLoadingFallback";
import { opportunityFullPageHref } from "@/lib/crmDetailNav";
import { normalizeOpportunityTab } from "@/lib/opportunityDetailTab";
import { resolveOpportunityQueryParam } from "@/lib/opportunityDrawerResolve";
import { getOpportunity } from "@/lib/repos/opportunities";
import { listCompanyOptions } from "@/lib/repos/companies";
import { listContactOptions } from "@/lib/repos/contacts";
import { listOpportunities } from "@/lib/repos/opportunities";
import { parseOpportunitiesListParams } from "@/lib/opportunitiesList";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ opportunity?: string; status?: string; stage?: string; new?: string; tab?: string }>;
};

export default async function OpportunitiesListPage({ searchParams }: Props) {
  const sp = await searchParams;
  const needFormOptions = sp.new === "1";

  const opportunityIdRaw = sp.opportunity?.trim();
  if (opportunityIdRaw && sp.new !== "1") {
    const legacyId = await resolveOpportunityQueryParam(opportunityIdRaw);
    if (legacyId) {
      const opportunity = await getOpportunity(legacyId);
      if (opportunity) {
        const href =
          opportunityFullPageHref(opportunity.business_id ?? opportunity.v1_opportunity_id, {
            tab: normalizeOpportunityTab(sp.tab),
          }) ?? `/admin/opportunities/${legacyId}`;
        redirect(href);
      }
    }
  }

  let rows: Awaited<ReturnType<typeof listOpportunities>> = [];
  let companies: Awaited<ReturnType<typeof listCompanyOptions>> = [];
  let contacts: Awaited<ReturnType<typeof listContactOptions>> = [];
  let loadError: string | null = null;

  try {
    [rows, companies, contacts] = await Promise.all([
      listOpportunities(),
      needFormOptions ? listCompanyOptions() : Promise.resolve([]),
      needFormOptions ? listContactOptions() : Promise.resolve([]),
    ]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Database query failed";
  }

  const listParams = parseOpportunitiesListParams(sp.status, sp.stage);

  return (
    <AdminShell title="Opportunities" module="opportunities" wide hideHeader>
      {loadError ? (
        <OpportunitiesListError message={loadError} />
      ) : (
        <Suspense fallback={<AdminListLoadingFallback />}>
          <OpportunitiesPageClient
            rows={rows}
            companies={companies}
            contacts={contacts}
            initialListStatusFilter={listParams.listStatusFilter}
            initialLegacyStatuses={listParams.legacyStatuses}
            initialDashboardStage={listParams.dashboardStage}
          />
        </Suspense>
      )}
    </AdminShell>
  );
}
