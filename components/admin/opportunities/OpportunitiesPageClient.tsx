"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OpportunitiesListClient } from "@/components/admin/opportunities/OpportunitiesListClient";
import { OpportunityFormDrawer } from "@/components/admin/opportunities/OpportunityFormDrawer";
import { OpportunitiesListSelectionProvider } from "@/components/admin/opportunities/OpportunitiesListSelectionContext";
import { ModuleListingExportProvider } from "@/components/admin/ModuleListingExportContext";
import {
  buildOpportunitiesReturnTo,
  opportunityCreateHref,
} from "@/lib/opportunitiesDrawerNav";
import { opportunityWorkspaceHref } from "@/lib/opportunityWorkspaceNav";
import type { OpportunitiesDashboardStage, OpportunitiesListStatusFilter } from "@/lib/opportunitiesList";
import type { ContactOption } from "@/lib/repos/contacts";
import type { Opportunity, OpportunityStatus } from "@/lib/types/entities";

type CompanyOption = { id: number; company_name: string };

export function OpportunitiesPageClient({
  rows,
  companies,
  contacts,
  initialListStatusFilter,
  initialLegacyStatuses,
  initialDashboardStage,
}: {
  rows: Opportunity[];
  companies: CompanyOption[];
  contacts: ContactOption[];
  initialListStatusFilter?: OpportunitiesListStatusFilter;
  initialLegacyStatuses?: OpportunityStatus[];
  initialDashboardStage?: OpportunitiesDashboardStage;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createOpen = searchParams.get("new") === "1";
  const returnTo = buildOpportunitiesReturnTo(searchParams);

  const openWorkspace = useCallback(
    (row: Opportunity) => {
      router.push(opportunityWorkspaceHref(row, "overview", undefined, returnTo));
    },
    [router, returnTo],
  );

  const openCreateDrawer = useCallback(() => {
    router.push(opportunityCreateHref(searchParams));
  }, [router, searchParams]);

  const openCaptureDrawer = useCallback(() => {
    router.push(opportunityCreateHref(searchParams, undefined, true));
  }, [router, searchParams]);

  const closeCreateDrawer = useCallback(() => {
    router.replace(returnTo);
  }, [router, returnTo]);

  const companyIdParam = searchParams.get("company_id");
  const fixedCompanyId = companyIdParam ? Number.parseInt(companyIdParam, 10) : undefined;

  return (
    <OpportunitiesListSelectionProvider>
      <ModuleListingExportProvider>
        <OpportunitiesListClient
          rows={rows}
          onOpenWorkspace={openWorkspace}
          onNewOpportunity={openCreateDrawer}
          onCaptureRequirement={openCaptureDrawer}
          initialListStatusFilter={initialListStatusFilter}
          initialLegacyStatuses={initialLegacyStatuses}
          initialDashboardStage={initialDashboardStage}
        />
        {createOpen ? (
          <OpportunityFormDrawer
            open
            onClose={closeCreateDrawer}
            companies={companies}
            contacts={contacts}
            fixedCompanyId={Number.isFinite(fixedCompanyId) ? fixedCompanyId : undefined}
            returnTo={returnTo}
            startWithCapture={searchParams.get("capture") === "1"}
          />
        ) : null}
      </ModuleListingExportProvider>
    </OpportunitiesListSelectionProvider>
  );
}
