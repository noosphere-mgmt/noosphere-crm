"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { EntityActivitiesTab } from "@/components/admin/activities/EntityActivitiesTab";
import { OpportunityInlineOverview } from "@/components/admin/opportunities/OpportunityInlineOverview";
import { OpportunityProposedPremisesTab } from "@/components/admin/opportunities/OpportunityProposedPremisesTab";
import { OpportunityProposalsTab } from "@/components/admin/opportunities/OpportunityProposalsTab";
import { getOpportunityTab } from "@/lib/opportunityDetailTab";
import { isProfServiceSalesRole } from "@/lib/opportunityValues";
import { opportunityWorkspaceHref } from "@/lib/opportunityWorkspaceNav";
import type { OpportunityDrawerData } from "@/lib/repos/opportunitiesDrawer";
import { resolveCompanySelectValue, resolveContactSelectValue } from "@/lib/crmSelectOptions";

export function OpportunityDrawerBody({ data }: { data: OpportunityDrawerData }) {
  const searchParams = useSearchParams();
  const tab = getOpportunityTab({ tab: searchParams.get("tab") });
  const { opportunity } = data;

  if (tab === "overview") {
    return <OpportunityInlineOverview data={data} />;
  }

  if (tab === "proposed") {
    if (isProfServiceSalesRole(opportunity.sales_role)) {
      return (
        <p className="text-sm text-slate-600">
          Proposed properties are not applicable for service opportunities.
        </p>
      );
    }
    return <OpportunityProposedPremisesTab data={data} />;
  }

  if (tab === "documents") {
    return <OpportunityProposalsTab data={data} proposalsEnabled />;
  }

  if (tab === "timeline") {
    return (
      <EntityActivitiesTab
        activities={data.activities}
        defaults={{
          opportunity_business_id: opportunity.business_id?.trim() || String(opportunity.id),
          opportunity_name: opportunity.client_name,
          company_business_id: resolveCompanySelectValue(data.companies, opportunity.company_id) || null,
          company_name: opportunity.linked_company_name,
          contact_business_id: resolveContactSelectValue(data.contacts, opportunity.primary_contact_id) || null,
          contact_name: opportunity.primary_contact_name,
        }}
      />
    );
  }

  return (
    <p className="text-sm text-slate-600">
      This section is available on the{" "}
      <Link href={opportunityWorkspaceHref(opportunity, tab)} className="text-emerald-800 hover:underline">
        workspace
      </Link>
      .
    </p>
  );
}
