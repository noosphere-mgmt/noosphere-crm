"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { OpportunityDetailHeader } from "@/components/admin/opportunities/OpportunityDetailHeader";
import { OpportunityDetailTabs } from "@/components/admin/opportunities/OpportunityDetailTabs";
import { OpportunityFeesTab } from "@/components/admin/opportunities/OpportunityFeesTab";
import { OpportunityNotesTab, OpportunityProposalsTab } from "@/components/admin/opportunities/OpportunityNotesTab";
import { OpportunityOverviewTab } from "@/components/admin/opportunities/OpportunityOverviewTab";
import { OpportunityPartiesTab } from "@/components/admin/opportunities/OpportunityPartiesTab";
import { OpportunityProposedPremisesTab } from "@/components/admin/opportunities/OpportunityProposedPremisesTab";
import { EntityActivitiesTab } from "@/components/admin/activities/EntityActivitiesTab";
import { getOpportunityTab } from "@/lib/opportunityDetailTab";
import { useIsMobile } from "@/lib/useIsMobile";
import { resolveCompanySelectValue, resolveContactSelectValue } from "@/lib/crmSelectOptions";
import type { OpportunityDetailData } from "@/lib/repos/opportunityDetail";

export function OpportunityDetailPageClient({ data }: { data: OpportunityDetailData }) {
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const tab = getOpportunityTab({ tab: searchParams.get("tab") });
  const editMode = !isMobile && searchParams.get("mode") === "edit" && tab === "overview";

  return (
    <div className="space-y-5">
      <OpportunityDetailHeader
        opportunity={data.opportunity}
        lastActivityDate={data.lastActivityDate}
        activeTab={tab}
        editMode={editMode}
      />
      <OpportunityDetailTabs opportunityId={data.opportunity.id} variant="page" />
      <div className="space-y-4">
      {tab === "overview" ? (
        <OpportunityOverviewTab data={data} initialEditMode={editMode} lastActivityDate={data.lastActivityDate} />
      ) : tab === "premises" ? (
        <OpportunityProposedPremisesTab data={data} />
      ) : tab === "parties" ? (
        <OpportunityPartiesTab data={data} />
      ) : tab === "fees" ? (
        <OpportunityFeesTab data={data} />
      ) : tab === "activities" ? (
        <EntityActivitiesTab
          activities={data.activities}
          defaults={{
            opportunity_business_id: data.opportunity.business_id ?? null,
            opportunity_name: data.opportunity.client_name,
            company_business_id: resolveCompanySelectValue(data.companies, data.opportunity.company_id) || null,
            company_name: data.opportunity.linked_company_name,
            contact_business_id: resolveContactSelectValue(data.contacts, data.opportunity.primary_contact_id) || null,
            contact_name: data.opportunity.primary_contact_name,
          }}
        />
      ) : tab === "notes" ? (
        <OpportunityNotesTab data={data} />
      ) : tab === "proposals" ? (
        isMobile ? (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            Proposal editing is available on desktop. Open this opportunity on a larger screen to manage proposals.
          </p>
        ) : (
          <OpportunityProposalsTab />
        )
      ) : null}
      {tab !== "overview" ? (
        <p className="text-sm text-slate-500">
          <Link href={`/admin/opportunities/${data.opportunity.id}`} className="text-emerald-800 hover:underline">
            Back to overview
          </Link>
        </p>
      ) : null}
      </div>
    </div>
  );
}
