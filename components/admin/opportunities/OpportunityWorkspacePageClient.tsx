"use client";

import { useSearchParams } from "next/navigation";
import { AdvisoryWorkspaceShell } from "@/components/admin/workspace/AdvisoryWorkspaceShell";
import { OpportunityDocumentsTab } from "@/components/admin/opportunities/OpportunityDocumentsTab";
import { OpportunityOverviewTab } from "@/components/admin/opportunities/OpportunityOverviewTab";
import { OpportunityPartiesTab } from "@/components/admin/opportunities/OpportunityPartiesTab";
import { OpportunityProposedPremisesTab } from "@/components/admin/opportunities/OpportunityProposedPremisesTab";
import { OpportunityProposedServiceTab } from "@/components/admin/opportunities/OpportunityProposedServiceTab";
import { OpportunityTimelineTab } from "@/components/admin/opportunities/OpportunityTimelineTab";
import { OpportunityWorkspaceHeader } from "@/components/admin/opportunities/OpportunityWorkspaceHeader";
import { OpportunityWorkspaceTabs } from "@/components/admin/opportunities/OpportunityWorkspaceTabs";
import { getOpportunityTab } from "@/lib/opportunityDetailTab";
import { isProfServiceSalesRole } from "@/lib/opportunityValues";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";

export function OpportunityWorkspacePageClient({
  data,
  proposalsEnabled = false,
}: {
  data: OpportunityDetailData;
  proposalsEnabled?: boolean;
}) {
  const searchParams = useSearchParams();
  const tab = getOpportunityTab({ tab: searchParams.get("tab") });
  const editMode = searchParams.get("mode") === "edit" && tab === "overview";
  // Proposed needs the full workspace width for selection and side-by-side comparison.
  // Keep the advisory/KPI rail on Overview, where it supports review without compressing tables.

  function renderTab() {
    switch (tab) {
      case "overview":
        return (
          <OpportunityOverviewTab
            data={data}
            initialEditMode={editMode}
            proposalsEnabled={proposalsEnabled}
          />
        );
      case "parties":
        return <OpportunityPartiesTab data={data} />;
      case "proposed":
        return isProfServiceSalesRole(data.opportunity.sales_role) ? (
          <OpportunityProposedServiceTab data={data} />
        ) : (
          <OpportunityProposedPremisesTab
            data={data}
            proposalsEnabled={proposalsEnabled}
          />
        );
      case "timeline":
        return <OpportunityTimelineTab data={data} />;
      case "documents":
        return <OpportunityDocumentsTab data={data} proposalsEnabled={proposalsEnabled} />;
      default:
        return null;
    }
  }

  return (
    <AdvisoryWorkspaceShell
      header={
        <OpportunityWorkspaceHeader
          data={data}
          activeTab={tab}
          editMode={editMode}
        />
      }
      tabs={<OpportunityWorkspaceTabs opportunity={data.opportunity} />}
      showAssistToggle={false}
    >
      {renderTab()}
    </AdvisoryWorkspaceShell>
  );
}

/** @deprecated Use OpportunityWorkspacePageClient */
export const OpportunityDetailPageClient = OpportunityWorkspacePageClient;
