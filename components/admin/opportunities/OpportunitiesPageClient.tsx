"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OpportunitiesListClient } from "@/components/admin/opportunities/OpportunitiesListClient";
import { OpportunityDrawer } from "@/components/admin/opportunities/OpportunityDrawer";
import { OpportunityFormDrawer } from "@/components/admin/opportunities/OpportunityFormDrawer";
import { OpportunitiesListSelectionProvider } from "@/components/admin/opportunities/OpportunitiesListSelectionContext";
import { ModuleListingExportProvider } from "@/components/admin/ModuleListingExportContext";
import {
  buildOpportunitiesReturnTo,
  opportunityCreateHref,
  opportunityDrawerHref,
} from "@/lib/opportunitiesDrawerNav";
import type { OpportunityDrawerData } from "@/lib/repos/opportunitiesDrawer";
import type { ContactOption } from "@/lib/repos/contacts";
import type { Opportunity } from "@/lib/types/entities";
import type { OpportunitiesDashboardStage } from "@/lib/opportunitiesList";

type CompanyOption = { id: number; company_name: string };

export function OpportunitiesPageClient({
  rows,
  companies,
  contacts,
  selectedOpportunity,
  initialStatus,
  initialStage,
}: {
  rows: Opportunity[];
  companies: CompanyOption[];
  contacts: ContactOption[];
  selectedOpportunity: OpportunityDrawerData | null;
  initialStatus?: string;
  initialStage?: OpportunitiesDashboardStage;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openId = searchParams.get("opportunity")?.trim() ?? null;
  const createOpen = searchParams.get("new") === "1";
  const returnTo = useMemo(() => buildOpportunitiesReturnTo(searchParams), [searchParams]);

  const drawerData = useMemo(() => {
    if (!openId || !selectedOpportunity || String(selectedOpportunity.opportunity.id) !== openId) {
      return null;
    }
    return selectedOpportunity;
  }, [openId, selectedOpportunity]);

  const closeDrawer = useCallback(() => {
    router.replace(returnTo);
  }, [router, returnTo]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && openId) closeDrawer();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeDrawer, openId]);

  const openQuickView = useCallback(
    (id: number) => {
      router.push(opportunityDrawerHref(searchParams, id, "overview"));
    },
    [router, searchParams],
  );

  const openCreateDrawer = useCallback(() => {
    router.push(opportunityCreateHref(searchParams));
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
          onQuickView={openQuickView}
          onNewOpportunity={openCreateDrawer}
          initialStatus={initialStatus}
          initialStage={initialStage}
        />
        <OpportunityDrawer data={drawerData} onClose={closeDrawer} />
        <OpportunityFormDrawer
          open={createOpen}
          onClose={closeCreateDrawer}
          companies={companies}
          contacts={contacts}
          fixedCompanyId={Number.isFinite(fixedCompanyId) ? fixedCompanyId : undefined}
          returnTo={returnTo}
        />
      </ModuleListingExportProvider>
    </OpportunitiesListSelectionProvider>
  );
}
