"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { EntityActivitiesTab } from "@/components/admin/activities/EntityActivitiesTab";
import { OpportunityFeesTab } from "@/components/admin/opportunities/OpportunityFeesTab";
import { OpportunityInlineOverview } from "@/components/admin/opportunities/OpportunityInlineOverview";
import { OpportunityNotesInline } from "@/components/admin/opportunities/OpportunityNotesInline";
import { OpportunityPartiesTab } from "@/components/admin/opportunities/OpportunityPartiesTab";
import { OpportunityProposedPremisesTab } from "@/components/admin/opportunities/OpportunityProposedPremisesTab";
import { getOpportunityTab } from "@/lib/opportunityDetailTab";
import { opportunityDetailHref } from "@/lib/opportunityDetailNav";
import type { OpportunityDrawerData } from "@/lib/repos/opportunitiesDrawer";
import { resolveCompanySelectValue, resolveContactSelectValue } from "@/lib/crmSelectOptions";

export function OpportunityDrawerBody({ data }: { data: OpportunityDrawerData }) {
  const searchParams = useSearchParams();
  const tab = getOpportunityTab({ tab: searchParams.get("tab") });
  const { opportunity } = data;

  if (tab === "overview") {
    return <OpportunityInlineOverview data={data} />;
  }

  if (tab === "premises") {
    return <OpportunityProposedPremisesTab data={data} />;
  }

  if (tab === "parties") {
    return <OpportunityPartiesTab data={data} />;
  }

  if (tab === "fees") {
    return <OpportunityFeesTab data={data} />;
  }

  if (tab === "activities") {
    return (
      <EntityActivitiesTab
        activities={data.activities}
        defaults={{
          opportunity_business_id: opportunity.business_id ?? null,
          opportunity_name: opportunity.client_name,
          company_business_id: resolveCompanySelectValue(data.companies, opportunity.company_id) || null,
          company_name: opportunity.linked_company_name,
          contact_business_id: resolveContactSelectValue(data.contacts, opportunity.primary_contact_id) || null,
          contact_name: opportunity.primary_contact_name,
        }}
      />
    );
  }

  if (tab === "notes") {
    return <OpportunityNotesInline data={data} />;
  }

  return (
    <p className="text-sm text-slate-600">
      This section is available on the{" "}
      <Link href={opportunityDetailHref(opportunity.id, tab)} className="text-emerald-800 hover:underline">
        full detail page
      </Link>
      .
    </p>
  );
}
